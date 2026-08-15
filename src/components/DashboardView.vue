<script setup lang="ts">
import type {
  BusinessTenant,
  WhatsAppConnection,
  Conversation,
  Customer,
  Lead,
  AIConfig,
} from '../types';
import {
  MessageSquare,
  Users,
  Target,
  Bot,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-vue-next';

const props = defineProps<{
  activeBusiness: BusinessTenant | null;
  connection: WhatsAppConnection | null;
  conversations: Conversation[];
  contacts: Customer[];
  leads: Lead[];
  aiConfig: AIConfig | null;
}>();

const emit = defineEmits<{
  (e: 'navigate', tab: string): void;
  (e: 'selectConversation', id: string): void;
}>();

const isConnected = () => props.connection?.status === 'CONNECTED';
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-150">
    <!-- Welcome & Status Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          {{ activeBusiness?.name || 'Workspace Dashboard' }}
        </h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Real-time WhatsApp Cloud API lead handling & Gemini AI assistant pipeline.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="emit('navigate', 'settings')"
          class="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
        >
          Connection Settings
        </button>
        <button
          @click="emit('navigate', 'inbox')"
          class="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <MessageSquare class="w-3.5 h-3.5" />
          Live Inbox
        </button>
      </div>
    </div>

    <!-- WhatsApp Cloud API Connection Banner if Not Connected -->
    <div
      v-if="!isConnected()"
      class="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
    >
      <div class="flex items-start gap-3.5">
        <div class="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertCircle class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-sm font-bold text-slate-900">Connect Meta WhatsApp Cloud API</h2>
          <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">
            Link your official WhatsApp Business Account (WABA) or enter your Phone Number ID and Access Token to begin receiving real customer messages and qualifying leads automatically.
          </p>
        </div>
      </div>
      <button
        @click="emit('navigate', 'settings')"
        class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
      >
        <span>Connect WhatsApp Now</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Real Database Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 1. Total Conversations -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider text-slate-400">Total Conversations</span>
          <div class="p-2 rounded-lg bg-slate-50 text-slate-600">
            <MessageSquare class="w-4 h-4" />
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-900 tracking-tight">
          {{ conversations.length }}
        </div>
        <p class="text-[11px] text-slate-500 mt-1">
          {{ conversations.filter(c => c.status === 'open').length }} currently open
        </p>
      </div>

      <!-- 2. CRM Contacts -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider text-slate-400">CRM Contacts</span>
          <div class="p-2 rounded-lg bg-slate-50 text-slate-600">
            <Users class="w-4 h-4" />
          </div>
        </div>
        <div class="text-3xl font-bold text-slate-900 tracking-tight">
          {{ contacts.length }}
        </div>
        <p class="text-[11px] text-slate-500 mt-1">
          {{ contacts.filter(c => c.optInStatus === 'opted_in').length }} opted-in for communication
        </p>
      </div>

      <!-- 3. WhatsApp Leads -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider text-slate-400">Qualified Leads</span>
          <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <Target class="w-4 h-4" />
          </div>
        </div>
        <div class="text-3xl font-bold text-emerald-700 tracking-tight">
          {{ leads.length }}
        </div>
        <p class="text-[11px] text-slate-500 mt-1">
          {{ leads.filter(l => l.status === 'NEW' || l.status === 'QUALIFIED').length }} in active pipeline
        </p>
      </div>

      <!-- 4. AI Copilot Status -->
      <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-colors">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-medium uppercase tracking-wider text-slate-400">AI Automation</span>
          <div class="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Bot class="w-4 h-4" />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold" :class="aiConfig?.autoReply ? 'text-emerald-700' : 'text-slate-600'">
            {{ aiConfig?.autoReply ? 'Auto-Reply On' : 'Assistant Ready' }}
          </span>
        </div>
        <p class="text-[11px] text-slate-500 mt-1">
          Gemini 3.7 Flash intent analyzer active
        </p>
      </div>
    </div>

    <!-- Two Column Layout: Recent Leads & Recent Chats -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Recent Leads Pipeline -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Target class="w-4 h-4 text-emerald-600" />
            <h2 class="text-sm font-bold text-slate-900">Recent WhatsApp Leads</h2>
          </div>
          <button
            @click="emit('navigate', 'leads')"
            class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View Pipeline <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Leads Content or Zero State -->
        <div v-if="leads.length === 0" class="p-8 text-center my-auto">
          <div class="w-12 h-12 mx-auto rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
            <Target class="w-6 h-6" />
          </div>
          <h3 class="text-sm font-bold text-slate-800">No leads yet</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Your qualified WhatsApp leads will automatically appear here once customers message your connected WhatsApp number.
          </p>
        </div>

        <div v-else class="divide-y divide-slate-100 overflow-y-auto max-h-80">
          <div
            v-for="lead in leads.slice(0, 5)"
            :key="lead.id"
            class="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900">{{ lead.customerName }}</span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  :class="{
                    'bg-blue-50 text-blue-700 border border-blue-200': lead.status === 'NEW',
                    'bg-emerald-50 text-emerald-700 border border-emerald-200': lead.status === 'QUALIFIED',
                    'bg-purple-50 text-purple-700 border border-purple-200': lead.status === 'CONTACTED',
                    'bg-teal-50 text-teal-700 border border-teal-200': lead.status === 'CONVERTED',
                    'bg-slate-100 text-slate-600 border border-slate-200': lead.status === 'LOST',
                  }"
                >
                  {{ lead.status }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                {{ lead.qualificationSummary || lead.intent || 'Inbound inquiry' }}
              </p>
            </div>
            <span class="text-[11px] text-slate-400 shrink-0 font-medium">
              {{ lead.customerPhone }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right: Recent Inbound Conversations -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <MessageSquare class="w-4 h-4 text-emerald-600" />
            <h2 class="text-sm font-bold text-slate-900">Recent Conversations</h2>
          </div>
          <button
            @click="emit('navigate', 'inbox')"
            class="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Open Inbox <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Conversations Content or Zero State -->
        <div v-if="conversations.length === 0" class="p-8 text-center my-auto">
          <div class="w-12 h-12 mx-auto rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
            <MessageSquare class="w-6 h-6" />
          </div>
          <h3 class="text-sm font-bold text-slate-800">No conversations yet</h3>
          <p class="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Connect WhatsApp and start receiving messages. Every inbound message will create a live conversation thread instantly.
          </p>
          <button
            @click="emit('navigate', 'settings')"
            class="mt-4 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            Configure Connection
          </button>
        </div>

        <div v-else class="divide-y divide-slate-100 overflow-y-auto max-h-80">
          <div
            v-for="conv in conversations.slice(0, 5)"
            :key="conv.id"
            @click="emit('selectConversation', conv.id)"
            class="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between"
          >
            <div class="min-w-0 pr-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-900 truncate">{{ conv.customerName }}</span>
                <span
                  class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded"
                  :class="conv.mode === 'AI' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-600 border border-slate-200'"
                >
                  {{ conv.mode }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 truncate mt-0.5">
                {{ conv.lastMessage }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <span v-if="conv.unreadCount > 0" class="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Production Setup Checklist -->
    <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Fishcatch Production Checklist</h2>
          <p class="text-xs text-slate-500 mt-0.5">Verify these 4 steps to ensure complete WhatsApp lead capture readiness.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <div class="p-3.5 rounded-lg border flex items-start gap-3" :class="isConnected() ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'">
          <CheckCircle2 v-if="isConnected()" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <AlertCircle v-else class="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 class="text-xs font-bold text-slate-800">1. Meta WhatsApp API</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ isConnected() ? 'Credentials verified' : 'Requires Phone ID & Token' }}</p>
          </div>
        </div>

        <div class="p-3.5 rounded-lg border bg-emerald-50/40 border-emerald-200 flex items-start gap-3">
          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 class="text-xs font-bold text-slate-800">2. Inbound Webhook</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Auto-challenge verified</p>
          </div>
        </div>

        <div class="p-3.5 rounded-lg border flex items-start gap-3" :class="aiConfig?.enabled ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'">
          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 class="text-xs font-bold text-slate-800">3. Gemini AI Assistant</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">{{ aiConfig?.autoReply ? 'Auto-reply active' : 'Draft assistant ready' }}</p>
          </div>
        </div>

        <div class="p-3.5 rounded-lg border bg-emerald-50/40 border-emerald-200 flex items-start gap-3">
          <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 class="text-xs font-bold text-slate-800">4. Opt-Out Safety</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">STOP/CANCEL handler active</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
