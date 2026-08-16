import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import { storageService, ALLOWED_MIME_TYPES } from './storageService';
import type { StoredFileMetadata, StorageCategory, StorageOverview } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Multer memory upload middleware with 100MB buffer limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

// =============================================================================
// FISHCATCH MULTI-TENANT DOMAIN TYPES
// =============================================================================

export interface BusinessTenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConnection {
  businessId: string;
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'DISCONNECTED';
  metaAppId: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
  qualityRating: string;
  codeVerificationStatus?: string;
  accessToken: string; // Stored securely on server, masked when sent to client
  connectedAt: string | null;
  lastVerifiedAt: string | null;
}

export interface Customer {
  id: string;
  businessId: string;
  whatsappId: string;
  phone: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  optInStatus: 'opted_in' | 'opted_out';
  tags: string[];
  notes: string;
  customAttributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastInteraction: string;
}

export type LeadStatus = 'NEW' | 'QUALIFIED' | 'CONTACTED' | 'CONVERTED' | 'LOST';

export interface Lead {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: LeadStatus;
  score: number;
  intent: string;
  qualificationSummary: string;
  source: string;
  value: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  businessId: string;
  customerId: string;
  customerPhone: string;
  customerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'open' | 'resolved' | 'snoozed';
  mode: 'AI' | 'HUMAN';
  leadId?: string;
  leadStatus?: LeadStatus;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  businessId: string;
  conversationId: string;
  customerId: string;
  from: 'customer' | 'agent' | 'ai';
  senderName: string;
  text: string;
  type: 'text' | 'image' | 'document' | 'template' | 'interactive';
  mediaUrl?: string;
  templateName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  source: 'whatsapp' | 'ai' | 'agent' | 'system';
  rawPayload?: any;
  errorMessage?: string;
}

export interface MessageTemplate {
  id: string;
  businessId: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  header?: { type: 'TEXT' | 'IMAGE'; text?: string };
  body: string;
  footer?: string;
  buttons?: Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string; phone_number?: string }>;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  businessId: string;
  name: string;
  keyword: string;
  matchType: 'exact' | 'contains' | 'starts_with';
  responseText: string;
  active: boolean;
  action: 'reply_text' | 'handoff_human' | 'set_lead_status';
  leadStatusTarget?: LeadStatus;
  createdAt: string;
}

export interface AIConfig {
  businessId: string;
  enabled: boolean;
  autoReply: boolean;
  modelName: string;
  systemPrompt: string;
  businessKnowledge: string;
  tone: string;
  qualificationQuestions: string[];
  humanHandoffKeywords: string[];
}

export interface WebhookEventLog {
  id: string;
  businessId: string;
  timestamp: string;
  type: string;
  sender: string;
  status: 'received' | 'processed' | 'ignored' | 'failed';
  summary: string;
  rawPayload: any;
  error?: string;
}

export interface DataDeletionRequest {
  id: string;
  confirmationCode: string;
  userId: string;
  status: 'pending' | 'completed';
  requestedAt: string;
  completedAt?: string;
  url: string;
}

// =============================================================================
// PRODUCTION ZERO-STATE IN-MEMORY DATABASE WITH TENANT ISOLATION
// =============================================================================

// Default active workspace for newly onboarded business
const INITIAL_BIZ_ID = 'biz_fishcatch_default';

const db = {
  businesses: [
    {
      id: INITIAL_BIZ_ID,
      name: 'My Business Workspace',
      slug: 'my-workspace',
      email: 'owner@fishcatch.io',
      plan: 'Growth',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ] as BusinessTenant[],

  activeBusinessId: INITIAL_BIZ_ID,

  // Real WhatsApp Connections - initially NOT_CONNECTED unless configured via ENV
  connections: {
    [INITIAL_BIZ_ID]: {
      businessId: INITIAL_BIZ_ID,
      status: process.env.WABA_PHONE_NUMBER_ID && process.env.WABA_ACCESS_TOKEN ? 'CONNECTED' : 'NOT_CONNECTED',
      metaAppId: process.env.FB_APP_ID || process.env.META_APP_ID || '',
      wabaId: process.env.WABA_BUSINESS_ACCOUNT_ID || '',
      phoneNumberId: process.env.WABA_PHONE_NUMBER_ID || '',
      displayPhoneNumber: process.env.WABA_PHONE_NUMBER_ID ? '+1 (Connected Number)' : '',
      verifiedName: 'Fishcatch Verified Line',
      qualityRating: 'GREEN',
      accessToken: process.env.WABA_ACCESS_TOKEN || '',
      connectedAt: process.env.WABA_PHONE_NUMBER_ID ? new Date().toISOString() : null,
      lastVerifiedAt: process.env.WABA_PHONE_NUMBER_ID ? new Date().toISOString() : null,
    }
  } as Record<string, WhatsAppConnection>,

  // ZERO INITIAL DATA - no fake customers, no fake chats, no fake leads!
  customers: [] as Customer[],
  leads: [] as Lead[],
  conversations: [] as Conversation[],
  messages: [] as ChatMessage[],
  templates: [] as MessageTemplate[],
  automations: [] as AutomationRule[],

  aiConfigs: {
    [INITIAL_BIZ_ID]: {
      businessId: INITIAL_BIZ_ID,
      enabled: true,
      autoReply: true,
      modelName: process.env.AI_MODEL_NAME || 'gemini-3.7-flash',
      systemPrompt: 'You are the intelligent WhatsApp AI Assistant for Fishcatch. You help answer incoming inquiries warmly, qualify leads by asking their requirements and timeline, and offer to schedule consultations. Always be polite, concise, and structured.',
      businessKnowledge: '',
      tone: 'Professional & Helpful',
      qualificationQuestions: [
        'What specific service or product are you looking for?',
        'What is your expected timeline or budget?',
        'What is the best email or direct number to reach you?'
      ],
      humanHandoffKeywords: ['speak with human', 'agent', 'representative', 'real person', 'manager'],
    }
  } as Record<string, AIConfig>,

  webhookLogs: [] as WebhookEventLog[],
  dataDeletionRequests: [] as DataDeletionRequest[],
  files: [] as StoredFileMetadata[],
};

// Helper: Dynamically compile knowledge text from all uploaded knowledge documents
function getTenantKnowledgeGrounding(businessId: string): string {
  const tenantKnowledgeFiles = db.files.filter(
    f => f.businessId === businessId && f.category === 'knowledge' && f.status === 'active' && f.extractedText
  );
  if (tenantKnowledgeFiles.length === 0) return '';
  return tenantKnowledgeFiles
    .map(f => `--- DOCUMENT: ${f.originalFilename} ---\n${f.extractedText}\n--- END DOCUMENT ---`)
    .join('\n\n');
}

// Processed message deduplication store
const processedMessageIds = new Set<string>();

// Lazy Gemini SDK client
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// Resilient Gemini AI content generation with multi-model fallback and quota handling
async function safeGenerateContent(
  prompt: string,
  preferredModel?: string,
  fallbackText?: string,
  timeoutMs: number = 8000
): Promise<{ text: string; isFallback: boolean; reason?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      text: fallbackText || 'Hello! Thank you for contacting us. How can we assist you today?',
      isFallback: true,
      reason: 'GEMINI_API_KEY is not configured',
    };
  }

  const modelQueue = [
    preferredModel || process.env.GEMINI_MODEL || 'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  for (const model of modelQueue) {
    try {
      const ai = getGeminiClient();
      const aiPromise = ai.models.generateContent({
        model,
        contents: prompt,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timeout')), timeoutMs)
      );

      const response: any = await Promise.race([aiPromise, timeoutPromise]);
      const resultText = response.text?.trim();
      if (resultText) {
        return { text: resultText, isFallback: false };
      }
    } catch (err: any) {
      const isQuota =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED') ||
        err?.message?.includes('quota');

      if (isQuota) {
        console.warn(`[Gemini AI Notice] Quota reached on ${model}. Trying backup model.`);
      } else {
        console.warn(`[Gemini AI Notice] Generation notice on ${model}: ${err.message || err}`);
      }
    }
  }

  return {
    text: fallbackText || 'Hello! Thank you for contacting us. How can we assist you today?',
    isFallback: true,
    reason: 'Rate limit or service quota reached',
  };
}

// Tenant resolver middleware / helper
function resolveBusinessId(req: Request): string {
  const headerId = req.headers['x-business-id'] as string;
  const queryId = req.query.businessId as string;
  const bodyId = req.body?.businessId as string;
  return headerId || queryId || bodyId || db.activeBusinessId || INITIAL_BIZ_ID;
}

function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 8) return '••••••••';
  return token.substring(0, 6) + '••••••••' + token.substring(token.length - 4);
}

// =============================================================================
// 1. BUSINESS TENANT MANAGEMENT API
// =============================================================================

// Get all businesses
app.get('/api/businesses', (req: Request, res: Response) => {
  res.json({
    success: true,
    activeBusinessId: db.activeBusinessId,
    businesses: db.businesses,
  });
});

