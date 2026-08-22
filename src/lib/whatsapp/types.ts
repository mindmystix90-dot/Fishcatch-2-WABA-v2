/**
 * SIZC WhatsApp Provider Abstraction - Type Definitions
 * Decouples SIZC SaaS platform from specific WhatsApp Business API providers.
 */

export type WhatsAppChannel = 'whatsapp';

export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'document'
  | 'audio'
  | 'video'
  | 'location'
  | 'contacts'
  | 'interactive'
  | 'template'
  | 'reaction'
  | 'unknown';

export type WhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';

export type WhatsAppEventType =
  | 'message.received'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed'
  | 'status.update'
  | 'opt_in'
  | 'opt_out'
  | 'unknown';

export interface WhatsAppMediaPayload {
  id?: string;
  mimeType?: string;
  filename?: string;
  caption?: string;
  url?: string;
  sha256?: string;
  fileSize?: number;
}

export interface WhatsAppLocationPayload {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  url?: string;
}

export interface WhatsAppContactPayload {
  name: {
    formatted_name: string;
    first_name?: string;
    last_name?: string;
  };
  phones?: Array<{ phone: string; type?: string; wa_id?: string }>;
  emails?: Array<{ email: string; type?: string }>;
}

export interface WhatsAppInteractivePayload {
  type: 'button_reply' | 'list_reply';
  button_reply?: { id: string; title: string };
  list_reply?: { id: string; title: string; description?: string };
}

/**
 * Standardized SIZC Normalized Webhook Event
 * All incoming webhook payloads from any WhatsApp provider are converted to this shape.
 */
export interface NormalizedWebhookEvent {
  eventId: string;
  eventType: WhatsAppEventType;
  channel: WhatsAppChannel;
  businessId?: string;
  phoneNumberId?: string;
  wabaId?: string;
  customerPhone?: string;
  customerName?: string;
  messageId?: string;
  messageType?: WhatsAppMessageType;
  text?: string;
  media?: WhatsAppMediaPayload;
  location?: WhatsAppLocationPayload;
  contacts?: WhatsAppContactPayload[];
  interactive?: WhatsAppInteractivePayload;
  status?: WhatsAppMessageStatus;
  statusDetails?: {
    code?: number | string;
    title?: string;
    message?: string;
    errorData?: any;
  };
  timestamp: string;
  rawEventId?: string;
  rawPayload: any;
}

/**
 * Outbound Text Message Parameters
 */
export interface SendTextMessageParams {
  to: string;
  text: string;
  businessId?: string;
  phoneNumberId?: string;
  accessToken?: string;
  previewUrl?: boolean;
  replyToMessageId?: string;
}

/**
 * Outbound Template Message Parameters
 */
export interface SendTemplateMessageParams {
  to: string;
  templateName: string;
  language?: string;
  businessId?: string;
  phoneNumberId?: string;
  accessToken?: string;
  components?: Array<{
    type: 'header' | 'body' | 'button';
    sub_type?: 'url' | 'quick_reply';
    index?: string | number;
    parameters: Array<{
      type: 'text' | 'image' | 'document' | 'video' | 'payload';
      text?: string;
      image?: { link?: string; id?: string };
      document?: { link?: string; filename?: string; id?: string };
      payload?: string;
    }>;
  }>;
}

/**
 * Outbound Media Message Parameters
 */
export interface SendMediaMessageParams {
  to: string;
  mediaType: 'image' | 'document' | 'audio' | 'video';
  mediaUrl: string;
  caption?: string;
  filename?: string;
  businessId?: string;
  phoneNumberId?: string;
  accessToken?: string;
}

/**
 * Outbound API Send Result
 */
export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  to: string;
  status: WhatsAppMessageStatus;
  providerResponse?: any;
  error?: string;
}

/**
 * Webhook Verification Config
 */
export interface WebhookVerificationOptions {
  rawBody?: string | Buffer;
  headers: Record<string, string | string[] | undefined>;
  secret?: string;
  verifyToken?: string;
}
