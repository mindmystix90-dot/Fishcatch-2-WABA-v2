<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { AdminOverview, WebhookEventLog } from '../types';
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
} from 'lucide-vue-next';

const overview = ref<AdminOverview | null>(null);
const isLoading = ref(true);
const selectedEvent = ref<WebhookEventLog | null>(null);
const replayingId = ref<string | null>(null);

const loadData = async () => {
  isLoading.value = true;
  try {
    overview.value = await api.getAdminOverview();
  } catch (err: any) {
    console.error(err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadData);

const handleReplay = async (id: string) => {
  replayingId.value = id;
  try {
    await api.replayWebhookEvent(id);
    await loadData();
    alert('Webhook event replayed successfully!');
  } catch (err: any) {
    alert(err.message);
  } finally {
    replayingId.value = null;
  }
};
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Fishcatch Admin & System Health</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Live server telemetry, multi-tenant diagnostics, and webhook event streaming logs.
        </p>
      </div>

      <button
        @click="loadData"
        :disabled="isLoading"
        class="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
      >
        <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
        <span>Refresh Health</span>
      </button>
    </div>

    <!-- Health Metrics Grid -->
    <div v-if="overview" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Server Status</div>
        <div class="text-xl font-bold text-emerald-700 flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>{{ overview.health.status }}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-1">Uptime: {{ Math.floor(overview.health.uptimeSeconds / 60) }} mins</p>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gemini AI SDK</div>
        <div class="text-xl font-bold" :class="overview.health.geminiConfigured ? 'text-emerald-700' : 'text-slate-700'">
          {{ overview.health.geminiConfigured ? 'Connected' : 'Active (Key Auto)' }}
        </div>
        <p class="text-[11px] text-slate-500 mt-1">Model: gemini-2.5-flash</p>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Workspaces</div>
        <div class="text-2xl font-bold text-slate-900">{{ overview.metrics.totalBusinesses }}</div>
        <p class="text-[11px] text-slate-500 mt-1">Multi-tenant isolated</p>
      </div>

      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Total Webhook Events</div>
        <div class="text-2xl font-bold text-slate-900">{{ overview.metrics.totalWebhookEvents }}</div>
        <p class="text-[11px] text-slate-500 mt-1">Real-time captured</p>
      </div>
    </div>

    <!-- Registered Businesses Overview -->
    <div v-if="overview" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <h2 class="text-sm font-bold text-slate-900">Tenant Workspaces Registry</h2>
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
          <tr>
            <th class="p-3">Workspace Name</th>
            <th class="p-3">Tenant ID</th>
            <th class="p-3">Plan</th>
            <th class="p-3">WhatsApp State</th>
            <th class="p-3">Created Date</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="b in overview.businesses" :key="b.id">
            <td class="p-3 font-bold text-slate-900">{{ b.name }}</td>
            <td class="p-3 font-mono text-slate-600 text-[11px]">{{ b.id }}</td>
            <td class="p-3 uppercase text-[10px] font-bold text-emerald-700">{{ b.plan }}</td>
            <td class="p-3 font-semibold text-xs" :class="b.whatsappStatus === 'CONNECTED' ? 'text-emerald-700' : 'text-slate-500'">
              {{ b.whatsappStatus || 'NOT_CONNECTED' }}
            </td>
            <td class="p-3 text-slate-400 text-[11px]">{{ new Date(b.createdAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Recent Webhook Events Log -->
    <div v-if="overview" class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Live Webhook Event Logs</h2>
          <p class="text-xs text-slate-500">Every raw WhatsApp Cloud API event payload captured.</p>
        </div>
      </div>

      <div v-if="overview.recentWebhookEvents.length === 0" class="p-8 text-center text-xs text-slate-400">
        No webhook events captured yet. Inbound WhatsApp messages will appear in this audit log.
      </div>

      <div v-else class="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        <div
          v-for="event in overview.recentWebhookEvents"
          :key="event.id"
          class="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
        >
          <div class="flex items-center gap-3">
            <span
              class="px-2 py-0.5 rounded text-[10px] font-bold"
              :class="event.status === 'processed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700'"
            >
              {{ event.type }}
            </span>
            <div>
              <div class="font-bold text-slate-800">{{ event.summary }}</div>
              <div class="text-[10px] text-slate-400 font-mono">From: {{ event.sender }} • Tenant: {{ event.businessId }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-[10px] text-slate-400">{{ new Date(event.timestamp).toLocaleTimeString() }}</span>
            <button
              @click="handleReplay(event.id)"
              :disabled="replayingId === event.id"
              class="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1"
            >
              <RotateCcw class="w-3 h-3" />
              <span>Replay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