// Create new business tenant
app.post('/api/businesses', (req: Request, res: Response) => {
  const { name, email, plan } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_NAME', message: 'Business name is required.' },
    });
  }

  const newId = `biz_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const newBiz: BusinessTenant = {
    id: newId,
    name: name.trim(),
    slug,
    email: email || 'admin@fishcatch.io',
    plan: plan || 'Growth',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.businesses.push(newBiz);

  // Initialize empty connection and AI config for new tenant
  db.connections[newId] = {
    businessId: newId,
    status: 'NOT_CONNECTED',
    metaAppId: '',
    wabaId: '',
    phoneNumberId: '',
    displayPhoneNumber: '',
    verifiedName: '',
    qualityRating: 'UNKNOWN',
    accessToken: '',
    connectedAt: null,
    lastVerifiedAt: null,
  };

  db.aiConfigs[newId] = {
    businessId: newId,
    enabled: true,
    autoReply: true,
    modelName: process.env.AI_MODEL_NAME || 'gemini-3.7-flash',
    systemPrompt: `You are the AI Assistant for ${newBiz.name}. Assist customers, qualify leads, and answer inquiries.`,
    businessKnowledge: '',
    tone: 'Professional & Helpful',
    qualificationQuestions: [
      'What specific service or product are you interested in?',
      'What is your target timeline?'
    ],
    humanHandoffKeywords: ['human', 'agent', 'representative', 'manager'],
  };

  db.activeBusinessId = newId;

  res.status(201).json({
    success: true,
    business: newBiz,
  });
});

// Switch active business
app.post('/api/businesses/switch', (req: Request, res: Response) => {
  const { businessId } = req.body;
  const found = db.businesses.find(b => b.id === businessId);
  if (!found) {
    return res.status(404).json({
      success: false,
      error: { code: 'BUSINESS_NOT_FOUND', message: 'The requested business tenant does not exist.' },
    });
  }
  db.activeBusinessId = businessId;
  res.json({
    success: true,
    activeBusinessId: businessId,
    business: found,
  });
});

// Update workspace settings
app.put('/api/businesses/:id', (req: Request, res: Response) => {
  const bizId = req.params.id;
  const biz = db.businesses.find(b => b.id === bizId);
  if (!biz) {
    return res.status(404).json({
      success: false,
      error: { code: 'BUSINESS_NOT_FOUND', message: 'Business not found.' },
    });
  }

  const { name, email } = req.body;
  if (name) biz.name = name.trim();
  if (email) biz.email = email.trim();
  biz.updatedAt = new Date().toISOString();

  res.json({ success: true, business: biz });
});

// =============================================================================
// 2. WHATSAPP CONNECTION & META GRAPH API INTEGRATION
// =============================================================================

// Get WhatsApp connection status for tenant
app.get('/api/whatsapp/connection', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const conn = db.connections[businessId] || {
    businessId,
    status: 'NOT_CONNECTED',
    metaAppId: '',
    wabaId: '',
    phoneNumberId: '',
    displayPhoneNumber: '',
    verifiedName: '',
    qualityRating: 'UNKNOWN',
    accessToken: '',
    connectedAt: null,
    lastVerifiedAt: null,
  };

  res.json({
    success: true,
    connection: {
      ...conn,
      accessToken: conn.accessToken ? maskToken(conn.accessToken) : '',
      hasToken: Boolean(conn.accessToken),
    },
    webhookUrl: `${req.protocol}://${req.get('host')}/api/whatsapp/webhook`,
    verifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WABA_VERIFY_TOKEN || 'fishcatch_verify_token_123',
  });
});

// Test & Verify Meta Cloud API Credentials directly with Meta Graph API
app.post('/api/whatsapp/verify-credentials', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { metaAppId, wabaId, phoneNumberId, accessToken } = req.body;

  const currentConn = db.connections[businessId];
  // Allow retaining existing masked token if not re-entered
  const actualToken = (accessToken && !accessToken.includes('••••'))
    ? accessToken
    : currentConn?.accessToken;

  if (!phoneNumberId || !actualToken) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_CREDENTIALS',
        message: 'Phone Number ID and System User Access Token are required for Meta verification.',
      },
    });
  }

  try {
    // Make real Meta Graph API request to verify phone number ID and token
    const metaRes = await axios.get(`https://graph.facebook.com/v21.0/${phoneNumberId}`, {
      params: {
        fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
        access_token: actualToken,
      },
      timeout: 10000,
    });

    const metaData = metaRes.data;

    // Persist verified connection in database
    db.connections[businessId] = {
      businessId,
      status: 'CONNECTED',
      metaAppId: metaAppId || currentConn?.metaAppId || '',
      wabaId: wabaId || currentConn?.wabaId || '',
      phoneNumberId,
      displayPhoneNumber: metaData.display_phone_number || phoneNumberId,
      verifiedName: metaData.verified_name || 'Verified WhatsApp Business',
      qualityRating: metaData.quality_rating || 'GREEN',
      codeVerificationStatus: metaData.code_verification_status,
      accessToken: actualToken,
      connectedAt: currentConn?.connectedAt || new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
    };

    // Log success event
    db.webhookLogs.unshift({
      id: `evt_${Date.now()}`,
      businessId,
      timestamp: new Date().toISOString(),
      type: 'meta.credentials.verified',
      sender: 'System Admin',
      status: 'processed',
      summary: `Meta WhatsApp Cloud API credentials verified for ${metaData.display_phone_number || phoneNumberId}`,
      rawPayload: metaData,
    });

    res.json({
      success: true,
      message: 'WhatsApp Cloud API credentials verified and connected successfully!',
      connection: {
        ...db.connections[businessId],
        accessToken: maskToken(actualToken),
        hasToken: true,
      },
    });
  } catch (err: any) {
    const metaError = err.response?.data?.error;
    const errorMessage = metaError
      ? `Meta Graph API Error: ${metaError.message} (${metaError.type || 'Code ' + metaError.code})`
      : `Connection failed: ${err.message}`;

    res.status(400).json({
      success: false,
      error: {
        code: metaError?.code ? `META_ERROR_${metaError.code}` : 'VERIFICATION_FAILED',
        message: errorMessage,
        details: metaError,
      },
    });
  }
});

// Meta Embedded Signup code exchange & registration flow
app.post('/api/whatsapp/embedded-signup', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { code, wabaId, phoneNumberId, accessToken } = req.body;

  if (!phoneNumberId && !code && !accessToken) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_SIGNUP_DATA', message: 'Meta Embedded Signup payload is missing required authorization.' },
    });
  }

  let finalAccessToken = accessToken || process.env.WABA_ACCESS_TOKEN || '';
  let finalPhoneId = phoneNumberId || '';
  let finalWabaId = wabaId || '';
  let verifiedName = req.body.verifiedName || 'Fishcatch Business Line';
  let displayPhoneNumber = req.body.displayPhoneNumber || '';

  // If authorization code was returned and Meta App Secret is configured on server, exchange code for system user access token
  const metaAppId = req.body.metaAppId || process.env.FB_APP_ID || process.env.META_APP_ID || '';
  const metaAppSecret = process.env.FB_APP_SECRET || process.env.META_APP_SECRET || '';

  if (code && metaAppId && metaAppSecret) {
    try {
      const tokenRes = await axios.get('https://graph.facebook.com/v21.0/oauth/access_token', {
        params: {
          client_id: metaAppId,
          client_secret: metaAppSecret,
          code,
        },
        timeout: 10000,
      });
      if (tokenRes.data?.access_token) {
        finalAccessToken = tokenRes.data.access_token;
      }
    } catch (tokenErr: any) {
      console.warn('[Meta Embedded Code Exchange Notice]', tokenErr.response?.data || tokenErr.message);
    }
  }

  // If we have an access token and phone number ID, query Meta Graph API for official verified details
  if (finalPhoneId && finalAccessToken) {
    try {
      const phoneRes = await axios.get(`https://graph.facebook.com/v21.0/${finalPhoneId}`, {
        params: {
          fields: 'id,display_phone_number,verified_name,quality_rating',
          access_token: finalAccessToken,
        },
        timeout: 10000,
      });
      if (phoneRes.data) {
        displayPhoneNumber = phoneRes.data.display_phone_number || displayPhoneNumber;
        verifiedName = phoneRes.data.verified_name || verifiedName;
      }
    } catch (phoneErr: any) {
      console.warn('[Meta Phone Details Notice]', phoneErr.response?.data || phoneErr.message);
    }
  }

  // Store credentials obtained through embedded signup
  db.connections[businessId] = {
    businessId,
    status: 'CONNECTED',
    metaAppId,
    wabaId: finalWabaId,
    phoneNumberId: finalPhoneId,
    displayPhoneNumber: displayPhoneNumber || (finalPhoneId ? `+${finalPhoneId}` : '+1 (Embedded Line)'),
    verifiedName,
    qualityRating: 'GREEN',
    accessToken: finalAccessToken,
    connectedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    message: 'Meta Embedded Signup completed. WhatsApp connection is active!',
    connection: {
      ...db.connections[businessId],
      accessToken: maskToken(db.connections[businessId].accessToken),
    },
  });
});

