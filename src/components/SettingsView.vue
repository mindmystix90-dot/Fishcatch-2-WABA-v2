<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { WhatsAppConnection, BusinessTenant } from '../types';
import { api } from '../services/api';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  Building2,
  Sliders,
  Sparkles,
  ArrowRight,
  Phone,
  Radio,
  Clock,
  Shield,
  HelpCircle,
} from 'lucide-vue-next';

const props = defineProps<{
  connection: WhatsAppConnection | null;
  activeBusiness: BusinessTenant | null;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'navigate', tab: string): void;
}>();

// Settings Tabs
const activeTab = ref<'whatsapp' | 'general'>('whatsapp');

// WhatsApp Connection State Machine: NOT_CONNECTED | CONNECTING | CONNECTED | ERROR
const connectionState = ref<'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('NOT_CONNECTED');
const connectionData = ref<{
  businessName?: string;
  phoneNumber?: string;
  connectedAt?: string | null;
  qualityRating?: string;
  lastWebhookAt?: string | null;
} | null>(null);

const isActionLoading = ref(false);
const errorMessage = ref<string | null>(null);
const errorCode = ref<string | null>(null);

// Webhook & Connection Settings
const webhookUrl = ref('');
const hasCopiedWebhook = ref(false);

// Workspace Profile State
const workspaceName = ref(props.activeBusiness?.name || '');
const workspaceEmail = ref(props.activeBusiness?.email || '');
const isSavingProfile = ref(false);
const profileSaveSuccess = ref(false);

// Load connection status from server
const fetchWhatsAppStatus = async () => {
  try {
    const res = await api.getWhatsAppStatus();
    if (res.connected || res.status === 'CONNECTED') {
      connectionState.value = 'CONNECTED';
      connectionData.value = {
        businessName: res.businessName || props.activeBusiness?.name || 'Verified WhatsApp Business',
        phoneNumber: res.phoneNumber || '+91 98765 43210',
        connectedAt: res.connectedAt || new Date().toISOString(),
        qualityRating: 'High Quality (Green)',
        lastWebhookAt: res.lastWebhookAt,
      };
    } else {
      connectionState.value = 'NOT_CONNECTED';
      connectionData.value = null;
    }
  } catch (err: any) {
    console.error('[SIZC Settings] Failed to load WhatsApp status:', err);
    connectionState.value = 'NOT_CONNECTED';
  }
};

// Trigger Connect WhatsApp
const handleConnect = async () => {
  connectionState.value = 'CONNECTING';
  isActionLoading.value = true;
  errorMessage.value = null;
  errorCode.value = null;

  try {
    const res = await api.connectWhatsApp();
    if (res.connected || res.status === 'CONNECTED') {
      connectionState.value = 'CONNECTED';
      connectionData.value = {
        businessName: res.businessName || props.activeBusiness?.name || 'Verified WhatsApp Business',
        phoneNumber: res.phoneNumber || '+91 98765 43210',
        connectedAt: res.connectedAt || new Date().toISOString(),
        qualityRating: 'High Quality (Green)',
      };
      emit('refresh');
    } else {
      connectionState.value = 'ERROR';
      errorCode.value = res.code || 'WHATSAPP_CONFIGURATION_REQUIRED';
      errorMessage.value = res.message || 'WhatsApp configuration is required.';
    }
  } catch (err: any) {
    connectionState.value = 'ERROR';
    const serverError = err?.response?.data;
    errorCode.value = serverError?.code || 'WHATSAPP_CONFIGURATION_REQUIRED';
    errorMessage.value = serverError?.message || err.message || 'WhatsApp configuration is required.';
  } finally {
    isActionLoading.value = false;
  }
};

// Trigger Disconnect WhatsApp
const handleDisconnect = async () => {
  if (!confirm('Are you sure you want to disconnect WhatsApp? Your conversation history and leads will remain safe.')) {
    return;
  }

  isActionLoading.value = true;
  try {
    await api.disconnectWhatsApp();
    connectionState.value = 'NOT_CONNECTED';
    connectionData.value = null;
    emit('refresh');
  } catch (err: any) {
    console.error('[SIZC Settings] Disconnect failed:', err);
  } finally {
    isActionLoading.value = false;
  }
};

// Save Workspace Profile
const handleSaveProfile = async () => {
  if (!props.activeBusiness?.id) return;
  isSavingProfile.value = true;
  profileSaveSuccess.value = false;

  try {
    await api.updateBusiness(props.activeBusiness.id, {
      name: workspaceName.value.trim(),
      email: workspaceEmail.value.trim(),
    });
    profileSaveSuccess.value = true;
    emit('refresh');
    setTimeout(() => {
      profileSaveSuccess.value = false;
    }, 3000);
  } catch (err) {
    console.error('[SIZC Settings] Profile save error:', err);
  } finally {
    isSavingProfile.value = false;
  }
};

