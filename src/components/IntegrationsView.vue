<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { WhatsAppConnection } from '../types';
import { api } from '../services/api';
import {
  MessageSquare,
  Bot,
  Flame,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-vue-next';

const props = defineProps<{
  businessId: string;
}>();

const emit = defineEmits<{
  (e: 'navigate', tab: string): void;
}>();

const connection = ref<{
  connected: boolean;
  status: string;
  businessName?: string;
  phoneNumber?: string;
} | null>(null);

const webhookUrl = ref(
  typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/whatsapp`
    : '/api/webhooks/whatsapp'
);
const hasCopied = ref(false);
const isConnecting = ref(false);

const loadConnection = async () => {
  try {
    const status = await api.getWhatsAppStatus();
    connection.value = status;
    if (typeof window !== 'undefined') {
      webhookUrl.value = `${window.location.origin}/api/webhooks/whatsapp`;
    }
  } catch (err) {
    console.error('Failed to load WhatsApp status:', err);
    if (typeof window !== 'undefined') {
      webhookUrl.value = `${window.location.origin}/api/webhooks/whatsapp`;
    }
  }
};

const handleDirectConnect = async () => {
  try {
    isConnecting.value = true;
    const res = await api.connectWhatsApp();
    connection.value = {
      connected: true,
      status: 'CONNECTED',
      businessName: res.businessName,
      phoneNumber: res.phoneNumber,
    };
  } catch (e) {
    console.error(e);
  } finally {
    isConnecting.value = false;
  }
};

const copyWebhook = () => {
  navigator.clipboard.writeText(webhookUrl.value);
  hasCopied.value = true;
  setTimeout(() => {
    hasCopied.value = false;
  }, 2000);
};

onMounted(() => {
  loadConnection();
});
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto" id="view-integrations">
    <!-- Header -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Integrations & System Architecture</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Manage your WhatsApp Business connectivity, Google Gemini AI model, and Cloud storage.
        </p>
      </div>
      <div class="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
        <ShieldCheck class="w-4 h-4 text-emerald-600" />
        <span>Server-Side Provider Security</span>
      </div>
    </div>

    <!-- Integration Cards Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 1. WhatsApp Business Card -->
      <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
        <div class="p-6 space-y-6">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <MessageSquare class="w-6 h-6" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-bold text-slate-900">WhatsApp Business</h3>
                  <span
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                    :class="
                      connection?.connected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    "
                  >
                    {{ connection?.connected ? 'Connected' : 'Disconnected' }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Direct communication pipeline for inbound customer inquiries, campaigns, and AI automated replies.
                </p>
              </div>
            </div>
          </div>

          <!-- Connection Details -->
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 text-xs">
            <div class="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span class="text-slate-500 font-medium">Connection Status:</span>
              <span :class="connection?.connected ? 'font-bold text-emerald-700' : 'font-bold text-slate-600'">
                {{ connection?.connected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            <div v-if="connection?.phoneNumber" class="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span class="text-slate-500 font-medium">Business Phone:</span>
              <span class="font-mono font-bold text-slate-900">{{ connection.phoneNumber }}</span>
            </div>
            <div v-if="connection?.businessName" class="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span class="text-slate-500 font-medium">Business Name:</span>
              <span class="font-bold text-slate-900">{{ connection.businessName }}</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-slate-500 font-medium">Security:</span>
              <span class="font-semibold text-emerald-700">Encrypted Server-Side Provider Integration</span>
            </div>
          </div>

          <!-- Webhook URL field -->
          <div>
            <label class="block font-semibold text-slate-700 text-xs mb-1">Incoming Webhook URL</label>
            <div class="flex items-center gap-2">
              <input
                :value="webhookUrl"
                readonly
                class="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
              />
              <button
                @click="copyWebhook"
                class="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Check v-if="hasCopied" class="w-3.5 h-3.5 text-emerald-600" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ hasCopied ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">SIZC central webhook endpoint for automated message ingestion and delivery tracking.</p>
          </div>
        </div>

        <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            v-if="!connection?.connected"
            @click="handleDirectConnect"
            :disabled="isConnecting"
            class="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            id="btn-integrations-quick-connect"
          >
            <Zap class="w-3.5 h-3.5 text-emerald-600" />
            <span>{{ isConnecting ? 'Connecting...' : 'Quick Connect WhatsApp' }}</span>
          </button>
          <div v-else class="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
            <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            <span>Active & Ready</span>
          </div>

          <button
            @click="emit('navigate', 'settings')"
            class="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            id="btn-integrations-to-settings"
          >
            <span>Connection settings</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Right Column: AI & Backend Status (1 col) -->
      <div class="space-y-6">
        <!-- 2. Google Gemini API Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Bot class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Google Gemini AI</h3>
              <span class="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                Active & Connected
              </span>
            </div>
          </div>

          <div class="space-y-2 text-xs text-slate-600">
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Model:</span>
              <span class="font-mono font-bold text-slate-800">gemini-3.7-flash</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-400">Structured Output:</span>
              <span class="font-bold text-emerald-600">Enabled (JSON Schema)</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Latency:</span>
              <span class="font-mono text-slate-700">~680ms</span>
            </div>
          </div>
        </div>

        <!-- 3. Firestore Architecture Card -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-xs">
              <Flame class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Cloud Storage Architecture</h3>
              <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Ready & Scalable
              </span>
            </div>
          </div>

          <p class="text-xs text-slate-500 leading-relaxed">
            Multi-tenant isolated collections with realtime listeners for instantaneous messaging and delivery state updates.
          </p>

          <div class="space-y-1.5 text-[11px] font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>tenants/{tenantId}/conversations</div>
            <div>tenants/{tenantId}/leads</div>
            <div>tenants/{tenantId}/integrations/whatsapp</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
