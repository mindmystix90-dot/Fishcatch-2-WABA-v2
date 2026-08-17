/**
 * SIZC Vercel Serverless Function: WhatsApp Webhook Handler
 * Supports Meta Cloud API, YCloud, and standard provider webhooks with signature verification
 */

import type { Request, Response } from 'express';
import { normalizeWebhookEvent, verifyWebhookSignature } from '../../src/lib/whatsapp';
import { saveDocument } from '../../src/services/firestore';

export default async function handler(req: any, res: any) {
  // GET: Webhook verification / health check
  if (req.method === 'GET') {
    const mode = req.query?.['hub.mode'];
    const token = req.query?.['hub.verify_token'];
    const challenge = req.query?.['hub.challenge'];

    const expectedToken =
      process.env.WHATSAPP_WEBHOOK_SECRET ||
      process.env.FB_VERIFY_TOKEN ||
      process.env.WABA_VERIFY_TOKEN ||
      'fishcatch_verify_token_123';

    if (mode === 'subscribe' && token === expectedToken) {
      return res.status(200).send(challenge);
    }

    return res.status(200).json({
      ok: true,
      service: 'SIZC WhatsApp Webhook',
    });
  }

  // POST: Inbound webhook event processing
  if (req.method === 'POST') {
    // 1. Immediately acknowledge webhook provider with HTTP 200
    res.status(200).json({ ok: true, status: 'EVENT_RECEIVED' });

    // 2. Validate webhook request signature
    const signatureHeader =
      req.headers?.['x-hub-signature-256'] ||
      req.headers?.['x-ycloud-signature'] ||
      req.headers?.['x-signature'];

    const isValidSignature = verifyWebhookSignature(req.body, signatureHeader);
    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      console.warn('[SIZC Webhook Serverless] Signature invalid in production.');
      return;
    }

    // 3. Normalize into SIZC standard event objects
    const events = normalizeWebhookEvent(req.body);

    for (const event of events) {
      if (event.eventType === 'unknown') continue;

      const businessId = event.businessId || 'biz_default';

      if (event.eventType.startsWith('message.') && event.status && event.messageId) {
        await saveDocument('messages', event.messageId, {
          id: event.messageId,
          businessId,
          status: event.status,
          updatedAt: new Date().toISOString(),
        });
      }

      if (event.eventType === 'message.received' && event.customerPhone) {
        const msgId = event.messageId || `msg_${Date.now()}`;
        const phone = event.customerPhone.replace(/\D/g, '');
        const customerId = `cust_${phone}`;
        const convId = `conv_${phone}`;
        const timestamp = event.timestamp || new Date().toISOString();

        // Save Contact
        await saveDocument('contacts', customerId, {
          id: customerId,
          businessId,
          phone: `+${phone}`,
          name: event.customerName || `WhatsApp User (+${phone})`,
          optInStatus: 'opted_in',
          updatedAt: timestamp,
        });

        // Save Conversation
        await saveDocument('conversations', convId, {
          id: convId,
          businessId,
          customerId,
          customerPhone: `+${phone}`,
          customerName: event.customerName || `WhatsApp User (+${phone})`,
          lastMessage: event.text || '',
          lastMessageTime: timestamp,
          status: 'open',
          mode: 'AI',
          updatedAt: timestamp,
        });

        // Save Message
        await saveDocument('messages', msgId, {
          id: msgId,
          businessId,
          conversationId: convId,
          customerId,
          from: 'customer',
          senderName: event.customerName || `WhatsApp User (+${phone})`,
          text: event.text || '',
          type: event.messageType || 'text',
          mediaUrl: event.media?.url,
          status: 'delivered',
          timestamp,
          rawPayload: event.rawPayload,
        });

        // Save Webhook Event Log
        await saveDocument('adminAuditLogs', event.eventId, {
          id: event.eventId,
          businessId,
          timestamp,
          type: 'whatsapp.message.received',
          sender: `+${phone}`,
          status: 'processed',
          summary: `Inbound message from ${event.customerName || phone}`,
        });
      }
    }

    return;
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
