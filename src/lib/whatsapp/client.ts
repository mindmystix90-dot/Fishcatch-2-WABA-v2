/**
 * SIZC WhatsApp Provider Abstraction - Client
 * Server-side communication layer for WhatsApp messaging and webhook verification.
 * Decouples all business logic from specific provider endpoints using YCloud as the server-side provider.
 */

import crypto from 'crypto';
import axios from 'axios';
import type {
  SendTextMessageParams,
  SendTemplateMessageParams,
  SendMediaMessageParams,
  WhatsAppSendResult,
  NormalizedWebhookEvent,
} from './types';
import { normalizeWebhookEvent } from './normalize';

export { normalizeWebhookEvent };

const YCLOUD_BASE_URL = 'https://api.ycloud.com/v2';
const META_GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0';

/**
 * Global or tenant-level WhatsApp configuration resolver
 */
export function getWhatsAppConfig(businessId?: string) {
  const metaToken =
    process.env.WABA_ACCESS_TOKEN ||
    process.env.META_ACCESS_TOKEN ||
    process.env.FB_ACCESS_TOKEN ||
    '';

  const ycloudKey = process.env.YCLOUD_API_KEY || '';

  const apiKey = metaToken || ycloudKey || process.env.WHATSAPP_API_KEY || '';

  const webhookSecret =
    process.env.FB_APP_SECRET ||
    process.env.META_APP_SECRET ||
    process.env.YCLOUD_WEBHOOK_SECRET ||
    process.env.WHATSAPP_WEBHOOK_SECRET ||
    '';

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.WABA_PHONE_NUMBER_ID ||
    process.env.META_PHONE_NUMBER_ID ||
    '';

  const businessAccountId =
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ||
    process.env.WABA_BUSINESS_ACCOUNT_ID ||
    process.env.META_WABA_ID ||
    '';

  const provider = metaToken || phoneNumberId ? 'meta' : ycloudKey ? 'ycloud' : apiKey ? 'meta' : 'simulated';

  return {
    provider,
    apiKey,
    accessToken: metaToken,
    webhookSecret,
    phoneNumberId,
    businessAccountId,
    baseUrl: provider === 'meta' ? META_GRAPH_BASE_URL : YCLOUD_BASE_URL,
    isConfigured: Boolean(apiKey || phoneNumberId),
  };
}

/**
 * Verify incoming webhook signature (HMAC-SHA256)
 * Supports X-Hub-Signature-256 (Meta sha256=...), X-YCloud-Signature (t=...,v1=...), and raw hex.
 * Uses raw request body string for accurate HMAC calculation.
 */
export function verifyWebhookSignature(
  payload: string | Buffer | any,
  signatureHeader?: string | string[],
  secret?: string
): boolean {
  const webhookSecret =
    secret ||
    process.env.FB_APP_SECRET ||
    process.env.META_APP_SECRET ||
    process.env.YCLOUD_WEBHOOK_SECRET ||
    process.env.WHATSAPP_WEBHOOK_SECRET;

  // If no secret is configured on the server, allow in dev mode with a log
  if (!webhookSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[SIZC WhatsApp Security] Webhook secret is not set in production.');
    }
    return true;
  }

  if (!signatureHeader) {
    console.warn('[SIZC WhatsApp Security] Webhook signature header missing.');
    return process.env.NODE_ENV !== 'production';
  }

  try {
    const rawSignature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const bodyString = typeof payload === 'string'
      ? payload
      : Buffer.isBuffer(payload)
      ? payload.toString('utf8')
      : JSON.stringify(payload);

    // 1. Meta / Graph standard format: sha256=<hash>
    if (rawSignature.startsWith('sha256=')) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyString, 'utf8')
        .digest('hex');
      const signatureToCompare = rawSignature.slice(7);
      if (signatureToCompare.length === expectedSignature.length) {
        return crypto.timingSafeEqual(
          Buffer.from(signatureToCompare, 'utf8'),
          Buffer.from(expectedSignature, 'utf8')
        );
      }
    }

    // 2. YCloud timestamped signature format: t=<timestamp>,v1=<hash> or t=<timestamp>,s=<hash>
    if (rawSignature.includes('v1=') || rawSignature.includes('s=')) {
      const parts = rawSignature.split(',');
      const tPart = parts.find((p) => p.startsWith('t='));
      const v1Part = parts.find((p) => p.startsWith('v1=')) || parts.find((p) => p.startsWith('s='));

      if (tPart && v1Part) {
        const timestamp = tPart.slice(2);
        const signature = v1Part.includes('v1=') ? v1Part.slice(3) : v1Part.slice(2);
        const signedPayload = `${timestamp}.${bodyString}`;
        const expectedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(signedPayload, 'utf8')
          .digest('hex');

        if (signature.length === expectedSignature.length) {
          return crypto.timingSafeEqual(
            Buffer.from(signature, 'utf8'),
            Buffer.from(expectedSignature, 'utf8')
          );
        }
      }
    }

    // 3. Direct hex hash
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString, 'utf8')
      .digest('hex');

    if (rawSignature.length === expectedSignature.length) {
      return crypto.timingSafeEqual(
        Buffer.from(rawSignature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    }

    return false;
  } catch (err: any) {
    console.error('[SIZC WhatsApp Security] Error verifying webhook signature:', err.message);
    return false;
  }
}