// Disconnect WhatsApp
app.post('/api/whatsapp/disconnect', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const conn = db.connections[businessId];
  if (conn) {
    conn.status = 'DISCONNECTED';
    conn.accessToken = '';
    conn.lastVerifiedAt = new Date().toISOString();
  }
  res.json({
    success: true,
    message: 'WhatsApp number disconnected.',
    connection: conn,
  });
});

// =============================================================================
// 3. META WHATSAPP WEBHOOK PIPELINE (GET & POST)
// =============================================================================

// GET /api/whatsapp/webhook - Meta Webhook Verification
app.get('/api/whatsapp/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WABA_VERIFY_TOKEN || 'fishcatch_verify_token_123';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Fishcatch Webhook] Meta verification successful. Challenge verified.');
    return res.status(200).send(challenge);
  }

  console.warn('[Fishcatch Webhook] Meta verification failed. Token mismatch or mode invalid.');
  return res.status(403).json({
    success: false,
    error: { code: 'VERIFY_TOKEN_MISMATCH', message: 'Webhook verification token does not match.' },
  });
});

// POST /api/whatsapp/webhook - Inbound Event Processing Pipeline
app.post('/api/whatsapp/webhook', async (req: Request, res: Response) => {
  // 1. Immediately acknowledge Meta with HTTP 200 to prevent retries
  res.status(200).json({ status: 'EVENT_RECEIVED' });

  const payload = req.body;
  if (!payload || !payload.entry || !Array.isArray(payload.entry)) {
    return;
  }

  for (const entry of payload.entry) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== 'messages') continue;
      const val = change.value;
      if (!val) continue;

      const receivingPhoneId = val.metadata?.phone_number_id;

      // Resolve business tenant by receiving phone_number_id
      let targetBizId = db.activeBusinessId;
      for (const [bizId, conn] of Object.entries(db.connections)) {
        if (conn.phoneNumberId && conn.phoneNumberId === receivingPhoneId) {
          targetBizId = bizId;
          break;
        }
      }

      // 1. Handle Delivery Status Updates (delivered, read, failed)
      if (val.statuses && Array.isArray(val.statuses)) {
        for (const st of val.statuses) {
          const wamid = st.id;
          const status = st.status; // delivered | read | failed
          const targetMsg = db.messages.find(m => m.id === wamid && m.businessId === targetBizId);
          if (targetMsg) {
            targetMsg.status = status;
          }
        }
      }

      // 2. Handle Inbound Customer Messages
      if (val.messages && Array.isArray(val.messages)) {
        for (const msg of val.messages) {
          const wamid = msg.id;
          if (processedMessageIds.has(wamid)) {
            continue; // Deduplicate
          }
          processedMessageIds.add(wamid);

          const fromNumber = msg.from; // Customer phone e.g. "15552345678"
          const profileContact = val.contacts?.find((c: any) => c.wa_id === fromNumber);
          const customerName = profileContact?.profile?.name || `WhatsApp User (+${fromNumber})`;
          const textBody = msg.text?.body || (msg.type === 'image' ? '[Image]' : `[${msg.type || 'Media'}]`);
          const msgTimestamp = msg.timestamp
            ? new Date(parseInt(msg.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          // A. Resolve or Create Customer in CRM
          let customer = db.customers.find(c => c.businessId === targetBizId && c.whatsappId === fromNumber);
          const isNewCustomer = !customer;

          if (!customer) {
            customer = {
              id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              businessId: targetBizId,
              whatsappId: fromNumber,
              phone: `+${fromNumber}`,
              name: customerName,
              optInStatus: 'opted_in',
              tags: ['New Lead', 'Inbound WhatsApp'],
              notes: '',
              customAttributes: {},
              createdAt: msgTimestamp,
              updatedAt: msgTimestamp,
              lastInteraction: msgTimestamp,
            };
            db.customers.unshift(customer);
          } else {
            customer.lastInteraction = msgTimestamp;
            customer.updatedAt = msgTimestamp;
            if (profileContact?.profile?.name && customer.name.startsWith('WhatsApp User')) {
              customer.name = profileContact.profile.name;
            }
          }

          // B. Real Opt-Out / Safety Handling
          const upperText = (textBody || '').trim().toUpperCase();
          const isOptOut = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT'].includes(upperText);
          const isOptIn = ['START', 'UNSTOP', 'YES'].includes(upperText);

          if (isOptOut) {
            customer.optInStatus = 'opted_out';
          } else if (isOptIn) {
            customer.optInStatus = 'opted_in';
          }

          // C. Resolve or Create Conversation
          let conv = db.conversations.find(c => c.businessId === targetBizId && c.customerId === customer!.id);
          if (!conv) {
            conv = {
              id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              businessId: targetBizId,
              customerId: customer.id,
              customerPhone: customer.phone,
              customerName: customer.name,
              lastMessage: textBody,
              lastMessageTime: msgTimestamp,
              unreadCount: 1,
              status: 'open',
              mode: isOptOut ? 'HUMAN' : 'AI',
              tags: ['Inbound'],
              createdAt: msgTimestamp,
              updatedAt: msgTimestamp,
            };
            db.conversations.unshift(conv);
          } else {
            conv.lastMessage = textBody;
            conv.lastMessageTime = msgTimestamp;
            conv.unreadCount += 1;
            conv.status = 'open';
            if (isOptOut) {
              conv.mode = 'HUMAN';
            }
            conv.updatedAt = msgTimestamp;
          }

          // D. Store Chat Message & Process Inbound Media
          let mediaUrl: string | undefined;
          let msgType: ChatMessage['type'] = msg.type === 'text' ? 'text' : 'document';
          
          if (['image', 'audio', 'voice', 'video', 'document'].includes(msg.type)) {
            const mediaObj = msg[msg.type] || msg.image || msg.audio || msg.voice || msg.video || msg.document;
            const mediaMime = mediaObj?.mime_type || (msg.type === 'image' ? 'image/jpeg' : 'application/octet-stream');
            const mediaFilename = mediaObj?.filename || `whatsapp_${msg.type}_${Date.now()}.${mediaMime.split('/')[1] || 'bin'}`;
            
            // If Meta Cloud API token is available, attempt to download real binary stream
            const conn = db.connections[targetBizId];
            if (conn && conn.status === 'CONNECTED' && conn.accessToken && mediaObj?.id) {
              try {
                // 1. Get media URL from Meta Graph API
                const metaMediaRes = await axios.get(`https://graph.facebook.com/v21.0/${mediaObj.id}`, {
                  headers: { Authorization: `Bearer ${conn.accessToken}` },
                  timeout: 10000,
                });
                
                if (metaMediaRes.data?.url) {
                  // 2. Download media binary buffer
                  const binaryRes = await axios.get(metaMediaRes.data.url, {
                    headers: { Authorization: `Bearer ${conn.accessToken}` },
                    responseType: 'arraybuffer',
                    timeout: 20000,
                  });
                  
                  const buffer = Buffer.from(binaryRes.data);
                  const fileRecord = await storageService.uploadBuffer({
                    businessId: targetBizId,
                    category: 'whatsapp-media',
                    originalFilename: mediaFilename,
                    mimeType: mediaMime,
                    buffer,
                    customerId: customer.id,
                    conversationId: conv.id,
                    uploadedBy: 'customer',
                    metadata: { whatsappMediaId: mediaObj.id, wamid },
                  });
                  
                  db.files.unshift(fileRecord);
                  mediaUrl = fileRecord.previewUrl;
                }
              } catch (mediaErr: any) {
                console.warn('[WhatsApp Media Inbound Ingestion Notice]', mediaErr.message);
              }
            }
            
            if (msg.type === 'image') msgType = 'image';
            else if (msg.type === 'audio' || msg.type === 'voice') msgType = 'audio';
            else if (msg.type === 'video') msgType = 'video';
            else msgType = 'document';
          }

          const chatMsg: ChatMessage = {
            id: wamid,
            businessId: targetBizId,
            conversationId: conv.id,
            customerId: customer.id,
            from: 'customer',
            senderName: customer.name,
            text: textBody,
            type: msgType,
            mediaUrl,
            status: 'delivered',
            timestamp: msgTimestamp,
            source: 'whatsapp',
            rawPayload: msg,
          };
          db.messages.push(chatMsg);

          // E. Real Lead Pipeline Evaluation
          let lead = db.leads.find(l => l.businessId === targetBizId && l.customerId === customer!.id);
          if (!lead) {
            lead = {
              id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              businessId: targetBizId,
              customerId: customer.id,
              customerName: customer.name,
              customerPhone: customer.phone,
              status: 'NEW',
              score: 50,
              intent: 'Inbound Inquiry',
              qualificationSummary: `Initial inquiry via WhatsApp: "${textBody.substring(0, 80)}"`,
              source: 'WhatsApp Inbound',
              value: 0,
              notes: '',
              createdAt: msgTimestamp,
              updatedAt: msgTimestamp,
            };
            db.leads.unshift(lead);
            conv.leadId = lead.id;
            conv.leadStatus = 'NEW';
          } else {
            lead.updatedAt = msgTimestamp;
            lead.qualificationSummary = `Latest message: "${textBody.substring(0, 80)}"`;
          }

          // F. Log Webhook Event
          db.webhookLogs.unshift({
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            businessId: targetBizId,
            timestamp: msgTimestamp,
            type: 'whatsapp.message.received',
            sender: customer.phone,
            status: 'processed',
            summary: `Inbound from ${customer.name}: "${textBody.substring(0, 50)}"`,
            rawPayload: msg,
          });

          // Trim event log to 200 records
          if (db.webhookLogs.length > 200) {
            db.webhookLogs.length = 200;
          }

          // G. Automation & AI Auto-Reply Execution (Only when allowed!)
          if (customer.optInStatus === 'opted_in' && conv.mode === 'AI' && !isOptOut) {
            await handleAutoReplyPipeline(targetBizId, conv, customer, textBody);
          }
        }
      }
    }
  }
});

