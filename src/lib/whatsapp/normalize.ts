/**
 * SIZC WhatsApp Webhook Normalizer
 * Converts provider-specific webhook payloads into a unified SIZC internal event format.
 */

import type {
  NormalizedWebhookEvent,
  WhatsAppEventType,
  WhatsAppMessageType,
  WhatsAppMessageStatus,
} from './types';

/**
 * Normalizes incoming WhatsApp webhook requests into SIZC standard event objects.
 * Handles:
 * - Meta WhatsApp Cloud API / Graph API payloads
 * - YCloud WhatsApp API webhook payloads
 * - Evolution API / Baileys event formats
 * - Generic/Custom WhatsApp provider webhook payloads
 */
export function normalizeWebhookEvent(rawPayload: any): NormalizedWebhookEvent[] {
  if (!rawPayload || typeof rawPayload !== 'object') {
    return [createUnknownEvent(rawPayload, 'Payload is empty or not an object')];
  }

  const events: NormalizedWebhookEvent[] = [];

  try {
    // -------------------------------------------------------------------------
    // 1. Meta WhatsApp Cloud API Webhook Format (entry[].changes[].value...)
    // -------------------------------------------------------------------------
    if (Array.isArray(rawPayload.entry)) {
      for (const entry of rawPayload.entry) {
        const changes = entry.changes || [];
        for (const change of changes) {
          const value = change.value || {};
          const metadata = value.metadata || {};
          const phoneNumberId = metadata.phone_number_id || metadata.display_phone_number;
          const contacts = value.contacts || [];
          const contactProfile = contacts[0]?.profile?.name || '';
          const customerWaId = contacts[0]?.wa_id || '';

          // 1.a Inbound Messages
          if (Array.isArray(value.messages)) {
            for (const msg of value.messages) {
              const msgType: WhatsAppMessageType = mapMetaMessageType(msg.type);
              const eventId = `evt_meta_${msg.id || Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
              const timestamp = msg.timestamp
                ? new Date(Number(msg.timestamp) * 1000).toISOString()
                : new Date().toISOString();

              const normEvent: NormalizedWebhookEvent = {
                eventId,
                eventType: 'message.received',
                channel: 'whatsapp',
                phoneNumberId,
                customerPhone: msg.from || customerWaId,
                customerName: contactProfile || msg.from,
                messageId: msg.id,
                messageType: msgType,
                timestamp,
                rawEventId: msg.id,
                rawPayload: msg,
              };

              // Extract text content or media details based on type
              if (msgType === 'text') {
                normEvent.text = msg.text?.body || '';
              } else if (msgType === 'image') {
                normEvent.media = {
                  id: msg.image?.id,
                  mimeType: msg.image?.mime_type,
                  caption: msg.image?.caption || '',
                  sha256: msg.image?.sha256,
                };
                normEvent.text = msg.image?.caption || '[Image]';
              } else if (msgType === 'document') {
                normEvent.media = {
                  id: msg.document?.id,
                  mimeType: msg.document?.mime_type,
                  filename: msg.document?.filename || 'document',
                  caption: msg.document?.caption || '',
                };
                normEvent.text = msg.document?.caption || `[Document: ${msg.document?.filename || 'file'}]`;
              } else if (msgType === 'audio') {
                normEvent.media = {
                  id: msg.audio?.id,
                  mimeType: msg.audio?.mime_type,
                };
                normEvent.text = '[Voice Note / Audio]';
              } else if (msgType === 'video') {
                normEvent.media = {
                  id: msg.video?.id,
                  mimeType: msg.video?.mime_type,
                  caption: msg.video?.caption || '',
                };
                normEvent.text = msg.video?.caption || '[Video]';
              } else if (msgType === 'location') {
                normEvent.location = {
                  latitude: msg.location?.latitude,
                  longitude: msg.location?.longitude,
                  name: msg.location?.name,
                  address: msg.location?.address,
                };
                normEvent.text = msg.location?.address
                  ? `[Location: ${msg.location.name ? msg.location.name + ' - ' : ''}${msg.location.address}]`
                  : `[Location: ${msg.location?.latitude}, ${msg.location?.longitude}]`;
              } else if (msgType === 'contacts') {
                normEvent.contacts = msg.contacts;
                normEvent.text = `[Shared Contact: ${msg.contacts?.[0]?.name?.formatted_name || 'Contact'}]`;
              } else if (msgType === 'interactive') {
                const interactive = msg.interactive || {};
                normEvent.interactive = {
                  type: interactive.type,
                  button_reply: interactive.button_reply,
                  list_reply: interactive.list_reply,
                };
                normEvent.text =
                  interactive.button_reply?.title ||
                  interactive.list_reply?.title ||
                  '[Interactive Selection]';
              }

              events.push(normEvent);
            }
          }

          // 1.b Status Updates (sent, delivered, read, failed)
          if (Array.isArray(value.statuses)) {
            for (const st of value.statuses) {
              const status = mapMetaStatus(st.status);
              const eventType: WhatsAppEventType =
                status === 'delivered'
                  ? 'message.delivered'
                  : status === 'read'
                  ? 'message.read'
                  : status === 'failed'
                  ? 'message.failed'
                  : 'message.sent';

              const timestamp = st.timestamp
                ? new Date(Number(st.timestamp) * 1000).toISOString()
                : new Date().toISOString();

              const normEvent: NormalizedWebhookEvent = {
                eventId: `evt_status_${st.id || Date.now()}_${st.status}`,
                eventType,
                channel: 'whatsapp',
                phoneNumberId,
                customerPhone: st.recipient_id,
                messageId: st.id,
                status,
                statusDetails: st.errors?.[0]
                  ? {
                      code: st.errors[0].code,
                      title: st.errors[0].title,
                      message: st.errors[0].message,
                      errorData: st.errors[0].error_data,
                    }
                  : undefined,
                timestamp,
                rawEventId: st.id,
                rawPayload: st,
              };

              events.push(normEvent);
            }
          }
        }
      }

      if (events.length > 0) return events;
    }

    // -------------------------------------------------------------------------
    // 2. YCloud WhatsApp Webhook Format
    // -------------------------------------------------------------------------
    if (rawPayload.type && (rawPayload.type.startsWith('whatsapp.inbound_message') || rawPayload.type.startsWith('whatsapp.message.'))) {
      const ycloudType = rawPayload.type;
      const data = rawPayload.whatsappInboundMessage || rawPayload.whatsappMessage || rawPayload.data || rawPayload;
      const eventId = rawPayload.id || `evt_yc_${data.id || Date.now()}`;
      const timestamp = rawPayload.createTime || data.createTime || new Date().toISOString();

      if (ycloudType === 'whatsapp.inbound_message.received' || (!rawPayload.type.includes('status') && data.from)) {
        const msgType = mapGenericMessageType(data.type || data.messageType || 'text');
        const normEvent: NormalizedWebhookEvent = {
          eventId,
          eventType: 'message.received',
          channel: 'whatsapp',
          phoneNumberId: data.wabaPhoneNumber || data.to,
          wabaId: data.wabaId,
          customerPhone: data.from,
          customerName: data.profile?.name || data.senderName || data.from,
          messageId: data.id || data.messageId,
          messageType: msgType,
          text: data.text?.body || data.text || data.caption || '',
          timestamp,
          rawEventId: data.id || rawPayload.id,
          rawPayload,
        };

        if (data.image) {
          normEvent.media = { url: data.image.link || data.image.url, id: data.image.id, caption: data.image.caption };
          if (!normEvent.text) normEvent.text = data.image.caption || '[Image]';
        } else if (data.document) {
          normEvent.media = { url: data.document.link || data.document.url, id: data.document.id, filename: data.document.filename, caption: data.document.caption };
          if (!normEvent.text) normEvent.text = data.document.caption || `[Document: ${data.document.filename || 'file'}]`;
        }

        return [normEvent];
      }

      // Status updates
      const st = data.status || (ycloudType.includes('delivered') ? 'delivered' : ycloudType.includes('read') ? 'read' : ycloudType.includes('failed') ? 'failed' : 'sent');
      return [
        {
          eventId,
          eventType: mapStatusToEventType(st),
          channel: 'whatsapp',
          phoneNumberId: data.wabaPhoneNumber || data.from,
          customerPhone: data.to || data.recipient_id,
          messageId: data.id || data.messageId,
          status: mapMetaStatus(st),
          timestamp,
          rawEventId: data.id || rawPayload.id,
          rawPayload,
        },
      ];
    }

    // -------------------------------------------------------------------------
    // 3. Evolution API / Baileys Format
    // -------------------------------------------------------------------------
    if (rawPayload.event === 'messages.upsert' && rawPayload.data) {
      const msgData = rawPayload.data;
      const key = msgData.key || {};
      const msg = msgData.message || {};
      const senderPhone = (key.remoteJid || '').replace(/@.+$/, '');
      const isFromMe = key.fromMe === true;

      if (!isFromMe) {
        let text = msg.conversation || msg.extendedTextMessage?.text || '';
        let msgType: WhatsAppMessageType = 'text';

        if (msg.imageMessage) {
          msgType = 'image';
          text = msg.imageMessage.caption || '[Image]';
        } else if (msg.documentMessage) {
          msgType = 'document';
          text = msg.documentMessage.caption || `[Document: ${msg.documentMessage.fileName || 'file'}]`;
        }

        return [
          {
            eventId: `evt_evo_${key.id || Date.now()}`,
            eventType: 'message.received',
            channel: 'whatsapp',
            phoneNumberId: rawPayload.instance || 'default',
            customerPhone: senderPhone,
            customerName: msgData.pushName || senderPhone,
            messageId: key.id,
            messageType: msgType,
            text,
            timestamp: new Date().toISOString(),
            rawEventId: key.id,
            rawPayload,
          },
        ];
      }
    }

    // -------------------------------------------------------------------------
    // 4. Standard / Direct Normalized Format Fallback
    // -------------------------------------------------------------------------
    if (rawPayload.customerPhone || rawPayload.from || rawPayload.text) {
      const eventType: WhatsAppEventType = rawPayload.eventType || 'message.received';
      return [
        {
          eventId: rawPayload.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          eventType,
          channel: 'whatsapp',
          phoneNumberId: rawPayload.phoneNumberId || rawPayload.to,
          wabaId: rawPayload.wabaId,
          businessId: rawPayload.businessId,
          customerPhone: rawPayload.customerPhone || rawPayload.from,
          customerName: rawPayload.customerName || rawPayload.name || rawPayload.from,
          messageId: rawPayload.messageId || rawPayload.id || `msg_${Date.now()}`,
          messageType: mapGenericMessageType(rawPayload.messageType || rawPayload.type || 'text'),
          text: rawPayload.text || '',
          media: rawPayload.media,
          location: rawPayload.location,
          status: rawPayload.status,
          timestamp: rawPayload.timestamp || new Date().toISOString(),
          rawEventId: rawPayload.rawEventId || rawPayload.messageId,
          rawPayload,
        },
      ];
    }
  } catch (err: any) {
    console.error('[SIZC Webhook Normalizer] Parsing exception:', err);
    return [createUnknownEvent(rawPayload, err.message)];
  }

  return [createUnknownEvent(rawPayload, 'Unrecognized payload structure')];
}

function mapMetaMessageType(type?: string): WhatsAppMessageType {
  switch (type) {
    case 'text':
      return 'text';
    case 'image':
      return 'image';
    case 'document':
      return 'document';
    case 'audio':
    case 'voice':
      return 'audio';
    case 'video':
      return 'video';
    case 'location':
      return 'location';
    case 'contacts':
      return 'contacts';
    case 'interactive':
      return 'interactive';
    case 'button':
      return 'interactive';
    case 'reaction':
      return 'reaction';
    case 'template':
      return 'template';
    default:
      return 'unknown';
  }
}

function mapGenericMessageType(type?: string): WhatsAppMessageType {
  if (!type) return 'text';
  const t = type.toLowerCase();
  if (t.includes('text')) return 'text';
  if (t.includes('image') || t.includes('photo')) return 'image';
  if (t.includes('doc') || t.includes('pdf')) return 'document';
  if (t.includes('audio') || t.includes('voice')) return 'audio';
  if (t.includes('video')) return 'video';
  if (t.includes('location')) return 'location';
  if (t.includes('contact')) return 'contacts';
  if (t.includes('interactive') || t.includes('button')) return 'interactive';
  return 'unknown';
}

function mapMetaStatus(status?: string): WhatsAppMessageStatus {
  switch (status?.toLowerCase()) {
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'read':
      return 'read';
    case 'failed':
      return 'failed';
    default:
      return 'sent';
  }
}

function mapStatusToEventType(status?: string): WhatsAppEventType {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return 'message.delivered';
    case 'read':
      return 'message.read';
    case 'failed':
      return 'message.failed';
    default:
      return 'message.sent';
  }
}

function createUnknownEvent(rawPayload: any, reason: string): NormalizedWebhookEvent {
  return {
    eventId: `evt_unk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: 'unknown',
    channel: 'whatsapp',
    timestamp: new Date().toISOString(),
    statusDetails: { message: reason },
    rawPayload,
  };
}
