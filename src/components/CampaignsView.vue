<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Campaign, MessageTemplate } from '../types';
import { api } from '../services/api';
import {
  Send,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Users,
  Search,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-vue-next';

const props = defineProps<{
  businessId: string;
}>();

const campaigns = ref<Campaign[]>([]);
const templates = ref<MessageTemplate[]>([]);
const isLoading = ref(true);

const showCreateModal = ref(false);
const newName = ref('');
const newAudience = ref('All Qualified Leads (Score > 60)');
const newTemplateId = ref('');
const newMessageText = ref('');
const newSchedule = ref('Immediate');
const isSubmitting = ref(false);

const loadData = async () => {
  isLoading.value = true;
  try {
    const [camps, tpls] = await Promise.all([
      api.getCampaigns(),
      api.getTemplates(),
    ]);
    campaigns.value = camps;
    templates.value = tpls;
  } catch (err) {
    console.error('Failed to load campaigns:', err);
  } finally {
    isLoading.value = false;
  }
};

const handleCreateCampaign = async () => {
  if (!newName.value.trim()) return;
  isSubmitting.value = true;
  try {
    const created = await api.createCampaign({
      name: newName.value.trim(),
      audience: newAudience.value,
      templateId: newTemplateId.value || undefined,
      messageText: newMessageText.value.trim(),
      schedule: newSchedule.value,
      status: 'Scheduled',
      targetCount: 45,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      repliedCount: 0,
    });
    campaigns.value.unshift(created);
    showCreateModal.value = false;
    newName.value = '';
    newMessageText.value = '';
  } catch (err) {
    console.error('Failed to create campaign:', err);
  } finally {
    isSubmitting.value = false;
  }
};

const getStatusBadge = (status: Campaign['status']) => {
  switch (status) {
    case 'Running':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Scheduled':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Completed':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Paused':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto" id="view-campaigns">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Send class="w-6 h-6" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900">WhatsApp Campaigns</h1>
          <p class="text-xs text-slate-500 mt-0.5">
            Broadcast approved WhatsApp templates and promotions to segmented lead audiences.
          </p>
        </div>
      </div>

      <button
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
        id="btn-create-campaign"
      >
        <Plus class="w-4 h-4" />
        <span>Create Campaign</span>
      </button>
    </div>

    <!-- Campaigns List -->
    <div v-if="campaigns.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="c in campaigns"
        :key="c.id"
        class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-200 transition-all flex flex-col justify-between"
      >
        <div>
          <div class="flex items-center justify-between">
            <span
              class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
              :class="getStatusBadge(c.status)"
            >
              {{ c.status }}
            </span>
            <span class="text-[11px] text-slate-400 font-mono">{{ new Date(c.createdAt).toLocaleDateString() }}</span>
          </div>

          <h3 class="text-base font-bold text-slate-900 mt-2">{{ c.name }}</h3>
          <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Users class="w-3.5 h-3.5 text-slate-400" />
            <span>Audience: {{ c.audience }}</span>
          </p>

          <!-- Delivery Metric Cards -->
          <div class="grid grid-cols-4 gap-2 mt-4 text-center">
            <div class="p-2 bg-slate-50 rounded-lg">
              <div class="text-[10px] text-slate-400 font-semibold">Target</div>
              <div class="font-bold text-xs text-slate-800">{{ c.targetCount }}</div>
            </div>
            <div class="p-2 bg-slate-50 rounded-lg">
              <div class="text-[10px] text-slate-400 font-semibold">Sent</div>
              <div class="font-bold text-xs text-slate-800">{{ c.sentCount }}</div>
            </div>
            <div class="p-2 bg-slate-50 rounded-lg">
              <div class="text-[10px] text-slate-400 font-semibold">Delivered</div>
              <div class="font-bold text-xs text-emerald-600">{{ c.deliveredCount }}</div>
            </div>
            <div class="p-2 bg-slate-50 rounded-lg">
              <div class="text-[10px] text-slate-400 font-semibold">Replied</div>
              <div class="font-bold text-xs text-indigo-600">{{ c.repliedCount }}</div>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Schedule: {{ c.schedule }}</span>
          <span class="font-semibold text-indigo-600 cursor-pointer hover:underline">View Analytics →</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!isLoading"
      class="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto space-y-4"
    >
      <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
        <Send class="w-6 h-6" />
      </div>
      <h3 class="text-base font-bold text-slate-900">No campaigns launched yet</h3>
      <p class="text-xs text-slate-500 leading-relaxed">
        Send approved WhatsApp template broadcasts to re-engage past leads or announce seasonal offers with high conversion rates.
      </p>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
      >
        <Plus class="w-4 h-4" />
        <span>Create Your First Campaign</span>
      </button>
    </div>

    <!-- Create Campaign Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div class="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900">Launch New WhatsApp Campaign</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Campaign Name</label>
            <input
              v-model="newName"
              type="text"
              placeholder="e.g. Diwali Bridal Collection Early Preview"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Target Lead Audience</label>
            <select
              v-model="newAudience"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option>All Qualified Leads (Score > 60)</option>
              <option>Hot Leads (Score 80-100)</option>
              <option>Pricing Inquiries from Last 30 Days</option>
              <option>All Contacts</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Select Approved WhatsApp Template</label>
            <select
              v-model="newTemplateId"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="">Custom Message Text (Within 24h Window)</option>
              <option v-for="t in templates" :key="t.id" :value="t.id">
                {{ t.name }} ({{ t.category }})
              </option>
            </select>
          </div>

          <div v-if="!newTemplateId">
            <label class="block font-semibold text-slate-700 mb-1">Message Copy</label>
            <textarea
              v-model="newMessageText"
              rows="3"
              placeholder="Type WhatsApp message..."
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="handleCreateCampaign"
            :disabled="!newName.trim() || isSubmitting"
            class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
          >
            {{ isSubmitting ? 'Creating...' : 'Schedule Campaign' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