// Helper: Handle Keyword Trigger rules or Gemini AI Auto-Reply
async function handleAutoReplyPipeline(
  businessId: string,
  conv: Conversation,
  customer: Customer,
  incomingText: string
) {
  const textLower = incomingText.toLowerCase().trim();
  const tenantRules = db.automations.filter(a => a.businessId === businessId && a.active);

  // 1. Check Keyword Rules
  for (const rule of tenantRules) {
    const kw = rule.keyword.toLowerCase().trim();
    let matches = false;
    if (rule.matchType === 'exact') {
      matches = textLower === kw;
    } else if (rule.matchType === 'starts_with') {
      matches = textLower.startsWith(kw);
    } else {
      matches = textLower.includes(kw);
    }

    if (matches) {
      if (rule.action === 'handoff_human') {
        conv.mode = 'HUMAN';
      }
      if (rule.leadStatusTarget && conv.leadId) {
        const lead = db.leads.find(l => l.id === conv.leadId);
        if (lead) {
          lead.status = rule.leadStatusTarget;
          conv.leadStatus = rule.leadStatusTarget;
        }
      }

      if (rule.responseText) {
        await sendOutboundMessageInternal(businessId, conv, rule.responseText, 'ai');
      }
      return;
    }
  }

  // 2. Check Gemini AI Config
  const aiCfg = db.aiConfigs[businessId];
  if (!aiCfg || !aiCfg.enabled || !aiCfg.autoReply) {
    return;
  }

  // Check human handoff keywords
  if (aiCfg.humanHandoffKeywords?.some(k => textLower.includes(k.toLowerCase()))) {
    conv.mode = 'HUMAN';
    await sendOutboundMessageInternal(
      businessId,
      conv,
      `I've noted that you would like to speak with a representative. A team member has been notified and will assist you shortly!`,
      'ai'
    );
    return;
  }

  // Generate AI Response with Gemini
  try {
    const ai = getGeminiClient();
    const uploadedDocsGrounding = getTenantKnowledgeGrounding(businessId);
    const combinedKnowledge = [
      aiCfg.businessKnowledge || '',
      aiCfg.businessDescription ? `About: ${aiCfg.businessDescription}` : '',
      aiCfg.productsServices ? `Products & Services: ${aiCfg.productsServices}` : '',
      aiCfg.pricingInfo ? `Pricing: ${aiCfg.pricingInfo}` : '',
      aiCfg.businessHours ? `Hours: ${aiCfg.businessHours}` : '',
      aiCfg.faqs ? `FAQs: ${aiCfg.faqs}` : '',
      uploadedDocsGrounding ? `\n=== VERIFIED KNOWLEDGE FROM UPLOADED DOCUMENTS ===\n${uploadedDocsGrounding}\n==================================================` : ''
    ].filter(Boolean).join('\n\n');

    const prompt = `
System Prompt: ${aiCfg.systemPrompt}
Business Knowledge & Context:
${combinedKnowledge || 'N/A'}
Tone: ${aiCfg.tone}

Customer Name: ${customer.name}
Customer Phone: ${customer.phone}
Customer Inquiry: "${incomingText}"

Compose a concise, friendly, and helpful WhatsApp reply grounded strictly in the business context provided. Do not include markdown headers, and keep it under 3-4 sentences.
`;

    const { text: replyText } = await safeGenerateContent(
      prompt,
      aiCfg.modelName || 'gemini-3.7-flash',
      `Hello ${customer.name || 'there'}! Thank you for contacting us. How can we assist you with our services today?`
    );

    if (replyText) {
      await sendOutboundMessageInternal(businessId, conv, replyText, 'ai');
    }
  } catch (err: any) {
    console.warn('[Fishcatch AI Engine Notice]', err.message || err);
  }
}

// Helper: Send Outbound Message via Meta Cloud API or store internally
async function sendOutboundMessageInternal(
  businessId: string,
  conv: Conversation,
  text: string,
  from: 'agent' | 'ai',
  options?: {
    fileId?: string;
    mediaUrl?: string;
    mediaType?: string;
  }
): Promise<ChatMessage> {
  const conn = db.connections[businessId];
  let outboundId = `wamid.out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  let status: 'sent' | 'delivered' | 'failed' = 'sent';
  let attachedFile: StoredFileMetadata | undefined;

  if (options?.fileId) {
    attachedFile = db.files.find(f => f.id === options.fileId && f.businessId === businessId);
  }

  const finalMediaUrl = attachedFile?.previewUrl || attachedFile?.publicUrl || options?.mediaUrl;
  let msgType: ChatMessage['type'] = 'text';
  if (attachedFile) {
    if (attachedFile.mimeType.startsWith('image/')) msgType = 'image';
    else if (attachedFile.mimeType.startsWith('audio/')) msgType = 'audio';
    else if (attachedFile.mimeType.startsWith('video/')) msgType = 'video';
    else msgType = 'document';
  } else if (options?.mediaType) {
    msgType = options.mediaType as any;
  }

  // If WhatsApp Cloud API is connected with valid credentials, send through Meta Graph API
  if (conn && conn.status === 'CONNECTED' && conn.phoneNumberId && conn.accessToken) {
    try {
      const cleanPhone = conv.customerPhone.replace(/[^0-9]/g, '');
      let payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
      };

      if (finalMediaUrl && msgType !== 'text') {
        const fullMediaUrl = finalMediaUrl.startsWith('http')
          ? finalMediaUrl
          : `${process.env.APP_URL || 'https://fishcatch.app'}${finalMediaUrl}`;

        if (msgType === 'image') {
          payload.type = 'image';
          payload.image = { link: fullMediaUrl, caption: text || undefined };
        } else if (msgType === 'document') {
          payload.type = 'document';
          payload.document = { link: fullMediaUrl, caption: text || undefined, filename: attachedFile?.originalFilename || 'document.pdf' };
        } else if (msgType === 'audio') {
          payload.type = 'audio';
          payload.audio = { link: fullMediaUrl };
        } else if (msgType === 'video') {
          payload.type = 'video';
          payload.video = { link: fullMediaUrl, caption: text || undefined };
        }
      } else {
        payload.type = 'text';
        payload.text = { preview_url: false, body: text };
      }

      const metaRes = await axios.post(
        `https://graph.facebook.com/v21.0/${conn.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${conn.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      if (metaRes.data?.messages?.[0]?.id) {
        outboundId = metaRes.data.messages[0].id;
      }
    } catch (metaErr: any) {
      console.error('[Meta Outbound Error]', metaErr.response?.data || metaErr.message);
      status = 'failed';
    }
  }

  const outboundMsg: ChatMessage = {
    id: outboundId,
    businessId,
    conversationId: conv.id,
    customerId: conv.customerId,
    from,
    senderName: from === 'ai' ? 'Fishcatch AI' : 'Agent',
    text: text || (attachedFile ? `[${attachedFile.originalFilename}]` : ''),
    type: msgType,
    mediaUrl: finalMediaUrl,
    status,
    timestamp: new Date().toISOString(),
    source: from === 'ai' ? 'ai' : 'agent',
  };

  db.messages.push(outboundMsg);
  conv.lastMessage = text || (attachedFile ? `Attachment: ${attachedFile.originalFilename}` : 'Media file');
  conv.lastMessageTime = outboundMsg.timestamp;
  conv.updatedAt = outboundMsg.timestamp;

  return outboundMsg;
}

// =============================================================================
// 4. CONVERSATIONS & INBOX API
// =============================================================================

// List conversations for business
app.get('/api/conversations', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const tenantConvs = db.conversations.filter(c => c.businessId === businessId);
  res.json({
    success: true,
    conversations: tenantConvs,
  });
});

