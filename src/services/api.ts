import axios from 'axios';
import type {
  BusinessTenant,
  WhatsAppConnection,
  Customer,
  Lead,
  Conversation,
  ChatMessage,
  MessageTemplate,
  AutomationRule,
  AIConfig,
  AdminOverview,
  StoredFileMetadata,
  StorageOverview,
} from '../types';

let currentBusinessId = 'biz_fishcatch_default';

export const setApiBusinessId = (id: string) => {
  currentBusinessId = id;
};

export const getApiBusinessId = () => currentBusinessId;

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Attach tenant boundary header to every request
client.interceptors.request.use((config) => {
  if (currentBusinessId) {
    config.headers['X-Business-ID'] = currentBusinessId;
  }
  return config;
});

export const api = {
  // Business Tenants
  async getBusinesses(): Promise<{ businesses: BusinessTenant[]; activeBusinessId: string }> {
    const res = await client.get('/businesses');
    return res.data;
  },

  async createBusiness(name: string, email: string): Promise<BusinessTenant> {
    const res = await client.post('/businesses', { name, email });
    return res.data.business;
  },

  async switchBusiness(businessId: string): Promise<BusinessTenant> {
    const res = await client.post('/businesses/switch', { businessId });
    setApiBusinessId(businessId);
    return res.data.business;
  },

  async updateBusiness(id: string, data: { name?: string; email?: string }): Promise<BusinessTenant> {
    const res = await client.put(`/businesses/${id}`, data);
    return res.data.business;
  },

  // WhatsApp Connection
  async getWhatsAppConnection(): Promise<{ connection: WhatsAppConnection; webhookUrl: string; verifyToken: string }> {
    const res = await client.get('/whatsapp/connection');
    return res.data;
  },

  async verifyCredentials(data: {
    metaAppId?: string;
    wabaId?: string;
    phoneNumberId: string;
    accessToken: string;
  }): Promise<{ connection: WhatsAppConnection; message: string }> {
    const res = await client.post('/whatsapp/verify-credentials', data);
    return res.data;
  },

  async embeddedSignup(data: any): Promise<{ connection: WhatsAppConnection; message: string }> {
    const res = await client.post('/whatsapp/embedded-signup', data);
    return res.data;
  },

  async disconnectWhatsApp(): Promise<{ connection: WhatsAppConnection }> {
    const res = await client.post('/whatsapp/disconnect');
    return res.data;
  },

  // Conversations & Messages
  async getConversations(): Promise<Conversation[]> {
    const res = await client.get('/conversations');
    return res.data.conversations;
  },

  async getConversationMessages(id: string): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
    const res = await client.get(`/conversations/${id}/messages`);
    return res.data;
  },

  async markConversationRead(id: string): Promise<void> {
    await client.post(`/conversations/${id}/mark-read`);
  },

  async updateConversation(id: string, data: { status?: string; mode?: string; notes?: string }): Promise<Conversation> {
    const res = await client.patch(`/conversations/${id}`, data);
    return res.data.conversation;
  },

  async sendMessage(
    conversationId: string,
    data: {
      text?: string;
      type?: string;
      templateName?: string;
      templateParams?: string[];
      fileId?: string;
      mediaUrl?: string;
      mediaType?: string;
    }
  ): Promise<{ message: ChatMessage; conversation: Conversation }> {
    const res = await client.post(`/conversations/${conversationId}/messages`, data);
    return res.data;
  },

  // Customers / Contacts CRM
  async getContacts(): Promise<Customer[]> {
    const res = await client.get('/contacts');
    return res.data.contacts;
  },

  async createContact(data: { name: string; phone: string; email?: string; tags?: string[]; notes?: string }): Promise<Customer> {
    const res = await client.post('/contacts', data);
    return res.data.contact;
  },

  async updateContact(id: string, data: Partial<Customer>): Promise<Customer> {
    const res = await client.put(`/contacts/${id}`, data);
    return res.data.contact;
  },

  // Leads Pipeline
  async getLeads(): Promise<Lead[]> {
    const res = await client.get('/leads');
    return res.data.leads;
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const res = await client.post('/leads', data);
    return res.data.lead;
  },

  async updateLead(id: string, data: Partial<Lead>): Promise<Lead> {
    const res = await client.patch(`/leads/${id}`, data);
    return res.data.lead;
  },

  // Templates
  async getTemplates(): Promise<MessageTemplate[]> {
    const res = await client.get('/templates');
    return res.data.templates;
  },

  async createTemplate(data: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const res = await client.post('/templates', data);
    return res.data.template;
  },

  async deleteTemplate(id: string): Promise<void> {
    await client.delete(`/templates/${id}`);
  },

  // Automations
  async getAutomations(): Promise<AutomationRule[]> {
    const res = await client.get('/automations');
    return res.data.automations;
  },

  async createAutomation(data: Partial<AutomationRule>): Promise<AutomationRule> {
    const res = await client.post('/automations', data);
    return res.data.automation;
  },

  async updateAutomation(id: string, data: Partial<AutomationRule>): Promise<AutomationRule> {
    const res = await client.put(`/automations/${id}`, data);
    return res.data.automation;
  },

  async deleteAutomation(id: string): Promise<void> {
    await client.delete(`/automations/${id}`);
  },

  // AI Configuration & Copilot
  async getAIConfig(): Promise<AIConfig> {
    const res = await client.get('/ai/config');
    return res.data.config;
  },

  async saveAIConfig(data: Partial<AIConfig>): Promise<AIConfig> {
    const res = await client.put('/ai/config', data);
    return res.data.config;
  },

  async testAIPrompt(message: string): Promise<{ response: string; intent?: string; leadScore?: number; handoff?: boolean }> {
    const res = await client.post('/ai/test', { message });
    return res.data;
  },

  async generateAIDraft(conversationId: string): Promise<string> {
    const res = await client.post('/ai/generate-draft', { conversationId });
    return res.data.draft;
  },

  async analyzeIntent(text: string): Promise<any> {
    const res = await client.post('/ai/analyze-intent', { text });
    return res.data.analysis;
  },

  // Legal & Meta Data Deletion
  async submitDataDeletion(userId: string): Promise<{ url: string; confirmation_code: string }> {
    const res = await client.post('/legal/data-deletion', { userId });
    return res.data;
  },

  async checkDataDeletionStatus(code: string): Promise<any> {
    const res = await client.get(`/legal/data-deletion/${code}`);
    return res.data;
  },

  // Admin
  async getAdminOverview(): Promise<AdminOverview> {
    const res = await client.get('/admin/overview');
    return res.data;
  },

  async replayWebhookEvent(id: string): Promise<any> {
    const res = await client.post(`/admin/events/${id}/replay`);
    return res.data;
  },

  // Firebase Cloud Storage & Media
  async getStorageOverview(): Promise<StorageOverview> {
    const res = await client.get('/storage/overview');
    return res.data.overview;
  },

  async getStorageFiles(params?: {
    category?: string;
    search?: string;
    customerId?: string;
    conversationId?: string;
  }): Promise<StoredFileMetadata[]> {
    const res = await client.get('/storage/files', { params });
    return res.data.files;
  },

  async getFile(id: string): Promise<StoredFileMetadata> {
    const res = await client.get(`/storage/files/${id}`);
    return res.data.file;
  },

  async uploadFile(
    formData: FormData,
    onProgress?: (percent: number) => void
  ): Promise<{ file: StoredFileMetadata; message: string }> {
    const res = await client.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  async deleteFile(id: string): Promise<void> {
    await client.delete(`/storage/files/${id}`);
  },

  async reindexKnowledgeFile(id: string): Promise<{ extractedLength: number; extractedPreview: string; message: string }> {
    const res = await client.post(`/storage/files/${id}/reindex`);
    return res.data;
  },
};
