<script setup lang="ts">
import { ref } from 'vue';
import { api } from '../services/api';
import {
  FileCheck2,
  Shield,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-vue-next';

const activeLegalTab = ref<'privacy' | 'terms' | 'deletion'>('privacy');

// Deletion Form
const deleteUserId = ref('');
const isSubmitting = ref(false);
const deletionResult = ref<{ url: string; confirmation_code: string } | null>(null);

// Status check form
const checkCode = ref('');
const statusResult = ref<any>(null);

const handleSubmitDeletion = async () => {
  if (!deleteUserId.value.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    const res = await api.submitDataDeletion(deleteUserId.value.trim());
    deletionResult.value = res;
  } catch (err: any) {
    alert(err.message);
  } finally {
    isSubmitting.value = false;
  }
};

const handleCheckStatus = async () => {
  if (!checkCode.value.trim()) return;
  try {
    statusResult.value = await api.checkDataDeletionStatus(checkCode.value.trim());
  } catch (err: any) {
    alert(err.message);
  }
};
</script>

<template>
  <div class="p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Legal, Privacy & Compliance</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Meta WhatsApp Cloud API verified policies and User Data Deletion callback endpoints.
        </p>
      </div>

      <!-- Tabs -->
      <div class="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
        <button
          @click="activeLegalTab = 'privacy'"
          class="px-3 py-1.5 rounded transition-colors"
          :class="activeLegalTab === 'privacy' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
        >
          Privacy Policy
        </button>
        <button
          @click="activeLegalTab = 'terms'"
          class="px-3 py-1.5 rounded transition-colors"
          :class="activeLegalTab === 'terms' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
        >
          Terms of Service
        </button>
        <button
          @click="activeLegalTab = 'deletion'"
          class="px-3 py-1.5 rounded transition-colors"
          :class="activeLegalTab === 'deletion' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'"
        >
          User Data Deletion
        </button>
      </div>
    </div>

    <!-- PRIVACY POLICY -->
    <div v-if="activeLegalTab === 'privacy'" class="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6 text-slate-700 text-xs leading-relaxed">
      <div class="border-b border-slate-100 pb-4">
        <h2 class="text-base font-bold text-slate-900">Fishcatch Privacy Policy</h2>
        <p class="text-[11px] text-slate-400 mt-0.5">Effective Date: January 1, 2025 • Version 1.0</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Information We Process</h3>
        <p>
          Fishcatch operates as an enterprise WhatsApp SaaS solution for lead qualification and customer communication. In providing our service via the official Meta WhatsApp Cloud API, we process:
        </p>
        <ul class="list-disc pl-5 space-y-1 text-slate-600">
          <li>WhatsApp phone numbers and WhatsApp Business Account (WABA) IDs</li>
          <li>Inbound message text, delivery timestamps, and status receipts</li>
          <li>Customer profile names as provided by WhatsApp API payloads</li>
          <li>Lead qualification parameters and notes stored per business tenant</li>
        </ul>

        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Meta Platform Compliance & Opt-Out</h3>
        <p>
          We strictly adhere to the Meta WhatsApp Business Terms and Opt-In guidelines. When a user sends keywords such as <code>STOP</code>, <code>UNSUBSCRIBE</code>, or <code>CANCEL</code>, automated AI replies are immediately halted, and the customer record is marked as opted-out.
        </p>

        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">3. AI Processing & Data Isolation</h3>
        <p>
          Inbound messages processed through the Fishcatch AI copilot and lead qualification engine are processed in isolated per-tenant workspaces. Customer communication data is not used for generalized foundation model training.
        </p>
      </div>
    </div>

    <!-- TERMS OF SERVICE -->
    <div v-else-if="activeLegalTab === 'terms'" class="bg-white border border-slate-200 rounded-xl p-8 shadow-xs space-y-6 text-slate-700 text-xs leading-relaxed">
      <div class="border-b border-slate-100 pb-4">
        <h2 class="text-base font-bold text-slate-900">Fishcatch Terms of Service</h2>
        <p class="text-[11px] text-slate-400 mt-0.5">Effective Date: January 1, 2025</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Authorized Use</h3>
        <p>
          By connecting your WhatsApp Business Account (WABA) to Fishcatch, you agree to comply with all applicable Meta policies, including the WhatsApp Commerce Policy and WhatsApp Business Messaging Policy.
        </p>

        <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Spam & Prohibited Content</h3>
        <p>
          Unsolicited spam, misleading marketing broadcasts without customer opt-in, or fraudulent activities are strictly prohibited and result in immediate termination of service.
        </p>
      </div>
    </div>

    <!-- META DATA DELETION REQUEST & STATUS -->
    <div v-else class="space-y-6">
      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-sm font-bold text-slate-900">Meta User Data Deletion Callback & Request</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Meta requires all WhatsApp applications to provide a real Data Deletion callback and status tracking URL.
          </p>
        </div>

        <div class="space-y-3">
          <label class="block text-xs font-bold text-slate-800">Submit Data Deletion Request (WhatsApp Phone or User ID)</label>
          <div class="flex items-center gap-2">
            <input
              v-model="deleteUserId"
              type="text"
              placeholder="e.g. +1 555 123 4567 or user_12345"
              class="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
            />
            <button
              @click="handleSubmitDeletion"
              :disabled="!deleteUserId.trim() || isSubmitting"
              class="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              Submit Deletion
            </button>
          </div>
        </div>

        <!-- Deletion Result -->
        <div v-if="deletionResult" class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
          <div class="flex items-center gap-2 font-bold text-emerald-800">
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            <span>Deletion Request Accepted</span>
          </div>
          <div class="text-slate-700">
            <strong>Confirmation Code:</strong> <code class="bg-white px-2 py-0.5 rounded border border-emerald-200 font-mono">{{ deletionResult.confirmation_code }}</code>
          </div>
          <div class="text-slate-700">
            <strong>Status Check URL:</strong> <span class="font-mono text-emerald-700">{{ deletionResult.url }}</span>
          </div>
        </div>
      </div>

      <!-- Check Deletion Status Card -->
      <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 class="text-sm font-bold text-slate-900">Check Deletion Request Status</h2>
        <div class="flex items-center gap-2">
          <input
            v-model="checkCode"
            type="text"
            placeholder="Enter Confirmation Code (e.g. del_abc123)"
            class="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
          />
          <button
            @click="handleCheckStatus"
            class="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Check Status
          </button>
        </div>

        <div v-if="statusResult" class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <div><strong>Status:</strong> <span class="text-emerald-700 font-bold">{{ statusResult.status }}</span></div>
          <div><strong>User ID:</strong> {{ statusResult.user_id }}</div>
          <div><strong>Requested At:</strong> {{ new Date(statusResult.requested_at).toLocaleString() }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