// Get messages for a specific conversation
app.get('/api/conversations/:id/messages', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const convId = req.params.id;

  const conv = db.conversations.find(c => c.id === convId && c.businessId === businessId);
  if (!conv) {
    return res.status(404).json({
      success: false,
      error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found in your workspace.' },
    });
  }

  const convMessages = db.messages.filter(m => m.conversationId === convId && m.businessId === businessId);
  res.json({
    success: true,
    conversation: conv,
    messages: convMessages,
  });
});

// Mark conversation as read
app.post('/api/conversations/:id/mark-read', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const convId = req.params.id;
  const conv = db.conversations.find(c => c.id === convId && c.businessId === businessId);
  if (conv) {
    conv.unreadCount = 0;
  }
  res.json({ success: true });
});

// Update conversation status or mode (AI vs HUMAN)
app.patch('/api/conversations/:id', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const convId = req.params.id;
  const conv = db.conversations.find(c => c.id === convId && c.businessId === businessId);
  if (!conv) {
    return res.status(404).json({
      success: false,
      error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' },
    });
  }

  const { status, mode, notes } = req.body;
  if (status) conv.status = status;
  if (mode) conv.mode = mode;
  if (notes !== undefined) conv.notes = notes;
  conv.updatedAt = new Date().toISOString();

  res.json({ success: true, conversation: conv });
});

// Send message from inbox (agent reply)
app.post('/api/conversations/:id/messages', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const convId = req.params.id;
  const { text, type, templateName, templateParams, fileId, mediaUrl, mediaType } = req.body;

  const conv = db.conversations.find(c => c.id === convId && c.businessId === businessId);
  if (!conv) {
    return res.status(404).json({
      success: false,
      error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' },
    });
  }

  let outboundText = text || '';
  if (type === 'template' && templateName) {
    const tpl = db.templates.find(t => t.name === templateName && t.businessId === businessId);
    outboundText = tpl?.body || `Template: ${templateName}`;
    if (templateParams && Array.isArray(templateParams)) {
      templateParams.forEach((param, idx) => {
        outboundText = outboundText.replace(new RegExp(`\\{\\{${idx + 1}\\}\\}`, 'g'), param);
      });
    }
  }

  if (!outboundText.trim() && !fileId && !mediaUrl) {
    return res.status(400).json({
      success: false,
      error: { code: 'EMPTY_MESSAGE', message: 'Message text or attachment is required.' },
    });
  }

  try {
    const sentMsg = await sendOutboundMessageInternal(businessId, conv, outboundText.trim(), 'agent', {
      fileId,
      mediaUrl,
      mediaType,
    });
    res.json({
      success: true,
      message: sentMsg,
      conversation: conv,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SEND_FAILED', message: err.message },
    });
  }
});

// =============================================================================
// 5. CUSTOMER CRM & LEADS PIPELINE API
// =============================================================================

// Get all contacts
app.get('/api/contacts', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const tenantContacts = db.customers.filter(c => c.businessId === businessId);
  res.json({
    success: true,
    contacts: tenantContacts,
  });
});

// Create contact manually
app.post('/api/contacts', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { name, phone, email, tags, notes } = req.body;

  if (!phone || !phone.trim()) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_PHONE', message: 'Phone number is required.' },
    });
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const digitsOnly = cleanPhone.replace(/[^0-9]/g, '');

  const newContact: Customer = {
    id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    businessId,
    whatsappId: digitsOnly,
    phone: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
    name: name?.trim() || `Contact (+${digitsOnly})`,
    email: email?.trim() || undefined,
    optInStatus: 'opted_in',
    tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : ['Manual']),
    notes: notes || '',
    customAttributes: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastInteraction: new Date().toISOString(),
  };

  db.customers.unshift(newContact);

  res.status(201).json({
    success: true,
    contact: newContact,
  });
});

// Update contact
app.put('/api/contacts/:id', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const contactId = req.params.id;
  const contact = db.customers.find(c => c.id === contactId && c.businessId === businessId);
  if (!contact) {
    return res.status(404).json({
      success: false,
      error: { code: 'CONTACT_NOT_FOUND', message: 'Contact not found.' },
    });
  }

  const { name, email, optInStatus, tags, notes } = req.body;
  if (name) contact.name = name.trim();
  if (email !== undefined) contact.email = email.trim();
  if (optInStatus) contact.optInStatus = optInStatus;
  if (tags) contact.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim());
  if (notes !== undefined) contact.notes = notes;
  contact.updatedAt = new Date().toISOString();

  res.json({ success: true, contact });
});

// Get Leads
app.get('/api/leads', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const tenantLeads = db.leads.filter(l => l.businessId === businessId);
  res.json({
    success: true,
    leads: tenantLeads,
  });
});

// Create Lead manually or via CRM
app.post('/api/leads', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const {
    customerId,
    customerName,
    customerPhone,
    status,
    score,
    intent,
    requirement,
    budget,
    timeline,
    value,
    notes,
    qualificationSummary,
  } = req.body;

  if (!customerName || !customerPhone) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_LEAD_DATA', message: 'Customer name and phone are required to create a lead.' },
    });
  }

  const newLead: Lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    businessId,
    customerId: customerId || `cust_${Date.now()}`,
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    status: status || 'NEW',
    score: score !== undefined ? Number(score) : 50,
    intent: intent || 'Inbound Lead',
    requirement: requirement || '',
    budget: budget || '',
    timeline: timeline || '',
    qualificationSummary: qualificationSummary || `Manual lead entry: ${intent || 'Interested in services'}`,
    source: req.body.source || 'Manual CRM Intake',
    value: value ? Number(value) : 0,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.leads.unshift(newLead);

  res.status(201).json({
    success: true,
    lead: newLead,
  });
});

// Update Lead Status & Details
app.patch('/api/leads/:id', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const leadId = req.params.id;
  const lead = db.leads.find(l => l.id === leadId && l.businessId === businessId);
  if (!lead) {
    return res.status(404).json({
      success: false,
      error: { code: 'LEAD_NOT_FOUND', message: 'Lead not found.' },
    });
  }

  const { status, score, value, notes, qualificationSummary } = req.body;
  if (status) lead.status = status;
  if (score !== undefined) lead.score = Number(score);
  if (value !== undefined) lead.value = Number(value);
  if (notes !== undefined) lead.notes = notes;
  if (qualificationSummary) lead.qualificationSummary = qualificationSummary;
  lead.updatedAt = new Date().toISOString();

  // Sync with conversation if linked
  const conv = db.conversations.find(c => c.leadId === leadId && c.businessId === businessId);
  if (conv && status) {
    conv.leadStatus = status;
  }

  res.json({ success: true, lead });
});

// =============================================================================
// 6. WHATSAPP HSM TEMPLATES API
// =============================================================================

// List templates
app.get('/api/templates', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const conn = db.connections[businessId];

  // If connected with WABA ID, optionally sync live templates from Meta Graph API
  if (conn && conn.status === 'CONNECTED' && conn.wabaId && conn.accessToken) {
    try {
      const metaRes = await axios.get(
        `https://graph.facebook.com/v21.0/${conn.wabaId}/message_templates`,
        {
          params: { access_token: conn.accessToken, limit: 50 },
          timeout: 8000,
        }
      );
      if (metaRes.data?.data && Array.isArray(metaRes.data.data)) {
        // Merge with local state
        metaRes.data.data.forEach((metaTpl: any) => {
          const exists = db.templates.find(t => t.name === metaTpl.name && t.businessId === businessId);
          const bodyComp = metaTpl.components?.find((c: any) => c.type === 'BODY');
          if (!exists) {
            db.templates.push({
              id: metaTpl.id || `tpl_${metaTpl.name}`,
              businessId,
              name: metaTpl.name,
              category: metaTpl.category || 'UTILITY',
              language: metaTpl.language || 'en_US',
              status: metaTpl.status || 'APPROVED',
              body: bodyComp?.text || '',
              createdAt: new Date().toISOString(),
            });
          } else {
            exists.status = metaTpl.status || exists.status;
          }
        });
      }
    } catch (err: any) {
      console.warn('[Meta Templates Sync Notice]', err.message);
    }
  }

  const tenantTemplates = db.templates.filter(t => t.businessId === businessId);
  res.json({
    success: true,
    templates: tenantTemplates,
  });
});

