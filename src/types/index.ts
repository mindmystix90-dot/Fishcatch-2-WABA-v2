export type BusinessCategory =
  | 'Retail'
  | 'Education'
  | 'Real Estate'
  | 'Healthcare'
  | 'Agency'
  | 'E-commerce'
  | 'Services'
  | 'Other';

export type PipelineStage =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export type LeadScoreBand = 'Cold' | 'Warm' | 'Hot' | 'Very Hot';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  companyId: string;
  role: 'owner' | 'admin' | 'agent';
  createdAt: string;
  updatedAt: string;
}

export interface BusinessTenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  category?: BusinessCategory;
  country?: string;
  plan: 'Starter' | 'Growth' | 'Scale';
  status?: 'active' | 'suspended';
  features?: {
    whatsapp: boolean;
    ai: boolean;
    campaigns: boolean;
    automations: boolean;
  };
  createdAt: string;
  updatedAt: string;
  whatsappStatus?: 'CONNECTED' | 'NOT_CONNECTED' | 'ERROR';
  phoneNumber?: string;
  contactsCount?: number;
  conversationsCount?: number;
  leadsCount?: number;
}

export interface WhatsAppConnection {
  businessId: string;
  provider: 'YCloud' | 'MetaCloud' | 'Twilio';
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'ERROR' | 'DISCONNECTED';
  apiKey?: string;
  wabaId?: string;
  phoneNumberId?: string;
  displayPhoneNumber: string;
  verifiedName: string;
  qualityRating: string;
  webhookStatus?: string;
  webhookUrl?: string;
  accessToken?: string;
  hasToken?: boolean;
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
  location?: string;
  avatarUrl?: string;
  optInStatus: 'opted_in' | 'opted_out';
  tags: string[];
  leadScore: number;
  leadBand: LeadScoreBand;
  stage: PipelineStage;
  notes: string;
  assignedTo?: string;
  customAttributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastInteraction: string;
}

export type LeadStatus = PipelineStage;

export interface BuyingSignals {
  buying_intent: number; // 0-1
  budget_provided: boolean;
  product_interest: boolean;
  urgency: number; // 0-1
  demo_requested: boolean;
  price_requested: boolean;
}

export interface QualificationData {
  name: string;
  requirement: string;
  budget: string;
  location: string;
  product_interest: string;
  timeline: string;
}

export interface Lead {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerLocation?: string;
  status: PipelineStage;
  score: number;
  band: LeadScoreBand;
  intent: string;
  requirement?: string;
  budget?: string;
  timeline?: string;
  productInterest?: string;
  buyingSignals?: BuyingSignals;
  qualificationSummary: string;
  source: string;
  value: number;
  tags: string[];
  assignedTo?: string;
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
  customerAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'open' | 'resolved' | 'snoozed';
  mode: 'AI' | 'HUMAN';
  assignedTo?: string;
  leadId?: string;
  leadScore?: number;
  leadBand?: LeadScoreBand;
  stage?: PipelineStage;
  tags: string[];
  notes?: string;
  isWindowActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  businessId: string;
  conversationId: string;
  customerId: string;
  from: 'customer' | 'agent' | 'ai' | 'system';
  senderName: string;
  text: string;
  type: 'text' | 'image' | 'document' | 'template' | 'interactive' | 'audio';
  mediaUrl?: string;
  templateName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  source: 'whatsapp' | 'ai' | 'agent' | 'system';
  rawPayload?: any;
  errorMessage?: string;
  metadata?: {
    intent?: string;
    buyingSignals?: BuyingSignals;
    confidence?: number;
    escalate?: boolean;
  };
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
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  businessId: string;
  name: string;
  trigger: 'lead_score_hot' | 'no_reply_6_hours' | 'new_lead_created' | 'keyword_received';
  keywordMatch?: string;
  matchType?: 'exact' | 'contains' | 'starts_with';
  actions: {
    addTag?: string;
    notifyTeam?: boolean;
    createFollowUp?: boolean;
    assignAgent?: string;
    replyText?: string;
  };
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  businessId: string;
  name: string;
  audience: string;
  templateId?: string;
  messageText: string;
  schedule: string;
  status: 'Draft' | 'Scheduled' | 'Running' | 'Completed' | 'Paused';
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  repliedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIConfig {
  businessId: string;
  enabled: boolean;
  autoReply: boolean;
  agentName: string;
  modelName: string;
  systemPrompt: string;
  businessDescription: string;
  productsServices: string;
  pricingInfo: string;
  businessHours: string;
  faqs: string;
  rules: string;
  qualificationQuestions: string[];
  personality: 'Professional' | 'Friendly' | 'Concise' | 'Consultative';
  tone: string;
  language: string;
  humanHandoff: boolean;
  humanHandoffKeywords: string[];
  leadQualificationCriteria: string;
  isConfigured?: boolean;
}

export interface GeminiSalesAgentOutput {
  reply_text: string;
  detected_intent: string;
  qualification: QualificationData;
  buying_signals: BuyingSignals;
  suggested_tags: string[];
  suggested_stage: PipelineStage;
  escalate: boolean;
  escalation_reason: string;
  confidence: number;
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

export interface SystemErrorLog {
  id: string;
  timestamp: string;
  businessId?: string;
  endpoint?: string;
  source: 'whatsapp_webhook' | 'outbound_api' | 'gemini_ai' | 'firebase_auth' | 'system';
  message: string;
  stack?: string;
  resolved: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'agent';
  businessId: string;
  businessName?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface WebhookHealthMetrics {
  status: 'healthy' | 'degraded' | 'error';
  lastReceivedAt: string | null;
  totalEventsCount: number;
  processedCount: number;
  failedCount: number;
  avgLatencyMs: number;
}

export interface AdminOverview {
  health: {
    status: string;
    uptimeSeconds: number;
    timestamp: string;
    nodeVersion: string;
    port: number;
    geminiConfigured: boolean;
    firebaseStorageConfigured?: boolean;
    storageBucket?: string;
  };
  metrics: {
    totalBusinesses: number;
    totalCustomers: number;
    totalConversations: number;
    totalMessages: number;
    totalLeads: number;
    totalWebhookEvents: number;
    totalStorageFiles?: number;
    totalStorageBytes?: number;
  };
  businesses: BusinessTenant[];
  users: AdminUser[];
  recentWebhookEvents: WebhookEventLog[];
  recentErrors: SystemErrorLog[];
  webhookHealth: WebhookHealthMetrics;
}

export type StorageCategory =
  | 'whatsapp-media'
  | 'knowledge'
  | 'profile'
  | 'conversation-attachment'
  | 'customer'
  | 'documents';

export interface StoredFileMetadata {
  id: string;
  fileId?: string;
  businessId: string;
  category: StorageCategory;
  customerId?: string;
  conversationId?: string;
  originalFilename: string;
  originalName?: string;
  sanitizedFilename: string;
  storagePath: string;
  mimeType: string;
  contentType?: string;
  fileSize: number;
  size?: number;
  publicUrl: string;
  previewUrl?: string;
  fileUrl?: string;
  createdAt: string;
  uploadedBy: 'agent' | 'customer' | 'system' | 'admin';
  status: 'active' | 'archived' | 'deleted';
  extractedText?: string;
  metadata?: Record<string, any>;
}

export interface StorageOverview {
  totalFiles: number;
  totalBytes: number;
  formattedTotalSize: string;
  categoryCounts: Record<string, number>;
  firebaseConfigured: boolean;
  storageBucket: string;
  storageBackend: 'firebase_gcs' | 'local_isolated';
  files: StoredFileMetadata[];
}
