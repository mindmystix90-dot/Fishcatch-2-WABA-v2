export interface BusinessTenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  whatsappStatus?: string;
  phoneNumber?: string;
  contactsCount?: number;
  conversationsCount?: number;
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
  webhookStatus?: string;
  accessToken: string;
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
  requirement?: string;
  budget?: string;
  timeline?: string;
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
  isWindowActive?: boolean;
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
  tone: string;
  language: string;
  humanHandoff: boolean;
  humanHandoffKeywords: string[];
  leadQualificationCriteria: string;
  isConfigured?: boolean;
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
  recentWebhookEvents: WebhookEventLog[];
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