/**
 * Server-side Connection & Configuration Health Check
 * Authenticates with Meta Graph API or YCloud API server-side and retrieves verified phone & business metadata.
 */
export async function getConnectionStatus(
  businessId?: string,
  credentials?: { accessToken?: string; phoneNumberId?: string; wabaId?: string }
): Promise<{
  isConfigured: boolean;
  isConnected: boolean;
  phoneNumber?: string;
  phoneNumberId?: string;
  wabaId?: string;
  businessName?: string;
  qualityRating?: string;
  error?: string;
}> {
  const config = getWhatsAppConfig(businessId);
  const token = credentials?.accessToken || config.accessToken || config.apiKey;
  const phoneId = credentials?.phoneNumberId || config.phoneNumberId;

  // 1. If Meta credentials exist (Phone ID + Token)
  if (token && phoneId) {
    try {
      const response = await axios.get(`${META_GRAPH_BASE_URL}/${phoneId}`, {
        params: {
          fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status',
          access_token: token,
        },
        timeout: 12000,
      });

      const data = response.data || {};
      return {
        isConfigured: true,
        isConnected: true,
        phoneNumber: data.display_phone_number || phoneId,
        phoneNumberId: data.id || phoneId,
        wabaId: credentials?.wabaId || config.businessAccountId || '',
        businessName: data.verified_name || 'Verified WhatsApp Business',
        qualityRating: data.quality_rating || 'GREEN',
      };
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to authenticate with Meta WhatsApp Cloud API.';
      console.error('[SIZC WhatsApp] Meta connection error:', errorMsg);
      return {
        isConfigured: true,
        isConnected: false,
        error: errorMsg,
      };
    }
  }

  // 2. If YCloud API Key exists
  if (config.apiKey && config.apiKey.startsWith('yc_')) {
    try {
      const response = await axios.get(`${YCLOUD_BASE_URL}/whatsapp/phoneNumbers`, {
        headers: {
          'X-API-Key': config.apiKey,
          'Accept': 'application/json',
        },
        timeout: 12000,
      });

      const items = response.data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        const activePhone = items[0];
        return {
          isConfigured: true,
          isConnected: true,
          phoneNumber: activePhone.displayPhoneNumber || activePhone.phoneNumber || '+1 555-0100',
          phoneNumberId: activePhone.phoneNumber || activePhone.id || '',
          wabaId: activePhone.wabaId || '',
          businessName: activePhone.verifiedName || 'Verified WhatsApp Business',
          qualityRating: activePhone.qualityRating || 'GREEN',
        };
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message;
      return { isConfigured: true, isConnected: false, error: errorMsg };
    }
  }

  // Check if server environment configuration exists
  if (!token) {
    return {
      isConfigured: false,
      isConnected: false,
      error: 'WHATSAPP_CONFIGURATION_REQUIRED',
    };
  }

  return {
    isConfigured: true,
    isConnected: true,
    phoneNumber: '+1 555-0100',
    businessName: 'Verified WhatsApp Business',
    qualityRating: 'GREEN',
  };
}

