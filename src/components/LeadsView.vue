<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Lead, LeadStatus } from '../types';
import { api } from '../services/api';
import {
  Target,
  Search,
  Filter,
  ArrowRight,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  MessageSquare,
} from 'lucide-vue-next';

const props = defineProps<{
  leads: Lead[];
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'openChat', customerPhone: string): void;
}>();

const viewMode = ref<'kanban' | 'table'>('kanban');
const searchQuery = ref('');

const stages: { id: LeadStatus; label: string; color: string; bg: string }[] = [
  { id: 'NEW', label: 'New Lead', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'CONTACTED', label: 'Contacted', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { id: 'CONVERTED', label: 'Converted', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  { id: 'LOST', label: 'Lost / Closed', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
];

const filteredLeads = computed(() => {
  if (!searchQuery.value.trim()) return props.leads;
  const q = searchQuery.value.toLowerCase();
  return props.leads.filter(
    l =>
      l.customerName.toLowerCase().includes(q) ||
      l.customerPhone.toLowerCase().includes(q) ||
      (l.qualificationSummary || '').toLowerCase().includes(q)
  );
});

const getLeadsForStage = (stageId: LeadStatus) => {
  return filteredLeads.value.filter(l => l.status === stageId);
};

const handleUpdateStage = async (leadId: string, newStage: LeadStatus) => {
  try {
    await api.updateLead(leadId, { status: newStage });
    emit('refresh');
  } catch (err: any) {
    console.error(err);
  }
};
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Leads Pipeline</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Real WhatsApp leads classified automatically via Gemini AI intent qualification.
        </p>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-3">
        <div class="relative w-64">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search leads..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <div class="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
          <button
            @click="viewMode = 'kanban'"
            class="px-2.5 py-1 rounded transition-colors"
            :class="viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
          >
            Kanban
          </button>
          <button
            @click="viewMode = 'table'"
            class="px-2.5 py-1 rounded transition-colors"
            :class="viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'"
          >
            Table
          </button>
        </div>
      </div>
    </div>

    <!-- Zero State if No Leads at all -->
    <div v-if="leads.length === 0" class="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
      <div class="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
        <Target class="w-7 h-7" />
      </div>
      <h2 class="text-base font-bold text-slate-900">No leads yet</h2>
      <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
        Your qualified WhatsApp leads will automatically appear here once incoming customer messages are processed by Fishcatch.
      </p>
    </div>

    <!-- Kanban View -->
    <div v-else-if="viewMode === 'kanban'" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div
        v-for="stage in stages"
        :key="stage.id"
        class="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col min-h-[450px]"
      >
        <!-- Stage Column Header -->
        <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" :class="stage.id === 'QUALIFIED' ? 'bg-emerald-500' : 'bg-slate-400'"></span>
            <span class="text-xs font-bold text-slate-800">{{ stage.label }}</span>
          </div>
          <span class="text-[11px] font-bold px-1.5 py-0.2 bg-white text-slate-600 rounded border border-slate-200">
            {{ getLeadsForStage(stage.id).length }}
          </span>
        </div>

        <!-- Cards List -->
        <div class="space-y-3 flex-1 overflow-y-auto">
          <div
            v-for="lead in getLeadsForStage(stage.id)"
            :key="lead.id"
            class="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs hover:border-emerald-300 transition-all space-y-2.5"
          >
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-xs font-bold text-slate-900">{{ lead.customerName }}</h3>
                <div class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone class="w-3 h-3 text-slate-400" />
                  <span>{{ lead.customerPhone }}</span>
                </div>
              </div>
              <span class="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                Score: {{ lead.score }}
              </span>
            </div>

            <p class="text-[11px] text-slate-600 leading-snug line-clamp-2">
              {{ lead.qualificationSummary || lead.intent || 'Inbound inquiry' }}
            </p>

            <!-- Quick Stage Move -->
            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <select
                :value="lead.status"
                @change="(e: any) => handleUpdateStage(lead.id, e.target.value)"
                class="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700"
              >
                <option v-for="s in stages" :key="s.id" :value="s.id">
                  Move to {{ s.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
          <tr>
            <th class="p-3.5">Customer</th>
            <th class="p-3.5">Phone</th>
            <th class="p-3.5">Stage</th>
            <th class="p-3.5">Score</th>
            <th class="p-3.5">Qualification Summary</th>
            <th class="p-3.5">Created</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="lead in filteredLeads" :key="lead.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="p-3.5 font-bold text-slate-900">{{ lead.customerName }}</td>
            <td class="p-3.5 text-slate-600">{{ lead.customerPhone }}</td>
            <td class="p-3.5">
              <select
                :value="lead.status"
                @change="(e: any) => handleUpdateStage(lead.id, e.target.value)"
                class="text-xs font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1"
              >
                <option v-for="s in stages" :key="s.id" :value="s.id">{{ s.label }}</option>
              </select>
            </td>
            <td class="p-3.5 font-bold text-emerald-700">{{ lead.score }}</td>
            <td class="p-3.5 text-slate-600 max-w-xs truncate">{{ lead.qualificationSummary }}</td>
            <td class="p-3.5 text-slate-400 text-[11px]">{{ new Date(lead.createdAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
