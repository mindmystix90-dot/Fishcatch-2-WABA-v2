<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { AdminOverview, WebhookEventLog, BusinessTenant, AdminUser, SystemErrorLog } from '../types';
import { api } from '../services/api';
import {
  Activity,
  ShieldAlert,
  Server,
  RefreshCw,
  Building2,
  Cpu,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Users,
  Key,
  Sliders,
  AlertTriangle,
  Radio,
  Zap,
  MessageSquare,
  Bot,
  Send,
  Lock,
  Unlock,
} from 'lucide-vue-next';

const activeTab = ref<'tenants' | 'users' | 'webhooks' | 'errors'>('tenants');
const overview = ref<AdminOverview | null>(null);
const isLoading = ref(true);
const selectedEvent = ref<WebhookEventLog | null>(null);
const replayingId = ref<string | null>(null);
const actionMessage = ref<string | null>(null);
const resetLinkDialog = ref<{ email: string; link: string } | null>(null);

const loadData = async () => {
  isLoading.value = true;
  try {
    overview.value = await api.getAdminOverview();
  } catch (err: any) {
    console.error('[Admin Load Error]', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadData);

const toggleTenantStatus = async (tenant: BusinessTenant) => {
  const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
  try {
    await api.setTenantStatus(tenant.id, newStatus);
    tenant.status = newStatus;
    actionMessage.value = `Workspace ${tenant.name} is now ${newStatus}.`;
    setTimeout(() => (actionMessage.value = null), 4000);
  } catch (err: any) {
    alert(err.message || 'Failed to update tenant status');
  }
};

const toggleTenantFeature = async (
  tenant: BusinessTenant,
  feature: 'whatsapp' | 'ai' | 'campaigns' | 'automations'
) => {
  if (!tenant.features) {
    tenant.features = { whatsapp: true, ai: true, campaigns: true, automations: true };
  }
  const currentVal = tenant.features[feature];
  const updatedFeatures = { ...tenant.features, [feature]: !currentVal };
  try {
    await api.updateTenantFeatures(tenant.id, updatedFeatures);
    tenant.features[feature] = !currentVal;
    actionMessage.value = `Updated ${feature} feature for ${tenant.name}.`;
    setTimeout(() => (actionMessage.value = null), 4000);
  } catch (err: any) {
    alert(err.message || 'Failed to toggle feature');
  }
};

const handleResetPassword = async (user: AdminUser) => {
  try {
    const res = await api.resetUserPassword(user.id);
    if (res.resetLink) {
      resetLinkDialog.value = { email: user.email, link: res.resetLink };
    } else {
      alert(res.message || 'Password reset requested successfully.');
    }
  } catch (err: any) {
    alert(err.message || 'Failed to reset password');
  }
};

const handleReplay = async (id: string) => {
  replayingId.value = id;
  try {
    await api.replayWebhookEvent(id);
    await loadData();
    actionMessage.value = 'Webhook event reprocessed successfully.';
    setTimeout(() => (actionMessage.value = null), 4000);
  } catch (err: any) {
    alert(err.message || 'Failed to replay webhook');
  } finally {
    replayingId.value = null;
  }
};
</script>

<template>
  <div class="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            System Administration
          </span>
          <span class="text-xs text-slate-400 font-mono">v2.1-production</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 mt-1">SIZC Multi-Tenant Admin & Health</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Server-side authorized workspace tenant isolation, feature gating, webhook diagnostics, and security controls.
        </p>
      </div>

      <button
        @click="loadData"
        :disabled="isLoading"
        class="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
      >
        <RefreshCw class="w-4 h-4 text-slate-500" :class="{ 'animate-spin': isLoading }" />
        <span>Refresh Diagnostics</span>
      </button>
    </div>

    <!-- Banner Toast Notification -->
    <div
      v-if="actionMessage"
      class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-in slide-in-from-top duration-200 shadow-xs"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
      <span>{{ actionMessage }}</span>
    </div>

    <!-- Health Metrics Grid -->
    <div v-if="overview" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Server Status</div>
        <div class="text-xl font-bold text-emerald-700 flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{{ overview.health.status }}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-1">Uptime: {{ Math.floor(overview.health.uptimeSeconds / 60) }} mins • Node {{ overview.health.nodeVersion }}</p>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gemini AI Engine</div>
        <div class="text-xl font-bold" :class="overview.health.geminiConfigured ? 'text-emerald-700' : 'text-slate-800'">
          {{ overview.health.geminiConfigured ? 'Active & Ready' : 'Key Configured' }}
        </div>
        <p class="text-[11px] text-slate-500 mt-1">Model: gemini-3.7-flash (Fallback Ready)</p>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Workspaces</div>
        <div class="text-2xl font-bold text-slate-900">{{ overview.metrics.totalBusinesses }}</div>
        <p class="text-[11px] text-slate-500 mt-1">{{ overview.metrics.totalConversations }} Conversations • {{ overview.metrics.totalCustomers }} Contacts</p>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Webhook Pipeline</div>
        <div class="text-xl font-bold flex items-center gap-2" :class="overview.webhookHealth.status === 'healthy' ? 'text-emerald-700' : 'text-amber-600'">
          <Radio class="w-4 h-4" />
          <span class="capitalize">{{ overview.webhookHealth.status }}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-1">{{ overview.metrics.totalWebhookEvents }} Events • Avg {{ overview.webhookHealth.avgLatencyMs }}ms</p>
      </div>
    </div>

    <!-- Admin Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-px text-xs font-semibold">
      <button
        @click="activeTab = 'tenants'"
        class="px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2"
        :class="activeTab === 'tenants' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'"
      >
        <Building2 class="w-4 h-4" />
        <span>Workspaces & Feature Gates</span>
        <span class="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">{{ overview?.businesses.length || 0 }}</span>
      </button>

      <button
        @click="activeTab = 'users'"
        class="px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2"
        :class="activeTab === 'users' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'"
      >
        <Users class="w-4 h-4" />
        <span>User Accounts & Security</span>
        <span class="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">{{ overview?.users?.length || 0 }}</span>
      </button>

      <button
        @click="activeTab = 'webhooks'"
        class="px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2"
        :class="activeTab === 'webhooks' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'"
      >
        <Radio class="w-4 h-4" />
        <span>Webhook Stream Logs</span>
        <span class="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">{{ overview?.recentWebhookEvents.length || 0 }}</span>
      </button>

      <button
        @click="activeTab = 'errors'"
        class="px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2"
        :class="activeTab === 'errors' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'"
      >
        <AlertTriangle class="w-4 h-4" />
        <span>System Error Logs</span>
        <span
          class="px-1.5 py-0.2 rounded text-[10px]"
          :class="overview?.recentErrors?.length ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'"
        >
          {{ overview?.recentErrors?.length || 0 }}
        </span>
      </button>
    </div>

    <!-- TAB 1: WORKSPACES & FEATURE GATING -->
    <div v-if="activeTab === 'tenants' && overview" class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Multi-Tenant Workspaces Management</h2>
          <p class="text-xs text-slate-500">Manage tenant activation status and enable/disable specific modules per tenant.</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="p-3">Workspace Name</th>
              <th class="p-3">Tenant ID</th>
              <th class="p-3">Status</th>
              <th class="p-3">WhatsApp State</th>
              <th class="p-3">Feature Toggles</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="b in overview.businesses" :key="b.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="p-3">
                <div class="font-bold text-slate-900">{{ b.name }}</div>
                <div class="text-[11px] text-slate-500">{{ b.email }} • Plan: {{ b.plan }}</div>
              </td>
              <td class="p-3 font-mono text-slate-600 text-[11px]">{{ b.id }}</td>
              <td class="p-3">
                <span
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"
                  :class="b.status === 'suspended' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="b.status === 'suspended' ? 'bg-rose-500' : 'bg-emerald-500'"></span>
                  {{ b.status === 'suspended' ? 'Suspended' : 'Active' }}
                </span>
              </td>
              <td class="p-3">
                <div
                  class="font-semibold text-xs inline-flex items-center gap-1"
                  :class="b.whatsappStatus === 'CONNECTED' ? 'text-emerald-700' : 'text-slate-500'"
                >
                  <span class="w-2 h-2 rounded-full" :class="b.whatsappStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                  <span>{{ b.whatsappStatus || 'NOT_CONNECTED' }}</span>
                </div>
                <div v-if="b.phoneNumber && b.phoneNumber !== 'None'" class="text-[10px] text-slate-400 font-mono">
                  {{ b.phoneNumber }}
                </div>
              </td>
              <td class="p-3">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <!-- WhatsApp Toggle -->
                  <button
                    @click="toggleTenantFeature(b, 'whatsapp')"
                    class="px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1"
                    :class="b.features?.whatsapp !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'"
                    title="Toggle WhatsApp Integration"
                  >
                    <MessageSquare class="w-3 h-3" />
                    <span>WhatsApp</span>
                  </button>

                  <!-- AI Toggle -->
                  <button
                    @click="toggleTenantFeature(b, 'ai')"
                    class="px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1"
                    :class="b.features?.ai !== false ? 'bg-purple-50 border-purple-200 text-purple-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'"
                    title="Toggle AI Agent"
                  >
                    <Bot class="w-3 h-3" />
                    <span>AI Agent</span>
                  </button>

                  <!-- Campaigns Toggle -->
                  <button
                    @click="toggleTenantFeature(b, 'campaigns')"
                    class="px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1"
                    :class="b.features?.campaigns !== false ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'"
                    title="Toggle Campaigns"
                  >
                    <Send class="w-3 h-3" />
                    <span>Campaigns</span>
                  </button>

                  <!-- Automations Toggle -->
                  <button
                    @click="toggleTenantFeature(b, 'automations')"
                    class="px-2 py-1 rounded text-[10px] font-bold border transition-colors flex items-center gap-1"
                    :class="b.features?.automations !== false ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-100 border-slate-200 text-slate-400 line-through'"
                    title="Toggle Automations"
                  >
                    <Zap class="w-3 h-3" />
                    <span>Automations</span>
                  </button>
                </div>
              </td>
              <td class="p-3 text-right">
                <button
                  @click="toggleTenantStatus(b)"
                  class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors border shadow-2xs"
                  :class="b.status === 'suspended' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'"
                >
                  {{ b.status === 'suspended' ? 'Restore Workspace' : 'Suspend Workspace' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: USERS & PASSWORD RESETS -->
    <div v-if="activeTab === 'users' && overview" class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">User Accounts & Authentication Security</h2>
          <p class="text-xs text-slate-500">View users across tenants and trigger secure password resets via Firebase Admin SDK / Server.</p>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th class="p-3">User Name</th>
              <th class="p-3">Email Address</th>
              <th class="p-3">Role</th>
              <th class="p-3">Tenant Workspace</th>
              <th class="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="user in overview.users" :key="user.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="p-3 font-bold text-slate-900">{{ user.name }}</td>
              <td class="p-3 font-mono text-slate-600">{{ user.email }}</td>
              <td class="p-3">
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                  :class="user.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-700'"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="p-3 text-slate-700 font-medium">{{ user.businessName || user.businessId }}</td>
              <td class="p-3 text-right">
                <button
                  @click="handleResetPassword(user)"
                  class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 ml-auto"
                >
                  <Key class="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Password</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: WEBHOOK EVENT LOGS -->
    <div v-if="activeTab === 'webhooks' && overview" class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">Inbound WhatsApp Webhook Stream</h2>
          <p class="text-xs text-slate-500">Every raw WhatsApp webhook payload captured with HMAC verification status.</p>
        </div>
      </div>

      <div v-if="overview.recentWebhookEvents.length === 0" class="p-12 text-center text-xs text-slate-400">
        No webhook events captured yet. Inbound WhatsApp messages will stream here automatically.
      </div>

      <div v-else class="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
        <div
          v-for="event in overview.recentWebhookEvents"
          :key="event.id"
          class="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
        >
          <div class="flex items-center gap-3">
            <span
              class="px-2 py-0.5 rounded text-[10px] font-bold shrink-0"
              :class="event.status === 'processed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'"
            >
              {{ event.type }}
            </span>
            <div>
              <div class="font-bold text-slate-800">{{ event.summary }}</div>
              <div class="text-[10px] text-slate-400 font-mono">From: {{ event.sender }} • Workspace: {{ event.businessId }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[10px] text-slate-400">{{ new Date(event.timestamp).toLocaleTimeString() }}</span>
            <button
              @click="handleReplay(event.id)"
              :disabled="replayingId === event.id"
              class="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
            >
              <RotateCcw class="w-3 h-3" :class="{ 'animate-spin': replayingId === event.id }" />
              <span>Replay</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: SYSTEM ERRORS LOG -->
    <div v-if="activeTab === 'errors' && overview" class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900">System Diagnostics & Error Audit</h2>
          <p class="text-xs text-slate-500">Live operational error capture across webhooks, outbound APIs, and AI pipelines.</p>
        </div>
      </div>

      <div v-if="!overview.recentErrors || overview.recentErrors.length === 0" class="p-12 text-center text-xs text-emerald-600 bg-emerald-50/50 rounded-xl border border-emerald-100">
        <CheckCircle2 class="w-6 h-6 text-emerald-500 mx-auto mb-2" />
        <div class="font-bold">No system errors recorded.</div>
        <p class="text-slate-500 mt-0.5">All webhook handlers, outbound APIs, and AI models are running smoothly.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="err in overview.recentErrors"
          :key="err.id"
          class="p-4 bg-rose-50/40 border border-rose-100 rounded-xl text-xs space-y-2"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] uppercase">{{ err.source }}</span>
              <span class="font-bold text-slate-800">{{ err.endpoint || 'General' }}</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono">{{ new Date(err.timestamp).toLocaleTimeString() }}</span>
          </div>
          <p class="font-mono text-slate-700 text-[11px]">{{ err.message }}</p>
          <div v-if="err.stack" class="p-2 bg-slate-900 text-slate-300 rounded font-mono text-[10px] overflow-x-auto">
            {{ err.stack }}
          </div>
        </div>
      </div>
    </div>

    <!-- Password Reset Modal Dialog -->
    <div
      v-if="resetLinkDialog"
      class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-150">
        <div class="flex items-center gap-2.5 text-indigo-600">
          <Key class="w-5 h-5" />
          <h3 class="text-base font-bold text-slate-900">Secure Password Reset Link</h3>
        </div>
        <p class="text-xs text-slate-600">
          A secure password reset link has been generated for <strong class="text-slate-900">{{ resetLinkDialog.email }}</strong>:
        </p>
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 break-all select-all">
          {{ resetLinkDialog.link }}
        </div>
        <div class="flex justify-end pt-2">
          <button
            @click="resetLinkDialog = null"
            class="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