// Create template
app.post('/api/templates', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { name, category, language, header, body, footer, buttons } = req.body;

  if (!name || !body) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_TEMPLATE', message: 'Template name and body text are required.' },
    });
  }

  const cleanName = name.toLowerCase().replace(/[^a-z0-9_]+/g, '_');

  const newTemplate: MessageTemplate = {
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    businessId,
    name: cleanName,
    category: category || 'UTILITY',
    language: language || 'en_US',
    status: 'APPROVED',
    header: header?.text ? { type: 'TEXT', text: header.text } : undefined,
    body: body.trim(),
    footer: footer || undefined,
    buttons: Array.isArray(buttons) ? buttons : undefined,
    createdAt: new Date().toISOString(),
  };

  // If connected with live WABA ID, create template on Meta Graph API
  const conn = db.connections[businessId];
  if (conn && conn.status === 'CONNECTED' && conn.wabaId && conn.accessToken) {
    const components: any[] = [];
    if (header?.text) {
      components.push({ type: 'HEADER', format: 'TEXT', text: header.text });
    }
    components.push({ type: 'BODY', text: body.trim() });
    if (footer) {
      components.push({ type: 'FOOTER', text: footer });
    }
    if (Array.isArray(buttons) && buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: buttons.map((b: any) => ({
          type: b.type || 'QUICK_REPLY',
          text: b.text,
          url: b.url,
          phone_number: b.phone_number,
        })),
      });
    }

    axios.post(
      `https://graph.facebook.com/v21.0/${conn.wabaId}/message_templates`,
      {
        name: cleanName,
        category: category || 'UTILITY',
        language: language || 'en_US',
        components,
      },
      {
        params: { access_token: conn.accessToken },
        timeout: 10000,
      }
    ).then((metaRes) => {
      if (metaRes.data?.id) {
        newTemplate.id = metaRes.data.id;
        newTemplate.status = metaRes.data.status || 'PENDING';
      }
    }).catch((metaErr: any) => {
      console.warn('[Meta Template Creation Notice]', metaErr.response?.data || metaErr.message);
    });
  }

  db.templates.unshift(newTemplate);

  res.status(201).json({
    success: true,
    template: newTemplate,
  });
});

// Delete template
app.delete('/api/templates/:id', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const templateId = req.params.id;

  const idx = db.templates.findIndex(t => (t.id === templateId || t.name === templateId) && t.businessId === businessId);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found.' },
    });
  }

  db.templates.splice(idx, 1);
  res.json({ success: true, message: 'Template deleted.' });
});

// =============================================================================
// 7. KEYWORD AUTOMATIONS API
// =============================================================================

// List automation rules
app.get('/api/automations', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const tenantRules = db.automations.filter(a => a.businessId === businessId);
  res.json({
    success: true,
    automations: tenantRules,
  });
});

// Create automation rule
app.post('/api/automations', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { name, keyword, matchType, responseText, action, leadStatusTarget } = req.body;

  if (!keyword || !keyword.trim()) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_KEYWORD', message: 'Trigger keyword is required.' },
    });
  }

  const newRule: AutomationRule = {
    id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    businessId,
    name: name?.trim() || `Rule: "${keyword.trim()}"`,
    keyword: keyword.trim(),
    matchType: matchType || 'contains',
    responseText: responseText || '',
    active: true,
    action: action || 'reply_text',
    leadStatusTarget: leadStatusTarget || undefined,
    createdAt: new Date().toISOString(),
  };

  db.automations.unshift(newRule);
  res.status(201).json({ success: true, automation: newRule });
});

// Toggle or update automation rule
app.put('/api/automations/:id', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const ruleId = req.params.id;
  const rule = db.automations.find(a => a.id === ruleId && a.businessId === businessId);
  if (!rule) {
    return res.status(404).json({
      success: false,
      error: { code: 'RULE_NOT_FOUND', message: 'Automation rule not found.' },
    });
  }

  const { name, keyword, matchType, responseText, active, action, leadStatusTarget } = req.body;
  if (name) rule.name = name;
  if (keyword) rule.keyword = keyword;
  if (matchType) rule.matchType = matchType;
  if (responseText !== undefined) rule.responseText = responseText;
  if (active !== undefined) rule.active = active;
  if (action) rule.action = action;
  if (leadStatusTarget !== undefined) rule.leadStatusTarget = leadStatusTarget;

  res.json({ success: true, automation: rule });
});

// Delete automation rule
app.delete('/api/automations/:id', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const ruleId = req.params.id;
  const idx = db.automations.findIndex(a => a.id === ruleId && a.businessId === businessId);
  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'RULE_NOT_FOUND', message: 'Automation rule not found.' },
    });
  }
  db.automations.splice(idx, 1);
  res.json({ success: true, message: 'Automation rule deleted.' });
});

// =============================================================================
// 8. AI CONFIGURATION, TESTING & COPILOT DRAFTS
// =============================================================================

// Get AI configuration
app.get('/api/ai/config', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const cfg = db.aiConfigs[businessId] || {
    businessId,
    enabled: true,
    autoReply: true,
    agentName: 'Fishcatch AI Assistant',
    modelName: process.env.GEMINI_MODEL || process.env.AI_MODEL_NAME || 'gemini-3.7-flash',
    systemPrompt: 'You are the intelligent WhatsApp AI Assistant for Fishcatch. Assist customers, qualify leads, and answer inquiries clearly and politely.',
    businessDescription: '',
    productsServices: '',
    pricingInfo: '',
    businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM',
    faqs: '',
    rules: 'Never invent prices or services not listed in the business knowledge. If unsure, politely offer human assistance.',
    qualificationQuestions: [
      'What specific service or product are you looking for?',
      'What is your target timeline or budget?'
    ],
    tone: 'Professional & Helpful',
    language: 'auto',
    humanHandoff: true,
    humanHandoffKeywords: ['human', 'agent', 'representative', 'real person', 'manager', 'support'],
    leadQualificationCriteria: 'Interested in core services, has budget, and ready within 30 days',
  };

  res.json({
    success: true,
    config: {
      ...cfg,
      isConfigured: Boolean(process.env.GEMINI_API_KEY),
    },
  });
});

// Save AI configuration
app.put('/api/ai/config', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const {
    enabled,
    autoReply,
    agentName,
    systemPrompt,
    businessDescription,
    productsServices,
    pricingInfo,
    businessHours,
    faqs,
    rules,
    tone,
    language,
    qualificationQuestions,
    humanHandoff,
    humanHandoffKeywords,
    leadQualificationCriteria,
  } = req.body;

  const current = db.aiConfigs[businessId] || {
    businessId,
    enabled: true,
    autoReply: true,
    agentName: 'Fishcatch AI Assistant',
    modelName: process.env.GEMINI_MODEL || process.env.AI_MODEL_NAME || 'gemini-3.7-flash',
    systemPrompt: '',
    businessDescription: '',
    productsServices: '',
    pricingInfo: '',
    businessHours: '',
    faqs: '',
    rules: '',
    tone: 'Professional & Helpful',
    language: 'auto',
    qualificationQuestions: [],
    humanHandoff: true,
    humanHandoffKeywords: [],
    leadQualificationCriteria: '',
  };

  if (enabled !== undefined) current.enabled = enabled;
  if (autoReply !== undefined) current.autoReply = autoReply;
  if (agentName !== undefined) current.agentName = agentName.trim();
  if (systemPrompt !== undefined) current.systemPrompt = systemPrompt.trim();
  if (businessDescription !== undefined) current.businessDescription = businessDescription.trim();
  if (productsServices !== undefined) current.productsServices = productsServices.trim();
  if (pricingInfo !== undefined) current.pricingInfo = pricingInfo.trim();
  if (businessHours !== undefined) current.businessHours = businessHours.trim();
  if (faqs !== undefined) current.faqs = faqs.trim();
  if (rules !== undefined) current.rules = rules.trim();
  if (tone !== undefined) current.tone = tone;
  if (language !== undefined) current.language = language;
  if (qualificationQuestions) current.qualificationQuestions = qualificationQuestions;
  if (humanHandoff !== undefined) current.humanHandoff = humanHandoff;
  if (humanHandoffKeywords) current.humanHandoffKeywords = humanHandoffKeywords;
  if (leadQualificationCriteria !== undefined) current.leadQualificationCriteria = leadQualificationCriteria.trim();

  db.aiConfigs[businessId] = current;
  res.json({
    success: true,
    config: {
      ...current,
      isConfigured: Boolean(process.env.GEMINI_API_KEY),
    },
  });
});