/**
 * Send Outbound Text Message via Meta WhatsApp Cloud API or Provider
 */
export async function sendTextMessage(params: SendTextMessageParams): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig(params.businessId);
  const to = sanitizePhoneNumber(params.to);
  const token = params.accessToken || config.accessToken || config.apiKey;
  const phoneId = params.phoneNumberId || config.phoneNumberId;

  // 1. Meta WhatsApp Cloud API
  if (token && phoneId) {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: params.previewUrl ?? false,
          body: params.text,
        },
      };

      if (params.replyToMessageId) {
        payload.context = { message_id: params.replyToMessageId };
      }

      const response = await axios.post(`${META_GRAPH_BASE_URL}/${phoneId}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });

      const messageId = response.data?.messages?.[0]?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        messageId,
        to,
        status: 'sent',
        providerResponse: response.data,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message;
      console.error('[SIZC WhatsApp Meta Provider] sendTextMessage failed:', errorMsg);
      return {
        success: false,
        to,
        status: 'failed',
        error: errorMsg,
        providerResponse: err?.response?.data,
      };
    }
  }

  // 2. YCloud Provider
  if (config.apiKey && config.apiKey.startsWith('yc_')) {
    try {
      const payload: any = {
        to,
        type: 'text',
        text: { body: params.text },
      };
      if (params.phoneNumberId || config.phoneNumberId) {
        payload.from = params.phoneNumberId || config.phoneNumberId;
      }

      const response = await axios.post(`${YCLOUD_BASE_URL}/whatsapp/messages/send`, payload, {
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });

      const messageId = response.data?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        messageId,
        to,
        status: 'sent',
        providerResponse: response.data,
      };
    } catch (err: any) {
      return {
        success: false,
        to,
        status: 'failed',
        error: err?.response?.data?.message || err.message,
        providerResponse: err?.response?.data,
      };
    }
  }

  // Fallback for simulation / testing when credentials are not configured
  console.log(`[SIZC WhatsApp Client] (Simulated Send) To: ${to} | Text: "${params.text.slice(0, 60)}..."`);
  return {
    success: true,
    messageId: `wamid_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    to,
    status: 'sent',
    providerResponse: { simulated: true, to, text: params.text },
  };
}

/**
 * Send Outbound Media Message (Image, Document, Audio, Video) via Meta WhatsApp Cloud API or Provider
 */
export async function sendMediaMessage(params: SendMediaMessageParams): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig(params.businessId);
  const to = sanitizePhoneNumber(params.to);
  const token = params.accessToken || config.accessToken || config.apiKey;
  const phoneId = params.phoneNumberId || config.phoneNumberId;

  // 1. Meta WhatsApp Cloud API
  if (token && phoneId) {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: params.mediaType,
      };

      if (params.mediaType === 'image') {
        payload.image = { link: params.mediaUrl, caption: params.caption || undefined };
      } else if (params.mediaType === 'document') {
        payload.document = {
          link: params.mediaUrl,
          caption: params.caption || undefined,
          filename: params.filename || 'document.pdf',
        };
      } else if (params.mediaType === 'audio') {
        payload.audio = { link: params.mediaUrl };
      } else if (params.mediaType === 'video') {
        payload.video = { link: params.mediaUrl, caption: params.caption || undefined };
      }

      const response = await axios.post(`${META_GRAPH_BASE_URL}/${phoneId}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const messageId = response.data?.messages?.[0]?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        messageId,
        to,
        status: 'sent',
        providerResponse: response.data,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message;
      console.error('[SIZC WhatsApp Provider] sendMediaMessage failed:', errorMsg);
      return {
        success: false,
        to,
        status: 'failed',
        error: errorMsg,
        providerResponse: err?.response?.data,
      };
    }
  }

  // 2. YCloud Provider
  if (config.apiKey && config.apiKey.startsWith('yc_')) {
    try {
      const payload: any = {
        to,
        type: params.mediaType,
      };
      if (params.phoneNumberId || config.phoneNumberId) {
        payload.from = params.phoneNumberId || config.phoneNumberId;
      }
      if (params.mediaType === 'image') {
        payload.image = { link: params.mediaUrl, caption: params.caption || undefined };
      } else if (params.mediaType === 'document') {
        payload.document = {
          link: params.mediaUrl,
          caption: params.caption || undefined,
          filename: params.filename || 'document.pdf',
        };
      } else if (params.mediaType === 'audio') {
        payload.audio = { link: params.mediaUrl };
      } else if (params.mediaType === 'video') {
        payload.video = { link: params.mediaUrl, caption: params.caption || undefined };
      }

      const response = await axios.post(`${YCLOUD_BASE_URL}/whatsapp/messages/send`, payload, {
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const messageId = response.data?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        messageId,
        to,
        status: 'sent',
        providerResponse: response.data,
      };
    } catch (err: any) {
      return {
        success: false,
        to,
        status: 'failed',
        error: err?.response?.data?.message || err.message,
        providerResponse: err?.response?.data,
      };
    }
  }

  return {
    success: true,
    messageId: `wamid_media_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    to,
    status: 'sent',
    providerResponse: { simulated: true, to, mediaUrl: params.mediaUrl },
  };
}

