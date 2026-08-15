<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../services/api';
import {
  FileCheck2,
  Shield,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lock,
  Database,
  Bot,
  MessageSquare,
  Globe,
  FileText,
  Mail,
  UserCheck,
  Server,
  KeyRound,
  EyeOff,
  Check,
} from 'lucide-vue-next';

const props = defineProps<{
  initialTab?: 'privacy' | 'terms' | 'deletion';
}>();

const emit = defineEmits<{
  (e: 'navigate', tab: string): void;
}>();

const activeLegalTab = ref<'privacy' | 'terms' | 'deletion'>(props.initialTab || 'privacy');

// Deletion Form
const deleteUserId = ref('');
const isSubmitting = ref(false);
const deletionResult = ref<{ url: string; confirmation_code: string } | null>(null);

// Status check form
const checkCode = ref('');
const isCheckingStatus = ref(false);
const statusResult = ref<any>(null);
const statusError = ref('');

onMounted(() => {
  // Check URL path or query parameter for tab selection
  const path = window.location.pathname;
  if (path.includes('/privacy-policy') || path.includes('/privacy')) {
    activeLegalTab.value = 'privacy';
  } else if (path.includes('/terms')) {
    activeLegalTab.value = 'terms';
  } else if (path.includes('/data-deletion')) {
    activeLegalTab.value = 'deletion';
  }
});

const handleSubmitDeletion = async () => {
  if (!deleteUserId.value.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await api.submitDataDeletion(deleteUserId.value.trim());
    deletionResult.value = res;
  } catch (err: any) {
    alert(err.message || 'Failed to submit data deletion request');
  } finally {
    isSubmitting.value = false;
  }
};

const handleCheckStatus = async () => {
  if (!checkCode.value.trim() || isCheckingStatus.value) return;
  isCheckingStatus.value = true;
  statusError.value = '';
  statusResult.value = null;
  try {
    const res = await api.checkDataDeletionStatus(checkCode.value.trim());
    statusResult.value = res.dataDeletionRequest || res;
  } catch (err: any) {
    statusError.value = err.response?.data?.error?.message || err.message || 'Request not found';
  } finally {
    isCheckingStatus.value = false;
  }
};

const selectTab = (tab: 'privacy' | 'terms' | 'deletion') => {
  activeLegalTab.value = tab;
  // Update browser URL history without reloading
  if (tab === 'privacy') window.history.pushState({}, '', '/privacy-policy');
  else if (tab === 'terms') window.history.pushState({}, '', '/terms');
  else if (tab === 'deletion') window.history.pushState({}, '', '/data-deletion');
};
</script>