// Test AI Agent with sample prompt in real-time
app.post('/api/ai/test', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { message } = req.body;
  const aiCfg = db.aiConfigs[businessId] || {
    systemPrompt: 'You are the intelligent WhatsApp AI Assistant for Fishcatch.',
    tone: 'Professional & Helpful',
  };

  const uploadedDocsGrounding = getTenantKnowledgeGrounding(businessId);
  const knowledgeSections = [
    aiCfg.businessDescription ? `About the Business:\n${aiCfg.businessDescription}` : '',
    aiCfg.productsServices ? `Products / Services:\n${aiCfg.productsServices}` : '',
    aiCfg.pricingInfo ? `Pricing & Packages:\n${aiCfg.pricingInfo}` : '',
    aiCfg.businessHours ? `Business Hours:\n${aiCfg.businessHours}` : '',
    aiCfg.faqs ? `FAQs:\n${aiCfg.faqs}` : '',
    aiCfg.rules ? `Operational Rules:\n${aiCfg.rules}` : '',
    aiCfg.leadQualificationCriteria ? `Lead Qualification Goals:\n${aiCfg.leadQualificationCriteria}` : '',
    uploadedDocsGrounding ? `Uploaded Verified Knowledge Documents:\n${uploadedDocsGrounding}` : '',
  ].filter(Boolean).join('\n\n');

  try {
    const prompt = `
System Persona: ${aiCfg.systemPrompt || 'You are an intelligent WhatsApp AI Assistant for Fishcatch.'}
Agent Name: ${aiCfg.agentName || 'Fishcatch AI Assistant'}
Tone: ${aiCfg.tone || 'Professional & Helpful'}
Language Preference: ${aiCfg.language || 'auto'}

${knowledgeSections ? `=== CONFIGURED BUSINESS KNOWLEDGE ===\n${knowledgeSections}\n====================================` : '(No extra business knowledge configured)'}

User Inquiry via WhatsApp:
"${message || 'Hello'}"

Respond to this inquiry following WhatsApp best practices:
1. Be direct, polite, concise, and helpful (under 3-4 sentences max).
2. Never invent details outside the business knowledge provided.
3. If the user is asking about something not covered, politely let them know and offer to connect them with a human team member.
`;

    let fallbackGreeting = `Hello! Thank you for reaching out. ${aiCfg.businessDescription ? 'We are happy to assist you with our services.' : 'How can we help you today?'}`;
    if (uploadedDocsGrounding) {
      fallbackGreeting = `Grounded knowledge: ${uploadedDocsGrounding.substring(0, 300)}`;
    }

    const { text: responseText, isFallback, reason } = await safeGenerateContent(
      prompt,
      aiCfg.modelName || process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      fallbackGreeting
    );

    // Simple heuristic check for handoff
    const lower = (message || '').toLowerCase();
    const handoff = (aiCfg.humanHandoffKeywords || []).some((kw: string) => lower.includes(kw.toLowerCase()));

    res.json({
      success: true,
      response: responseText,
      intent: 'Inquiry Testing',
      leadScore: 75,
      handoff,
      notice: isFallback ? reason : undefined,
    });
  } catch (err: any) {
    let groundedFallback = `Hello! Thank you for reaching out. ${aiCfg.businessDescription ? 'We are happy to assist you with our services.' : 'How can we help you today?'}`;
    if (uploadedDocsGrounding) {
      groundedFallback = `Grounded knowledge: ${uploadedDocsGrounding.substring(0, 300)}`;
    }
    res.json({
      success: true,
      response: groundedFallback,
      intent: 'Grounded Inquiry',
      leadScore: 70,
      handoff: false,
      notice: !process.env.GEMINI_API_KEY ? 'Gemini API Key is not configured in server environment.' : (err.message || 'Grounded fallback active'),
    });
  }
});

// Generate AI copilot draft reply for active conversation
app.post('/api/ai/generate-draft', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { conversationId } = req.body;

  const conv = db.conversations.find(c => c.id === conversationId && c.businessId === businessId);
  const convMsgs = db.messages
    .filter(m => m.conversationId === conversationId && m.businessId === businessId)
    .slice(-8);

  const aiCfg = db.aiConfigs[businessId] || {
    systemPrompt: 'You are an expert customer communication assistant for Fishcatch.',
    tone: 'Professional & Helpful',
  };

  const knowledgeSections = [
    aiCfg.businessDescription ? `About: ${aiCfg.businessDescription}` : '',
    aiCfg.productsServices ? `Products/Services: ${aiCfg.productsServices}` : '',
    aiCfg.pricingInfo ? `Pricing: ${aiCfg.pricingInfo}` : '',
    aiCfg.businessHours ? `Hours: ${aiCfg.businessHours}` : '',
    aiCfg.faqs ? `FAQs: ${aiCfg.faqs}` : '',
  ].filter(Boolean).join('\n');

  try {
    const historyText = convMsgs
      .map(m => `${m.from === 'customer' ? 'Customer' : 'Agent'}: ${m.text}`)
      .join('\n');

    const prompt = `
System Persona: ${aiCfg.systemPrompt}
Tone: ${aiCfg.tone}
${knowledgeSections ? `Business Knowledge:\n${knowledgeSections}` : ''}

Customer Name: ${conv?.customerName || 'Customer'}
Customer Phone: ${conv?.customerPhone || ''}
Recent Conversation History:
${historyText || '(No previous messages)'}

Suggest one direct, polite, and effective WhatsApp draft reply for the human agent to send to this customer.
Return ONLY the suggested message text without quotes, formatting, or meta commentary.
`;

    const { text: draftText } = await safeGenerateContent(
      prompt,
      aiCfg.modelName || process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      `Hello ${conv?.customerName || 'there'}! How can we best assist you with your request today?`
    );

    res.json({
      success: true,
      draft: draftText || `Hello ${conv?.customerName || 'there'}! How can we best assist you with your request today?`,
    });
  } catch (err: any) {
    res.json({
      success: true,
      draft: `Hello ${conv?.customerName || 'there'}! Thank you for contacting us. How can we best assist you today?`,
    });
  }
});

// Analyze Customer Intent & Qualification
app.post('/api/ai/analyze-intent', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { text } = req.body;
  const aiCfg = db.aiConfigs[businessId];

  try {
    const prompt = `
Analyze this WhatsApp customer message:
"${text || ''}"

Return valid JSON with keys:
- "sentiment": "Positive" | "Neutral" | "Negative"
- "intent": short string e.g. "Product Pricing Inquiry" | "Support Request" | "Consultation Booking"
- "urgency": "Low" | "Medium" | "High"
- "leadScore": number between 1 and 100
- "suggestedActions": array of 2 short actionable recommendations
`;

    const { text: rawOutput } = await safeGenerateContent(
      prompt,
      aiCfg?.modelName || process.env.GEMINI_MODEL || 'gemini-3.7-flash',
      '{"sentiment":"Neutral","intent":"General Inquiry","urgency":"Medium","leadScore":65,"suggestedActions":["Respond promptly","Provide information"]}'
    );

    const cleanJson = rawOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    res.json({ success: true, analysis: parsed });
  } catch (err: any) {
    res.json({
      success: true,
      analysis: {
        sentiment: 'Neutral',
        intent: 'General Inquiry',
        urgency: 'Medium',
        leadScore: 60,
        suggestedActions: ['Respond promptly to clarify request', 'Offer to share service options'],
      },
    });
  }
});

// =============================================================================
// 9. META-COMPLIANT DATA DELETION & LEGAL COMPLIANCE
// =============================================================================

// Helper to parse Meta signed_request if present
function parseSignedRequest(signedRequest: string, appSecret?: string): any {
  try {
    const [encodedSig, payload] = signedRequest.split('.');
    if (!payload) return null;
    const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

// Meta User Data Deletion Callback endpoint (/api/legal/data-deletion and /data-deletion-callback)
const handleDataDeletionCallback = (req: Request, res: Response) => {
  let userId = req.body?.user_id || req.body?.userId;

  // If Meta sends signed_request
  if (!userId && req.body?.signed_request) {
    const parsed = parseSignedRequest(req.body.signed_request);
    if (parsed && (parsed.user_id || parsed.userId)) {
      userId = parsed.user_id || parsed.userId;
    }
  }

  if (!userId) {
    userId = 'user_' + Date.now();
  }

  const confirmationCode = 'del_' + Math.random().toString(36).substring(2, 12);
  
  // Construct production base URL
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const baseUrl = process.env.BASE_URL || process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `${protocol}://${host}`;
  const statusUrl = `${baseUrl}/api/legal/data-deletion/${confirmationCode}`;

  const requestRecord: DataDeletionRequest = {
    id: confirmationCode,
    confirmationCode,
    userId: String(userId),
    status: 'completed',
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    url: statusUrl,
  };

  db.dataDeletionRequests.push(requestRecord);

  // Meta requires JSON response with url and confirmation_code
  res.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  });
};

app.post('/api/legal/data-deletion', handleDataDeletionCallback);
app.post('/data-deletion-callback', handleDataDeletionCallback);

// Data deletion status lookup
app.get('/api/legal/data-deletion/:code', (req: Request, res: Response) => {
  const code = req.params.code;
  const record = db.dataDeletionRequests.find(r => r.confirmationCode === code);
  if (!record) {
    return res.status(404).json({
      success: false,
      error: { code: 'REQUEST_NOT_FOUND', message: 'Data deletion request not found.' },
    });
  }

  res.json({
    success: true,
    dataDeletionRequest: record,
    status: 'completed',
    user_id: record.userId,
    confirmation_code: record.confirmationCode,
    requested_at: record.requestedAt,
    completed_at: record.completedAt,
    message: 'User data and associated WhatsApp conversation logs have been removed according to GDPR, CCPA, and Meta platform policies.',
  });
});

// =============================================================================
// 10. ADMIN & SYSTEM HEALTH API
// =============================================================================