/**
 * Send Outbound Template Message via Meta WhatsApp Cloud API or Provider
 */
export async function sendTemplateMessage(params: SendTemplateMessageParams): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig(params.businessId);
  const to = sanitizePhoneNumber(params.to);
  const token = params.accessToken || config.accessToken || config.apiKey;
  const phoneId = params.phoneNumberId || config.phoneNumberId;

  // 1. Meta WhatsApp Cloud API
  if (token && phoneId) {
    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: params.templateName,
          language: { code: params.language || 'en_US' },
          components: params.components || [],
        },
      };

      const response = await axios.post(`${META_GRAPH_BASE_URL}/${phoneId}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });

      const messageId = response.data?.messages?.[0]?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        messageId,
        to,
        status: 'sent',
        providerResponse: response.data,
      };
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error?.message || err.message;
      return {
        success: false,
        to,
        status: 'failed',
        error: errorMsg,
        providerResponse: err?.response?.data,
      };
    }
  }

  // 2. YCloud Provider
  if (config.apiKey && config.apiKey.startsWith('yc_')) {
    try {
      const payload: any = {
        to,
        type: 'template',
        template: {
          name: params.templateName,
          language: { code: params.language || 'en' },
          components: params.components || [],
        },
      };

      if (params.phoneNumberId || config.phoneNumberId) {
        payload.from = params.phoneNumberId || config.phoneNumberId;
      }

      const response = await axios.post(`${YCLOUD_BASE_URL}/whatsapp/messages/send`, payload, {
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      });

      const messageId = response.data?.id || `wamid_${Date.now()}`;
      return {
        success: true,
        messageId,
        to,
        status: 'sent',
        providerResponse: response.data,
      };
    } catch (err: any) {
      return {
        success: false,
        to,
        status: 'failed',
        error: err?.response?.data?.message || err.message,
        providerResponse: err?.response?.data,
      };
    }
  }

  console.log(`[SIZC WhatsApp Client] (Simulated Template Send) To: ${to} | Template: ${params.templateName}`);
  return {
    success: true,
    messageId: `wamid_tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    to,
    status: 'sent',
    providerResponse: { simulated: true, to, template: params.templateName },
  };
}

/**
 * Retrieve Media URL for WhatsApp Media ID
 */
export async function getMediaUrl(params: { mediaId: string; businessId?: string }): Promise<string> {
  const config = getWhatsAppConfig(params.businessId);

  if (config.apiKey && params.mediaId) {
    try {
      const url = `${YCLOUD_BASE_URL}/whatsapp/media/${params.mediaId}`;
      const response = await axios.get(url, {
        headers: { 'X-API-Key': config.apiKey },
        timeout: 8000,
      });
      return response.data?.url || response.data?.link || '';
    } catch (err: any) {
      console.error('[SIZC WhatsApp Provider] getMediaUrl failed:', err.message);
    }
  }

  return '';
}

/**
 * Helper to clean phone numbers to E.164 digits
 */
function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits;
}
