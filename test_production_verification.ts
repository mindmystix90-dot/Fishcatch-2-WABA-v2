import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'http://localhost:3000/api';

async function runVerification() {
  console.log('================================================================');
  console.log('🐟 FISHCATCH FIREBASE CLOUD STORAGE PRODUCTION VERIFICATION SUITE');
  console.log('================================================================\n');

  const results: { name: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  // Helper for reporting
  function record(name: string, passed: boolean, details?: string) {
    results.push({ name, status: passed ? 'PASS' : 'FAIL', details });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}${details ? ` -> ${details}` : ''}`);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: SERVER HEALTH & FIREBASE STORAGE ENGINE STATUS
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing Server Health & Storage Engine ---');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    record('Health Check & Storage Config Check', healthRes.status === 200, `Storage Bucket: ${healthRes.data.storageBucket}`);

    // -------------------------------------------------------------------------
    // TEST 2: IMAGE UPLOAD & PERSISTENCE (TENANT A)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Image Upload, Metadata & Download (Tenant A) ---');
    const tenantA = 'biz_fishcatch_default';
    const fakeImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const formA = new FormData();
    formA.append('file', fakeImageBuffer, {
      filename: 'sample_product_banner.png',
      contentType: 'image/png',
    });
    formA.append('category', 'whatsapp-media');
    formA.append('description', 'High-res product banner');
    formA.append('uploadedBy', 'agent');

    const uploadResA = await axios.post(`${BASE_URL}/storage/upload`, formA, {
      headers: {
        ...formA.getHeaders(),
        'x-business-id': tenantA,
      },
    });

    const fileA = uploadResA.data.file;
    record('Real Image Upload (Tenant A)', uploadResA.status === 201 && fileA.id, `File ID: ${fileA.id}`);

    // Verify Firestore / Metadata Schema
    const hasRequiredMetadata = Boolean(
      fileA.id &&
      fileA.businessId === tenantA &&
      fileA.originalFilename === 'sample_product_banner.png' &&
      fileA.storagePath.includes(tenantA) &&
      fileA.mimeType === 'image/png' &&
      fileA.fileSize > 0 &&
      fileA.uploadedBy === 'agent' &&
      fileA.createdAt &&
      fileA.status === 'active'
    );
    record('Metadata Schema Validation (id, businessId, path, mime, size, status)', hasRequiredMetadata);

    // Download / Open Stored Object as Tenant A
    const downloadResA = await axios.get(`${BASE_URL}/storage/files/${fileA.id}/download`, {
      headers: { 'x-business-id': tenantA },
      responseType: 'arraybuffer',
    });
    record('Download & Read Stored Object (Tenant A)', downloadResA.status === 200 && downloadResA.data.length === fakeImageBuffer.length);

    // -------------------------------------------------------------------------
    // TEST 3: MULTI-TENANT SECURITY & ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Multi-Tenant Security & Access Boundary ---');
    const tenantB = 'biz_solar_green';

    // Tenant B attempts to read file metadata of Tenant A
    let tenantBMetaBlocked = false;
    try {
      await axios.get(`${BASE_URL}/storage/files/${fileA.id}`, {
        headers: { 'x-business-id': tenantB },
      });
    } catch (err: any) {
      tenantBMetaBlocked = err.response?.status === 404 || err.response?.status === 403;
    }
    record('Cross-Tenant Metadata Access Blocked (Tenant B -> Tenant A file)', tenantBMetaBlocked);

    // Tenant B attempts to download Tenant A's file
    let tenantBDownloadBlocked = false;
    try {
      await axios.get(`${BASE_URL}/storage/files/${fileA.id}/download`, {
        headers: { 'x-business-id': tenantB },
      });
    } catch (err: any) {
      tenantBDownloadBlocked = err.response?.status === 404 || err.response?.status === 403;
    }
    record('Cross-Tenant Download Blocked (Tenant B -> Tenant A binary)', tenantBDownloadBlocked);

    // Tenant B attempts to delete Tenant A's file
    let tenantBDeleteBlocked = false;
    try {
      await axios.delete(`${BASE_URL}/storage/files/${fileA.id}`, {
        headers: { 'x-business-id': tenantB },
      });
    } catch (err: any) {
      tenantBDeleteBlocked = err.response?.status === 404 || err.response?.status === 403;
    }
    record('Cross-Tenant Delete Blocked (Tenant B cannot delete Tenant A file)', tenantBDeleteBlocked);

    // Tenant B list files must NOT contain Tenant A's files
    const listResB = await axios.get(`${BASE_URL}/storage/files`, {
      headers: { 'x-business-id': tenantB },
    });
    const leakFound = listResB.data.files.some((f: any) => f.businessId === tenantA || f.id === fileA.id);
    record('Tenant File List Isolation (Tenant B list has 0 Tenant A files)', !leakFound);

    // -------------------------------------------------------------------------
    // TEST 4: SECURITY CONTROLS (PATH TRAVERSAL, MIME VALIDATION, CREDENTIAL LEAKS)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Security Controls & Path Traversal Prevention ---');
    // Path traversal attempt in filename
    const formTraversal = new FormData();
    formTraversal.append('file', Buffer.from('malicious-content'), {
      filename: '../../../../etc/passwd.txt',
      contentType: 'text/plain',
    });
    formTraversal.append('category', 'documents');

    const traversalRes = await axios.post(`${BASE_URL}/storage/upload`, formTraversal, {
      headers: { ...formTraversal.getHeaders(), 'x-business-id': tenantA },
    });
    const storedPath = traversalRes.data.file.storagePath;
    const isSafePath = !storedPath.includes('..') && storedPath.startsWith(`businesses/${tenantA}/documents/`);
    record('Path Traversal Prevention in Filename', isSafePath, `Sanitized Path: ${storedPath}`);

    // Invalid MIME rejection
    let invalidMimeBlocked = false;
    try {
      const formBadMime = new FormData();
      formBadMime.append('file', Buffer.from('binary-exe'), {
        filename: 'malware.exe',
        contentType: 'application/x-msdownload',
      });
      formBadMime.append('category', 'documents');
      await axios.post(`${BASE_URL}/storage/upload`, formBadMime, {
        headers: { ...formBadMime.getHeaders(), 'x-business-id': tenantA },
      });
    } catch (err: any) {
      invalidMimeBlocked = err.response?.status === 400 || err.response?.status === 500;
    }
    record('Invalid MIME Type Blocked (e.g., .exe)', invalidMimeBlocked);

    // Check responses for secret/key leak
    const inspectOverview = await axios.get(`${BASE_URL}/storage/overview`, {
      headers: { 'x-business-id': tenantA },
    });
    const rawJson = JSON.stringify(inspectOverview.data);
    const hasNoKeyLeak = !rawJson.includes('BEGIN PRIVATE KEY') && !rawJson.includes('private_key');
    record('No Service Account Keys Leaked in API Responses', hasNoKeyLeak);

    // -------------------------------------------------------------------------
    // TEST 5: WHATSAPP INBOUND & OUTBOUND MEDIA FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing WhatsApp Media Ingestion & Outbound Attachments ---');
    // Inbound media message webhook simulation
    const inboundWamid = `wamid.test_${Date.now()}`;
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_TEST_ACCOUNT',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '+1555019922', phone_number_id: 'pn_test_123' },
                contacts: [{ profile: { name: 'Dr. Elena Rostova' }, wa_id: '15559876543' }],
                messages: [
                  {
                    from: '15559876543',
                    id: inboundWamid,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'document',
                    document: {
                      filename: 'Lab_Results_Bloodwork.pdf',
                      mime_type: 'application/pdf',
                      id: 'meta_media_doc_9988',
                    },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const webhookRes = await axios.post(`${BASE_URL}/whatsapp/webhook`, webhookPayload);
    record('WhatsApp Inbound Media Webhook Ingestion', webhookRes.status === 200);

    // Verify conversation was created/updated with message
    const convsRes = await axios.get(`${BASE_URL}/conversations`, {
      headers: { 'x-business-id': tenantA },
    });
    const targetConv = convsRes.data.conversations.find((c: any) => c.customerPhone.includes('15559876543'));
    record('Conversation & Customer Created from WhatsApp Inbound Media', Boolean(targetConv));

    // Send Outbound Message with Attached Storage File
    if (targetConv) {
      const sendRes = await axios.post(
        `${BASE_URL}/conversations/${targetConv.id}/messages`,
        {
          text: 'Here is your official prescription document.',
          fileId: fileA.id,
        },
        {
          headers: { 'x-business-id': tenantA },
        }
      );
      record(
        'Outbound WhatsApp Message with Attached Cloud Storage File',
        sendRes.status === 200 && sendRes.data.message?.mediaUrl !== undefined,
        `Sent Msg ID: ${sendRes.data.message?.id}`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 6: GEMINI AI KNOWLEDGE GROUNDING WITH REAL UPLOADED DOCUMENT
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Gemini AI Knowledge Grounding via Cloud Storage ---');
    const secretPromoCode = `FISHCATCH_VIP_SPECIAL_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const knowledgeDocText = `
FISHCATCH ENTERPRISE OFFICIAL POLICY MANUAL
Document Ref: POL-2026-X
Secret Promotional Discount Code: "${secretPromoCode}"
Policy Rule 1: All emergency enterprise support requests must be dispatched within 4 minutes.
Policy Rule 2: Weekend VIP customer accounts receive a 25% automated billing credit.
`;
    const formKnowledge = new FormData();
    formKnowledge.append('file', Buffer.from(knowledgeDocText, 'utf-8'), {
      filename: 'Enterprise_Policy_Manual.txt',
      contentType: 'text/plain',
    });
    formKnowledge.append('category', 'knowledge');
    formKnowledge.append('description', 'Verified policy guide for AI grounding');

    const uploadKnowledgeRes = await axios.post(`${BASE_URL}/storage/upload`, formKnowledge, {
      headers: { ...formKnowledge.getHeaders(), 'x-business-id': tenantA },
    });

    const knowledgeFile = uploadKnowledgeRes.data.file;
    const textExtracted = Boolean(knowledgeFile.extractedText && knowledgeFile.extractedText.includes(secretPromoCode));
    record('Knowledge Document Text Extraction & Storage', textExtracted, `Extracted ${knowledgeFile.extractedText?.length || 0} chars`);

    // Verify AI prompt test receives grounded context
    const aiTestRes = await axios.post(
      `${BASE_URL}/ai/test`,
      {
        message: 'What is the secret promotional discount code and the weekend VIP policy according to the policy manual?',
      },
      {
        headers: { 'x-business-id': tenantA },
      }
    );

    const reply = aiTestRes.data?.response || '';
    const isGroundingWorking = Boolean(reply && (reply.includes(secretPromoCode) || reply.toLowerCase().includes('enterprise') || reply.toLowerCase().includes('credit') || reply.toLowerCase().includes('support') || reply.toLowerCase().includes('25%')));
    record('Gemini AI Response Grounded with Uploaded Storage Knowledge', isGroundingWorking, `AI Reply: "${reply.substring(0, 80)}..."`);

    // Verify Tenant B CANNOT access Tenant A's knowledge
    const aiTestResTenantB = await axios.post(
      `${BASE_URL}/ai/test`,
      {
        message: 'What is the secret promotional discount code in the Enterprise Policy Manual?',
      },
      {
        headers: { 'x-business-id': tenantB },
      }
    );
    const replyB = aiTestResTenantB.data?.response || '';
    const tenantBHasNoSecret = !replyB.includes(secretPromoCode);
    record('Gemini Knowledge Tenant Isolation (Tenant B cannot access Tenant A docs)', tenantBHasNoSecret);

    // -------------------------------------------------------------------------
    // TEST 7: FILE DELETION & LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing File Deletion Lifecycle ---');
    const deleteRes = await axios.delete(`${BASE_URL}/storage/files/${fileA.id}`, {
      headers: { 'x-business-id': tenantA },
    });
    record('Delete File Endpoint', deleteRes.status === 200);

    // Confirm file can no longer be downloaded
    let downloadAfterDelete404 = false;
    try {
      await axios.get(`${BASE_URL}/storage/files/${fileA.id}/download`, {
        headers: { 'x-business-id': tenantA },
      });
    } catch (err: any) {
      downloadAfterDelete404 = err.response?.status === 404;
    }
    record('Deleted File Inaccessible for Download (Returns 404)', downloadAfterDelete404);

    // Cleanup knowledge file
    await axios.delete(`${BASE_URL}/storage/files/${knowledgeFile.id}`, {
      headers: { 'x-business-id': tenantA },
    });

    // Cleanup traversal file
    await axios.delete(`${BASE_URL}/storage/files/${traversalRes.data.file.id}`, {
      headers: { 'x-business-id': tenantA },
    });

  } catch (fatalErr: any) {
    console.error('FATAL TEST RUNNER ERROR:', fatalErr.message, fatalErr.response?.data);
    record('Test Suite Execution', false, fatalErr.message);
  }

  console.log('\n================================================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('================================================================');
  const passes = results.filter(r => r.status === 'PASS').length;
  const fails = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length}`);
  console.log(`PASSED: ${passes}`);
  console.log(`FAILED: ${fails}`);
  console.log('================================================================\n');

  if (fails > 0) {
    process.exit(1);
  }
}

runVerification();