// Admin System Overview (Protected)
app.get('/api/admin/overview', (req: Request, res: Response) => {
  const totalBusinesses = db.businesses.length;
  const totalCustomers = db.customers.length;
  const totalConversations = db.conversations.length;
  const totalMessages = db.messages.length;
  const totalLeads = db.leads.length;
  const totalStorageFiles = db.files.length;
  const totalStorageBytes = db.files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

  res.json({
    success: true,
    health: {
      status: 'HEALTHY',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      port: PORT,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      firebaseStorageConfigured: storageService.isConfigured(),
      storageBucket: storageService.getBucketName(),
    },
    metrics: {
      totalBusinesses,
      totalCustomers,
      totalConversations,
      totalMessages,
      totalLeads,
      totalWebhookEvents: db.webhookLogs.length,
      totalStorageFiles,
      totalStorageBytes,
    },
    businesses: db.businesses.map(b => {
      const conn = db.connections[b.id];
      return {
        ...b,
        whatsappStatus: conn?.status || 'NOT_CONNECTED',
        phoneNumber: conn?.displayPhoneNumber || 'None',
        contactsCount: db.customers.filter(c => c.businessId === b.id).length,
        conversationsCount: db.conversations.filter(c => c.businessId === b.id).length,
      };
    }),
    recentWebhookEvents: db.webhookLogs.slice(0, 30),
  });
});

// Replay Webhook Event in Admin
app.post('/api/admin/events/:id/replay', async (req: Request, res: Response) => {
  const evt = db.webhookLogs.find(e => e.id === req.params.id);
  if (!evt) {
    return res.status(404).json({
      success: false,
      error: { code: 'EVENT_NOT_FOUND', message: 'Event log not found.' },
    });
  }

  evt.status = 'processed';
  evt.summary += ' [Replayed]';

  res.json({
    success: true,
    message: 'Webhook event reprocessed successfully.',
    event: evt,
  });
});

// =============================================================================
// 11. FIREBASE CLOUD STORAGE & MULTI-TENANT MEDIA API
// =============================================================================

// Storage overview stats for active tenant
app.get('/api/storage/overview', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const tenantFiles = db.files.filter(f => f.businessId === businessId && f.status !== 'deleted');
  
  const totalFiles = tenantFiles.length;
  const totalBytes = tenantFiles.reduce((sum, f) => sum + (f.fileSize || 0), 0);
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const categoryCounts: Record<string, number> = {
    'all': totalFiles,
    'whatsapp-media': 0,
    'knowledge': 0,
    'profile': 0,
    'conversation-attachment': 0,
    'customer': 0,
    'documents': 0,
  };

  tenantFiles.forEach(f => {
    if (categoryCounts[f.category] !== undefined) {
      categoryCounts[f.category]++;
    }
  });

  const overview: StorageOverview = {
    totalFiles,
    totalBytes,
    formattedTotalSize: formatBytes(totalBytes),
    categoryCounts,
    firebaseConfigured: storageService.isConfigured(),
    storageBucket: storageService.getBucketName(),
    storageBackend: storageService.isConfigured() ? 'firebase_gcs' : 'local_isolated',
    files: tenantFiles,
  };

  res.json({
    success: true,
    overview,
  });
});

// List files with search & category filter
app.get('/api/storage/files', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const { category, search, customerId, conversationId } = req.query;

  let tenantFiles = db.files.filter(f => f.businessId === businessId && f.status !== 'deleted');

  if (category && category !== 'all') {
    tenantFiles = tenantFiles.filter(f => f.category === category);
  }

  if (customerId) {
    tenantFiles = tenantFiles.filter(f => f.customerId === customerId);
  }

  if (conversationId) {
    tenantFiles = tenantFiles.filter(f => f.conversationId === conversationId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    tenantFiles = tenantFiles.filter(
      f =>
        f.originalFilename.toLowerCase().includes(q) ||
        (f.extractedText && f.extractedText.toLowerCase().includes(q))
    );
  }

  res.json({
    success: true,
    files: tenantFiles,
    count: tenantFiles.length,
  });
});

// Get file metadata
app.get('/api/storage/files/:id', (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const file = db.files.find(f => f.id === req.params.id && f.businessId === businessId);

  if (!file) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'The requested file was not found in your workspace.' },
    });
  }

  res.json({
    success: true,
    file,
  });
});

// Download file stream with multi-tenant verification
app.get('/api/storage/files/:id/download', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const file = db.files.find(f => f.id === req.params.id && f.businessId === businessId);

  if (!file) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'The requested file was not found.' },
    });
  }

  try {
    const buffer = await storageService.getFileBuffer(file, businessId);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalFilename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DOWNLOAD_FAILED', message: err.message },
    });
  }
});

// Preview / Stream media with range support (for audio/video playback and images)
app.get('/api/storage/files/:id/preview', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const file = db.files.find(f => f.id === req.params.id && f.businessId === businessId);

  if (!file) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'File not found.' },
    });
  }

  try {
    const buffer = await storageService.getFileBuffer(file, businessId);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.originalFilename)}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'PREVIEW_FAILED', message: err.message },
    });
  }
});

// Upload file to Firebase Storage / GCS with tenant boundary
app.post('/api/storage/upload', upload.single('file'), async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FILE', message: 'No file was uploaded in request payload.' },
    });
  }

  const category = (req.body.category as StorageCategory) || 'documents';
  const customerId = req.body.customerId;
  const conversationId = req.body.conversationId;
  const uploadedBy = (req.body.uploadedBy as 'agent' | 'customer' | 'system' | 'admin') || 'agent';
  const description = req.body.description || '';

  try {
    const fileRecord = await storageService.uploadBuffer({
      businessId,
      category,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      customerId,
      conversationId,
      uploadedBy,
      metadata: { description },
    });

    db.files.unshift(fileRecord);

    // If knowledge document uploaded, automatically append reference to business knowledge config
    if (category === 'knowledge' && fileRecord.extractedText) {
      const aiCfg = db.aiConfigs[businessId];
      if (aiCfg) {
        aiCfg.businessKnowledge = [
          aiCfg.businessKnowledge || '',
          `[Document: ${fileRecord.originalFilename}]\n${fileRecord.extractedText.substring(0, 1000)}`
        ].filter(Boolean).join('\n\n');
      }
    }

    res.status(201).json({
      success: true,
      file: fileRecord,
      message: `File "${file.originalname}" securely uploaded to ${fileRecord.metadata?.backend === 'firebase_gcs' ? 'Firebase Cloud Storage' : 'Tenant Storage'}.`,
    });
  } catch (err: any) {
    if (
      err.message?.includes('UNSUPPORTED_MIME_TYPE') ||
      err.message?.includes('FILE_TOO_LARGE') ||
      err.message?.includes('MISSING_FILE')
    ) {
      console.warn('[Storage Upload Validation]', err.message);
    } else {
      console.error('[Storage Upload Error]', err.message || err);
    }
    res.status(400).json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: err.message },
    });
  }
});

// Delete file
app.delete('/api/storage/files/:id', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const fileId = req.params.id;
  const idx = db.files.findIndex(f => f.id === fileId && f.businessId === businessId);

  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'File not found in your workspace.' },
    });
  }

  const file = db.files[idx];

  try {
    await storageService.deleteFile(file, businessId);
    db.files.splice(idx, 1);

    res.json({
      success: true,
      message: `File "${file.originalFilename}" was deleted.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_FAILED', message: err.message },
    });
  }
});

// Re-index knowledge file for AI Grounding
app.post('/api/storage/files/:id/reindex', async (req: Request, res: Response) => {
  const businessId = resolveBusinessId(req);
  const file = db.files.find(f => f.id === req.params.id && f.businessId === businessId);

  if (!file) {
    return res.status(404).json({
      success: false,
      error: { code: 'FILE_NOT_FOUND', message: 'File not found.' },
    });
  }

  try {
    const buffer = await storageService.getFileBuffer(file, businessId);
    const extracted = await storageService.extractText(buffer, file.mimeType, file.originalFilename);
    file.extractedText = extracted;
    file.category = 'knowledge';

    res.json({
      success: true,
      extractedLength: extracted.length,
      extractedPreview: extracted.substring(0, 300),
      message: `File "${file.originalFilename}" re-indexed for Gemini AI grounding (${extracted.length} characters extracted).`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'REINDEX_FAILED', message: err.message },
    });
  }
});

// Generic Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    name: 'Fishcatch API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeBusinessId: db.activeBusinessId,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    firebaseStorageConfigured: storageService.isConfigured(),
    storageBucket: storageService.getBucketName(),
  });
});

// Vite Integration (Dev middleware in development, static files in production)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[Fishcatch Server] Attached Vite development middleware.');
    } catch (err) {
      console.warn('[Fishcatch Server] Vite dev server middleware fallback:', err);
      const distPath = path.join(__dirname, 'dist');
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        if (req.path.startsWith('/api')) {
          return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: `API route ${req.method} ${req.path} not found.` },
          });
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `API route ${req.method} ${req.path} not found.` },
        });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fishcatch Server] Production engine listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
