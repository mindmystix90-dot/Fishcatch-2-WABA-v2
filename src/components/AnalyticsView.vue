<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Conversation, Lead, Customer } from '../types';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Users,
  Target,
  Bot,
  Flame,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-vue-next';

const props = defineProps<{
  conversations: Conversation[];
  leads: Lead[];
  contacts: Customer[];
}>();

const timeFilter = ref<'7d' | '30d' | 'all'>('30d');

const totalConversations = computed(() => props.conversations.length);
const totalLeads = computed(() => props.leads.length);
const qualifiedLeads = computed(() => props.leads.filter(l => l.status === 'Qualified' || l.status === 'Negotiation' || l.status === 'Won').length);
const aiConversations = computed(() => props.conversations.filter(c => c.mode === 'AI').length);
const humanConversations = computed(() => props.conversations.filter(c => c.mode === 'HUMAN').length);

const conversionRate = computed(() => {
  if (totalLeads.value === 0) return 0;
  const wonCount = props.leads.filter(l => l.status === 'Won').length;
  return Math.round((wonCount / totalLeads.value) * 100);
});

// Score bands count
const scoreBands = computed(() => {
  const bands = {
    cold: 0,
    warm: 0,
    hot: 0,
    veryHot: 0,
  };
  props.leads.forEach(l => {
    if (l.score > 80) bands.veryHot++;
    else if (l.score > 60) bands.hot++;
    else if (l.score > 30) bands.warm++;
    else bands.cold++;
  });
  return bands;
});