const copyWebhook = () => {
  navigator.clipboard.writeText(webhookUrl.value);
  hasCopiedWebhook.value = true;
  setTimeout(() => {
    hasCopiedWebhook.value = false;
  }, 2000);
};

const formattedDate = (dateStr?: string | null) => {
  if (!dateStr) return 'Just now';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

onMounted(() => {
  webhookUrl.value = `${window.location.origin}/api/webhooks/whatsapp`;
  fetchWhatsAppStatus();
});
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6" id="settings-view">
    <!-- Header -->
    <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Settings</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Configure your WhatsApp Business connection, workspace details, and security policies.
        </p>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
        <button
          @click="activeTab = 'whatsapp'"
          class="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all"
          :class="
            activeTab === 'whatsapp'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          "
          id="tab-settings-whatsapp"
        >
          <MessageSquare class="w-3.5 h-3.5 text-emerald-600" />
          <span>WhatsApp</span>
        </button>

        <button
          @click="activeTab = 'general'"
          class="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all"
          :class="
            activeTab === 'general'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          "
          id="tab-settings-general"
        >
          <Building2 class="w-3.5 h-3.5 text-indigo-600" />
          <span>Workspace</span>
        </button>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 1. WHATSAPP CONNECTION TAB -->
    <!-- ===================================================================== -->
    <div v-if="activeTab === 'whatsapp'" class="space-y-6">
      <!-- Main WhatsApp Card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <!-- Top Status Banner -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <MessageSquare class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-base font-bold text-slate-900">WhatsApp Business</h2>
              <p class="text-xs text-slate-500">Official customer messaging channel with automated sales qualification</p>
            </div>
          </div>

          <!-- Status Pill -->
          <div
            class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border"
            :class="
              connectionState === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : connectionState === 'CONNECTING'
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : connectionState === 'ERROR'
                ? 'bg-red-50 text-red-700 border-red-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            "
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="
                connectionState === 'CONNECTED'
                  ? 'bg-emerald-500 animate-pulse'
                  : connectionState === 'CONNECTING'
                  ? 'bg-amber-500 animate-spin'
                  : connectionState === 'ERROR'
                  ? 'bg-red-500'
                  : 'bg-slate-400'
              "
            ></span>
            <span>{{
              connectionState === 'CONNECTED'
                ? 'Connected'
                : connectionState === 'CONNECTING'
                ? 'Connecting...'
                : connectionState === 'ERROR'
                ? 'Configuration Required'
                : 'Disconnected'
            }}</span>
          </div>
        </div>

        <div class="p-6 sm:p-8">
          <!-- ------------------------------------------------------------- -->
          <!-- STATE: NOT_CONNECTED -->
          <!-- ------------------------------------------------------------- -->
          <div v-if="connectionState === 'NOT_CONNECTED'" class="max-w-xl mx-auto text-center py-6 space-y-6">
            <div class="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
              <MessageSquare class="w-8 h-8" />
            </div>

            <div class="space-y-2">
              <h3 class="text-xl font-bold text-slate-900">
                Connect your WhatsApp Business account
              </h3>
              <p class="text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
                Connect your business WhatsApp number to receive, manage and reply to customer conversations from SIZC.
              </p>
            </div>

            <!-- Features Checklist -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto py-2">
              <div class="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-agent team inbox</span>
              </div>
              <div class="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                <span>AI lead qualification</span>
              </div>
              <div class="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant automated replies</span>
              </div>
              <div class="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero secret exposure</span>
              </div>
            </div>

            <!-- Connect Action Button -->
            <div>
              <button
                @click="handleConnect"
                :disabled="isActionLoading"
                class="inline-flex items-center gap-2.5 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all text-sm disabled:opacity-50"
                id="btn-connect-whatsapp"
              >
                <MessageSquare class="w-4 h-4" />
                <span>Connect WhatsApp</span>
              </button>
            </div>
          </div>

          <!-- ------------------------------------------------------------- -->
          <!-- STATE: CONNECTING -->
          <!-- ------------------------------------------------------------- -->
          <div v-else-if="connectionState === 'CONNECTING'" class="max-w-md mx-auto text-center py-12 space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
              <RefreshCw class="w-6 h-6 animate-spin text-emerald-600" />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">Connecting WhatsApp</h3>
              <p class="text-xs text-slate-500 mt-1">
                Authenticating server-side credentials and verifying WhatsApp Business line...
              </p>
            </div>
          </div>

          <!-- ------------------------------------------------------------- -->
          <!-- STATE: ERROR -->
          <!-- ------------------------------------------------------------- -->
          <div v-else-if="connectionState === 'ERROR'" class="max-w-xl mx-auto py-6 space-y-6">
            <div class="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-3">
              <div class="flex items-start gap-3">
                <AlertCircle class="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 class="text-sm font-bold text-red-900">
                    {{ errorCode === 'WHATSAPP_CONFIGURATION_REQUIRED' ? 'WhatsApp Configuration Required' : 'Connection Failed' }}
                  </h3>
                  <p class="text-xs text-red-700 mt-1 leading-relaxed">
                    {{ errorMessage || 'WhatsApp configuration is required.' }}
                  </p>
                </div>
              </div>

              <div class="bg-white/80 p-3.5 rounded-xl border border-red-200/60 text-xs text-slate-700 space-y-1">
                <div class="font-semibold text-slate-900">Required Environment Configuration:</div>
                <div class="font-mono text-[11px] text-slate-600">WHATSAPP_API_KEY / WHATSAPP_PHONE_NUMBER_ID</div>
                <p class="text-[11px] text-slate-500 mt-1">
                  Ensure the WhatsApp provider API credentials are configured in your server environment or .env file.
                </p>
              </div>
            </div>

            <div class="flex items-center justify-center gap-3">
              <button
                @click="connectionState = 'NOT_CONNECTED'"
                class="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                @click="handleConnect"
                :disabled="isActionLoading"
                class="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                id="btn-retry-whatsapp"
              >
                <RefreshCw v-if="isActionLoading" class="w-3.5 h-3.5 animate-spin" />
                <span>Try Again</span>
              </button>
            </div>
          </div>

          <!-- ------------------------------------------------------------- -->
          <!-- STATE: CONNECTED -->
          <!-- ------------------------------------------------------------- -->
          <div v-else-if="connectionState === 'CONNECTED'" class="space-y-6">
            <!-- Connected Banner -->
            <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <CheckCircle2 class="w-5 h-5 text-emerald-600" />
                <span class="text-sm font-bold text-emerald-900">✓ WhatsApp Connected</span>
              </div>
              <span class="text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                Live & Receiving Messages
              </span>
            </div>

            <!-- Details Key-Value Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Business Card -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business</div>
                <div class="text-sm font-bold text-slate-900 truncate">
                  {{ connectionData?.businessName || props.activeBusiness?.name || 'Verified Business' }}
                </div>
              </div>

              <!-- Phone Card -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</div>
                <div class="text-sm font-mono font-bold text-slate-900 truncate">
                  {{ connectionData?.phoneNumber || '+91 98765 43210' }}
                </div>
              </div>

              <!-- Status Card -->
              <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</div>
                <div class="flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Connected</span>
                </div>
              </div>
            </div>

            <!-- Connection Actions -->
            <div class="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 gap-3">
              <button
                @click="handleDisconnect"
                :disabled="isActionLoading"
                class="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                id="btn-disconnect-whatsapp"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>

              <button
                @click="emit('navigate', 'inbox')"
                class="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.99]"
                id="btn-open-inbox"
              >
                <span>Open Inbox</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Connection settings Card -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Connection settings</h3>
            <p class="text-xs text-slate-500 mt-0.5">Webhook and security routing details</p>
          </div>
          <div class="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>Encrypted Pipeline</span>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Incoming Webhook Endpoint</label>
            <div class="flex items-center gap-2">
              <input
                :value="webhookUrl"
                readonly
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 select-all"
              />
              <button
                @click="copyWebhook"
                class="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Check v-if="hasCopiedWebhook" class="w-3.5 h-3.5 text-emerald-600" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ hasCopiedWebhook ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">
              Inbound customer messages and status events are processed in real-time by SIZC Cloud Functions.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================================================================== -->
    <!-- 2. GENERAL WORKSPACE TAB -->
    <!-- ===================================================================== -->
    <div v-else-if="activeTab === 'general'" class="space-y-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 class="text-base font-bold text-slate-900">Workspace Profile</h2>
          <p class="text-xs text-slate-500">Manage your business details and contact email</p>
        </div>

        <div
          v-if="profileSaveSuccess"
          class="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          <span>Workspace profile updated successfully!</span>
        </div>

        <div class="space-y-4 max-w-lg">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Business Workspace Name</label>
            <input
              v-model="workspaceName"
              type="text"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              id="input-settings-biz-name"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Admin Email</label>
            <input
              v-model="workspaceEmail"
              type="email"
              class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              id="input-settings-biz-email"
            />
          </div>

          <div class="pt-2">
            <button
              @click="handleSaveProfile"
              :disabled="isSavingProfile || !workspaceName.trim()"
              class="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
              id="btn-save-workspace"
            >
              <RefreshCw v-if="isSavingProfile" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ isSavingProfile ? 'Saving...' : 'Save Workspace Changes' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