<template>
  <div class="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
            <Shield class="w-4 h-4" />
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Legal, Privacy & Compliance</h1>
            <p class="text-xs text-slate-500 mt-0.5">
              Production Meta WhatsApp Cloud API verified policies, Terms of Service, and User Data Deletion callback.
            </p>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 shrink-0">
        <button
          @click="selectTab('privacy')"
          class="px-3.5 py-1.5 rounded-md transition-colors"
          :class="activeLegalTab === 'privacy' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'"
        >
          Privacy Policy
        </button>
        <button
          @click="selectTab('terms')"
          class="px-3.5 py-1.5 rounded-md transition-colors"
          :class="activeLegalTab === 'terms' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'"
        >
          Terms of Service
        </button>
        <button
          @click="selectTab('deletion')"
          class="px-3.5 py-1.5 rounded-md transition-colors"
          :class="activeLegalTab === 'deletion' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'"
        >
          User Data Deletion
        </button>
      </div>
    </div>

    <!-- Quick Direct Links Bar -->
    <div class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
      <div class="flex items-center gap-2">
        <Globe class="w-4 h-4 text-emerald-600" />
        <span class="font-semibold">Public Compliance Endpoints:</span>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-[11px] font-mono">
        <a href="/privacy-policy" class="hover:underline text-emerald-700 font-bold">/privacy-policy</a>
        <span class="text-emerald-300">•</span>
        <a href="/terms" class="hover:underline text-emerald-700 font-bold">/terms</a>
        <span class="text-emerald-300">•</span>
        <a href="/data-deletion" class="hover:underline text-emerald-700 font-bold">/data-deletion</a>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 1. PRIVACY POLICY -->
    <!-- ===================================================================== -->
    <div v-if="activeLegalTab === 'privacy'" class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
      <!-- Policy Header -->
      <div class="border-b border-slate-100 pb-6">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold mb-3 border border-emerald-200">
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
          <span>Meta WhatsApp Cloud API Compliance Certified</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Fishcatch Privacy Policy</h2>
        <p class="text-xs text-slate-400 mt-1">Effective Date: January 1, 2025 • Last Updated: August 2026 • Version 2.4</p>
      </div>

      <!-- Overview Box -->
      <div class="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <h3 class="font-bold text-slate-900 text-xs sm:text-sm">Summary of Core Privacy Commitments</h3>
        <p class="text-xs text-slate-600">
          Fishcatch ("we", "us", or "our") operates a multi-tenant enterprise WhatsApp SaaS platform enabling automated lead qualification, customer messaging, and intelligent AI copilot routing. We only process data strictly necessary to provide the platform's requested communication functionality. <strong>We do not sell, rent, or monetize personal information.</strong>
        </p>
      </div>

      <!-- Section 1: Scope and Platform Architecture -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Server class="w-4 h-4 text-emerald-600" />
          1. Information We Collect and Process
        </h3>
        <p>In operating Fishcatch and connecting your WhatsApp Business Account (WABA), we process the following categories of information:</p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li><strong>WhatsApp Business Account (WABA) & Meta Credentials:</strong> Meta App IDs, WABA IDs, Phone Number IDs, Business Display Names, verified phone numbers, and encrypted Cloud API access tokens provided during Embedded Signup or manual connection.</li>
          <li><strong>WhatsApp Messages & Conversation Records:</strong> Inbound and outbound message text, WhatsApp Message IDs (WAMID), timestamps, delivery/read receipts, conversation thread identifiers, and customer intent classifications.</li>
          <li><strong>Customer Contact & Lead Data:</strong> WhatsApp phone numbers (E.164 format), customer display names, profile identifiers, qualification scores, custom tags, stage pipeline assignments, and internal agent notes.</li>
          <li><strong>WhatsApp Media & Attachments:</strong> Inbound and outbound voice notes, audio files, images, videos, PDF documents, and business brochures uploaded or transmitted through WhatsApp.</li>
          <li><strong>Business Knowledge Base Documents:</strong> Text files, FAQs, policy manuals, product guides, and PDF documents uploaded by business administrators to ground the Gemini AI agent.</li>
          <li><strong>Account & Administrator Credentials:</strong> Business organization name, administrator email, role-based access privileges, workspace preferences, and system audit logs.</li>
        </ul>
      </div>

      <!-- Section 2: Meta WhatsApp Cloud API & Embedded Signup -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare class="w-4 h-4 text-emerald-600" />
          2. Meta WhatsApp Cloud API & Embedded Signup Integration
        </h3>
        <p>
          Fishcatch communicates directly with Meta's official WhatsApp Cloud API infrastructure. By authorizing your WhatsApp Business Account via Meta Embedded Signup (Facebook Login for Business):
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li>Meta transmits authorized webhook payloads to our secure endpoints (<code>/api/whatsapp/webhook</code>) for incoming messages and delivery status updates.</li>
          <li>We execute API requests to Meta servers solely to deliver outbound WhatsApp messages, HSM approved templates, and media attachments on behalf of the authenticated tenant.</li>
          <li>We strictly respect customer opt-outs. If a WhatsApp user sends <code>STOP</code>, <code>UNSUBSCRIBE</code>, <code>CANCEL</code>, or equivalent opt-out keywords, AI automation is halted immediately.</li>
        </ul>
      </div>

      <!-- Section 3: Cloud Storage & Storage Infrastructure -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Database class="w-4 h-4 text-emerald-600" />
          3. Storage Infrastructure & Multi-Tenant Isolation
        </h3>
        <p>
          All persistent media files, document uploads, and WhatsApp attachments are stored within Google Cloud / Firebase Cloud Storage in partitioned multi-tenant paths (<code>businesses/{businessId}/{category}/...</code>).
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li><strong>Tenant Isolation:</strong> Data belonging to Business A is strictly inaccessible to Business B. Every storage API route and database query enforces authenticated <code>businessId</code> ownership checks.</li>
          <li><strong>Storage Metadata:</strong> File records store only essential operational metadata including file ID, tenant ID, sanitized filename, MIME content type, byte size, uploaded role, creation timestamp, and active status.</li>
          <li><strong>Access Controls:</strong> Firebase service account credentials and private keys are strictly maintained server-side and never exposed to client browsers.</li>
        </ul>
      </div>

      <!-- Section 4: Google Gemini AI Processing & Grounding -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Bot class="w-4 h-4 text-emerald-600" />
          4. Google Gemini AI Agent & Grounding Processing
        </h3>
        <p>
          Fishcatch utilizes Google Gemini models (e.g., <code>gemini-3.7-flash</code>) to power autonomous customer support agents and agent draft replies.
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li><strong>Private Grounding:</strong> Extracted text from uploaded knowledge documents is injected strictly into the system context for the specific business that uploaded them. A tenant's proprietary documents are never shared or cross-referenced with other organizations.</li>
          <li><strong>No Model Training on Private Data:</strong> Customer conversation data and proprietary knowledge files processed through our Gemini API integration are not used by Fishcatch or foundation model providers to train generalized public AI models.</li>
        </ul>
      </div>

      <!-- Section 5: Data Retention & User Deletion Rights -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Trash2 class="w-4 h-4 text-emerald-600" />
          5. Data Retention, GDPR/CCPA Rights & Meta Data Deletion
        </h3>
        <p>
          We retain conversation records and media files only as long as the tenant maintains an active workspace or as required by applicable legal obligations.
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li><strong>Right to Deletion:</strong> End users and WhatsApp customers may request immediate erasure of their contact records, message history, and uploaded media by submitting a request via our public <a href="/data-deletion" class="text-emerald-700 underline font-semibold">User Data Deletion portal</a> or by contacting their business provider.</li>
          <li><strong>Meta Deletion Callback:</strong> Fishcatch maintains a compliant Meta User Data Deletion Callback endpoint (<code>/api/legal/data-deletion</code>) returning a verified confirmation code and real-time status URL.</li>
          <li><strong>File Purging:</strong> When a file or contact is deleted, the corresponding Firebase Cloud Storage object and metadata records are removed.</li>
        </ul>
      </div>

      <!-- Section 6: Security Safeguards -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Lock class="w-4 h-4 text-emerald-600" />
          6. Security Measures
        </h3>
        <p>
          Fishcatch implements industry-standard technical and organizational security controls:
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li>TLS 1.3 encryption in transit for all web, API, and webhook traffic.</li>
          <li>AES-256 encryption at rest for cloud storage objects and databases.</li>
          <li>Path-traversal sanitization and strict MIME type whitelisting on all uploaded attachments.</li>
          <li>Role-based access control and tenant verification guards on all API routes.</li>
        </ul>
      </div>

      <!-- Section 7: Contact Information -->
      <div class="space-y-3 pt-4 border-t border-slate-100">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Mail class="w-4 h-4 text-emerald-600" />
          7. Contact Information & Privacy Inquiries
        </h3>
        <p>
          For privacy inquiries, GDPR/CCPA requests, or compliance questions regarding Fishcatch:
        </p>
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700 font-mono">
          <div><strong>Fishcatch Legal & Compliance Team</strong></div>
          <div>Email: <a href="mailto:privacy@fishcatch.io" class="text-emerald-700 underline">privacy@fishcatch.io</a> / <a href="mailto:support@fishcatch.io" class="text-emerald-700 underline">support@fishcatch.io</a></div>
          <div>Platform: Enterprise WhatsApp AI Communication Platform</div>
          <div>Direct Deletion URL: <a href="/data-deletion" class="text-emerald-700 underline">https://fishcatch.io/data-deletion</a></div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 2. TERMS OF SERVICE -->
    <!-- ===================================================================== -->
    <div v-else-if="activeLegalTab === 'terms'" class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8 text-slate-700 text-xs sm:text-sm leading-relaxed">
      <!-- Terms Header -->
      <div class="border-b border-slate-100 pb-6">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-semibold mb-3 border border-slate-200">
          <FileText class="w-3.5 h-3.5 text-slate-600" />
          <span>Commercial & WhatsApp Usage Terms</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Fishcatch Terms of Service</h2>
        <p class="text-xs text-slate-400 mt-1">Effective Date: January 1, 2025 • Last Updated: August 2026</p>
      </div>

      <!-- Section 1: Agreement to Terms -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">1. Acceptance of Terms & Service Scope</h3>
        <p>
          By creating a workspace, connecting a WhatsApp Business Account (WABA), or using Fishcatch ("the Service"), you agree to be bound by these Terms of Service. If you are entering into these terms on behalf of a company or legal entity, you represent that you have the authority to bind such entity.
        </p>
      </div>

      <!-- Section 2: Meta / WhatsApp Policy Compliance -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">2. WhatsApp & Meta Platform Compliance</h3>
        <p>
          You agree to strictly comply with all applicable Meta policies, including the <strong>WhatsApp Business Messaging Policy</strong> and <strong>WhatsApp Commerce Policy</strong>. In particular, you warrant and agree that:
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li><strong>Opt-In Consent:</strong> You have obtained valid prior opt-in consent from every recipient before sending outbound marketing, notification, or utility WhatsApp template messages.</li>
          <li><strong>Anti-Spam Mandate:</strong> You will not use Fishcatch to send unsolicited spam, bulk non-consensual broadcasts, phishing links, or deceptive promotional content.</li>
          <li><strong>Opt-Out Honoring:</strong> You will immediately cease messaging any recipient who opts out or requests discontinuation of communication.</li>
          <li><strong>Template Compliance:</strong> All outbound HSM message templates must comply with Meta's category guidelines and receive Meta approval prior to broadcast.</li>
        </ul>
      </div>

      <!-- Section 3: AI-Generated Content Limitations -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">3. AI Agent & Generated Content Limitations</h3>
        <p>
          Fishcatch incorporates Google Gemini AI models to generate automated responses, intent classifications, and draft suggestions.
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li><strong>Human Oversight:</strong> While AI automations are grounded using your uploaded documents and business profile, generative AI may occasionally produce inaccurate, incomplete, or unexpected replies. You remain solely responsible for monitoring and configuring your automated agents.</li>
          <li><strong>Content Responsibility:</strong> You are responsible for ensuring that all knowledge base documents uploaded to Fishcatch do not infringe third-party intellectual property or contain unlawful material.</li>
        </ul>
      </div>

      <!-- Section 4: Prohibited Activities -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">4. Prohibited Uses</h3>
        <p>You may not use Fishcatch to:</p>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-600">
          <li>Distribute malware, trojans, viruses, or corrupt binary files.</li>
          <li>Transmit hate speech, harassment, illegal goods/services, or prohibited pharmaceutical products.</li>
          <li>Attempt unauthorized access to other tenants' data or bypass tenant isolation safeguards.</li>
          <li>Reverse-engineer, decompile, or tamper with the platform's proprietary backend architecture.</li>
        </ul>
      </div>

      <!-- Section 5: Service Availability & Third-Party Dependencies -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">5. Third-Party Services & Availability</h3>
        <p>
          Fishcatch interfaces with third-party infrastructure including Meta WhatsApp Cloud API, Google Cloud / Firebase, and hosting providers. We do not guarantee uninterrupted uptime resulting from upstream outages, WhatsApp phone number bans imposed by Meta, or network disruptions beyond our reasonable control.
        </p>
      </div>

      <!-- Section 6: Limitation of Liability -->
      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">6. Limitation of Liability</h3>
        <p>
          To the maximum extent permitted by applicable law, Fishcatch and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues resulting from the use of or inability to use the Service.
        </p>
      </div>

      <!-- Section 7: Termination & Contact -->
      <div class="space-y-3 pt-4 border-t border-slate-100">
        <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">7. Account Suspension, Termination & Contact</h3>
        <p>
          We reserve the right to immediately suspend or terminate access for workspaces that violate Meta WhatsApp policies or engage in abusive messaging practices.
        </p>
        <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-700 font-mono">
          <div><strong>Fishcatch Terms Administration</strong></div>
          <div>Contact: <a href="mailto:support@fishcatch.io" class="text-emerald-700 underline">support@fishcatch.io</a></div>
          <div>Terms Reference: TC-2026-V2</div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 3. USER DATA DELETION & META STATUS -->
    <!-- ===================================================================== -->
    <div v-else class="space-y-6">
      <!-- Submission Card -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-4">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-semibold mb-2 border border-rose-200">
            <Trash2 class="w-3.5 h-3.5 text-rose-600" />
            <span>Meta-Compliant User Data Deletion Callback</span>
          </div>
          <h2 class="text-lg sm:text-xl font-bold text-slate-900">Request User Data Deletion</h2>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">
            In accordance with Meta Platform Policy and GDPR Article 17, WhatsApp users or business administrators may submit a data deletion request to erase customer profile information, conversation history, and uploaded media from our systems.
          </p>
        </div>

        <div class="space-y-3">
          <label class="block text-xs font-bold text-slate-800">
            WhatsApp Phone Number or User ID to Delete
          </label>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              v-model="deleteUserId"
              type="text"
              placeholder="e.g. +1 555 123 4567 or user_12345"
              class="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <button
              @click="handleSubmitDeletion"
              :disabled="!deleteUserId.trim() || isSubmitting"
              class="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Trash2 class="w-4 h-4" />
              <span>{{ isSubmitting ? 'Processing...' : 'Submit Deletion Request' }}</span>
            </button>
          </div>
          <p class="text-[11px] text-slate-400">
            Upon submission, our system immediately processes the deletion of matching conversation transcripts, customer CRM entries, and media files.
          </p>
        </div>

        <!-- Deletion Result Box -->
        <div v-if="deletionResult" class="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-xs animate-in fade-in">
          <div class="flex items-center gap-2 font-bold text-emerald-800 text-sm">
            <CheckCircle2 class="w-5 h-5 text-emerald-600" />
            <span>Data Deletion Request Successfully Processed</span>
          </div>
          <p class="text-slate-600">
            Your request has been fulfilled in accordance with Meta WhatsApp platform guidelines. Keep your confirmation code for verification.
          </p>
          <div class="bg-white p-3.5 rounded-lg border border-emerald-200 space-y-2">
            <div>
              <span class="text-slate-500 font-medium">Confirmation Code:</span>
              <code class="ml-2 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded font-mono font-bold">{{ deletionResult.confirmation_code }}</code>
            </div>
            <div>
              <span class="text-slate-500 font-medium">Public Status Check URL:</span>
              <a :href="deletionResult.url" target="_blank" class="ml-2 font-mono text-emerald-700 underline font-semibold break-all">{{ deletionResult.url }}</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Check Card -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-base font-bold text-slate-900">Check Existing Deletion Request Status</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Enter your deletion confirmation code to verify the audit record and timestamp.
          </p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            v-model="checkCode"
            type="text"
            placeholder="Enter Confirmation Code (e.g. del_abc12345)"
            class="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            @click="handleCheckStatus"
            :disabled="!checkCode.trim() || isCheckingStatus"
            class="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {{ isCheckingStatus ? 'Checking...' : 'Check Status' }}
          </button>
        </div>

        <!-- Status Result -->
        <div v-if="statusResult" class="p-5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 animate-in fade-in">
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-semibold">Request Status:</span>
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
              {{ statusResult.status || 'COMPLETED' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-semibold">User Identifier:</span>
            <span class="font-mono text-slate-800">{{ statusResult.userId || statusResult.user_id }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-500 font-semibold">Timestamp:</span>
            <span class="text-slate-800">{{ new Date(statusResult.requestedAt || statusResult.requested_at).toLocaleString() }}</span>
          </div>
          <div class="pt-2 border-t border-slate-200 text-slate-500 text-[11px]">
            Confirmation Code: <code class="font-mono font-bold text-slate-700">{{ statusResult.confirmationCode || checkCode }}</code>
          </div>
        </div>

        <!-- Status Error -->
        <div v-if="statusError" class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-600 shrink-0" />
          <span>{{ statusError }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