// Pipeline stage counts
const pipelineStages = computed(() => {
  const stages: Record<string, number> = {
    New: 0,
    Contacted: 0,
    Qualified: 0,
    Negotiation: 0,
    Won: 0,
    Lost: 0,
  };
  props.leads.forEach(l => {
    if (stages[l.status] !== undefined) {
      stages[l.status]++;
    }
  });
  return stages;
});
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto" id="view-analytics">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <BarChart3 class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900">Analytics & Sales Intelligence</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Real-time conversion metrics, lead quality scoring, and AI conversation performance.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
        <button
          @click="timeFilter = '7d'"
          class="px-3 py-1.5 rounded-lg transition-all"
          :class="timeFilter === '7d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
        >
          Last 7 Days
        </button>
        <button
          @click="timeFilter = '30d'"
          class="px-3 py-1.5 rounded-lg transition-all"
          :class="timeFilter === '30d' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
        >
          Last 30 Days
        </button>
        <button
          @click="timeFilter = 'all'"
          class="px-3 py-1.5 rounded-lg transition-all"
          :class="timeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
        >
          All Time
        </button>
      </div>
    </div>

    <!-- 6 Metric Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <!-- 1. Total Conversations -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-semibold">Total Conversations</span>
          <MessageSquare class="w-4 h-4 text-indigo-500" />
        </div>
        <div class="text-2xl font-black text-slate-900 mt-2">{{ totalConversations }}</div>
        <div class="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
          <ArrowUpRight class="w-3 h-3" />
          <span>Real-time</span>
        </div>
      </div>

      <!-- 2. New Leads -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-semibold">New Inbound Leads</span>
          <Users class="w-4 h-4 text-blue-500" />
        </div>
        <div class="text-2xl font-black text-slate-900 mt-2">{{ totalLeads }}</div>
        <div class="text-[11px] text-slate-400 font-semibold mt-1">From WhatsApp</div>
      </div>

      <!-- 3. Qualified Leads -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-semibold">Qualified Leads</span>
          <Target class="w-4 h-4 text-rose-500" />
        </div>
        <div class="text-2xl font-black text-slate-900 mt-2">{{ qualifiedLeads }}</div>
        <div class="text-[11px] text-rose-600 font-semibold mt-1">Score > 60</div>
      </div>

      <!-- 4. AI Conversations -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-semibold">AI Automated</span>
          <Bot class="w-4 h-4 text-purple-500" />
        </div>
        <div class="text-2xl font-black text-slate-900 mt-2">{{ aiConversations }}</div>
        <div class="text-[11px] text-purple-600 font-semibold mt-1">Gemini Handled</div>
      </div>

      <!-- 5. Human Conversations -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-semibold">Human Agent</span>
          <Users class="w-4 h-4 text-amber-500" />
        </div>
        <div class="text-2xl font-black text-slate-900 mt-2">{{ humanConversations }}</div>
        <div class="text-[11px] text-amber-600 font-semibold mt-1">Takeover Chats</div>
      </div>

      <!-- 6. Conversion Rate -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-xs font-semibold">Win Conversion</span>
          <TrendingUp class="w-4 h-4 text-emerald-500" />
        </div>
        <div class="text-2xl font-black text-slate-900 mt-2">{{ conversionRate }}%</div>
        <div class="text-[11px] text-emerald-600 font-semibold mt-1">Won Deals</div>
      </div>
    </div>

    <!-- Charts & Breakdown Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- 1. Lead Score Distribution -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Flame class="w-4 h-4 text-rose-500" />
            Lead Score Band Distribution
          </h3>
          <span class="text-xs font-semibold text-slate-500">Mathematical 0-100 Score</span>
        </div>

        <div v-if="totalLeads > 0" class="space-y-3 pt-2 text-xs">
          <!-- Very Hot -->
          <div>
            <div class="flex justify-between font-semibold mb-1">
              <span class="text-purple-700">Very Hot (81 - 100)</span>
              <span>{{ scoreBands.veryHot }} ({{ Math.round((scoreBands.veryHot / totalLeads) * 100) }}%)</span>
            </div>
            <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-purple-600 rounded-full" :style="{ width: `${(scoreBands.veryHot / totalLeads) * 100}%` }"></div>
            </div>
          </div>

          <!-- Hot -->
          <div>
            <div class="flex justify-between font-semibold mb-1">
              <span class="text-rose-700">Hot (61 - 80)</span>
              <span>{{ scoreBands.hot }} ({{ Math.round((scoreBands.hot / totalLeads) * 100) }}%)</span>
            </div>
            <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-rose-500 rounded-full" :style="{ width: `${(scoreBands.hot / totalLeads) * 100}%` }"></div>
            </div>
          </div>

          <!-- Warm -->
          <div>
            <div class="flex justify-between font-semibold mb-1">
              <span class="text-amber-700">Warm (31 - 60)</span>
              <span>{{ scoreBands.warm }} ({{ Math.round((scoreBands.warm / totalLeads) * 100) }}%)</span>
            </div>
            <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full" :style="{ width: `${(scoreBands.warm / totalLeads) * 100}%` }"></div>
            </div>
          </div>

          <!-- Cold -->
          <div>
            <div class="flex justify-between font-semibold mb-1">
              <span class="text-slate-600">Cold (0 - 30)</span>
              <span>{{ scoreBands.cold }} ({{ Math.round((scoreBands.cold / totalLeads) * 100) }}%)</span>
            </div>
            <div class="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-slate-400 rounded-full" :style="{ width: `${(scoreBands.cold / totalLeads) * 100}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
          No lead qualification data yet. Inbound conversations will automatically appear here as they are scored.
        </div>
      </div>

      <!-- 2. Sales Pipeline Stages -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target class="w-4 h-4 text-indigo-600" />
            CRM Pipeline Funnel
          </h3>
          <span class="text-xs font-semibold text-slate-500">Deal Progress</span>
        </div>

        <div v-if="totalLeads > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div
            v-for="(count, stage) in pipelineStages"
            :key="stage"
            class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between"
          >
            <span class="font-semibold text-slate-500">{{ stage }}</span>
            <div class="text-xl font-bold text-slate-900 mt-2">{{ count }}</div>
          </div>
        </div>

        <div v-else class="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
          Analytics will appear as your conversations grow.
        </div>
      </div>
    </div>
  </div>
</template>
