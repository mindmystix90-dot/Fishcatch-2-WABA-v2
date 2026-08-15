<script setup lang="ts">
import { ref } from 'vue';
import type { MessageTemplate, WhatsAppConnection } from '../types';
import { api } from '../services/api';
import {
  FileText,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-vue-next';

const props = defineProps<{
  templates: MessageTemplate[];
  connection: WhatsAppConnection | null;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const isSyncing = ref(false);
const showCreateModal = ref(false);
const newName = ref('');
const newCategory = ref<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('UTILITY');
const newLanguage = ref('en_US');
const newBody = ref('');
const isSubmitting = ref(false);

const handleSync = async () => {
  isSyncing.value = true;
  try {
    await api.getTemplates();
    emit('refresh');
  } catch (err: any) {
    console.error(err);
  } finally {
    isSyncing.value = false;
  }
};

const handleCreateTemplate = async () => {
  if (!newName.value.trim() || !newBody.value.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await api.createTemplate({
      name: newName.value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
      category: newCategory.value,
      language: newLanguage.value,
      body: newBody.value.trim(),
    });
    showCreateModal.value = false;
    newName.value = '';
    newBody.value = '';
    emit('refresh');
  } catch (err: any) {
    alert(err.response?.data?.error?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this template?')) return;
  try {
    await api.deleteTemplate(id);
    emit('refresh');
  } catch (err: any) {
    alert(err.message);
  }
};
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">WhatsApp HSM Templates</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Pre-approved message templates for outbound broadcasts and utility notifications.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="handleSync"
          :disabled="isSyncing"
          class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isSyncing }" />
          <span>Sync from Meta WABA</span>
        </button>

        <button
          @click="showCreateModal = true"
          class="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus class="w-3.5 h-3.5" />
          Create Template
        </button>
      </div>
    </div>

    <!-- Zero State -->
    <div v-if="templates.length === 0" class="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
      <div class="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
        <FileText class="w-7 h-7" />
      </div>
      <h2 class="text-base font-bold text-slate-900">No message templates yet</h2>
      <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
        Templates allow initiating conversations with customers outside the 24-hour customer service window.
      </p>
      <button
        @click="showCreateModal = true"
        class="mt-4 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
      >
        <Plus class="w-3.5 h-3.5" />
        Create First Template
      </button>
    </div>

    <!-- Templates Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="tpl in templates"
        :key="tpl.id"
        class="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors space-y-4"
      >
        <div>
          <div class="flex items-center justify-between gap-2 mb-2">
            <h3 class="text-xs font-bold text-slate-900 truncate font-mono">{{ tpl.name }}</h3>
            <span
              class="px-2 py-0.5 text-[10px] font-bold rounded-full border"
              :class="{
                'bg-emerald-50 text-emerald-700 border-emerald-200': tpl.status === 'APPROVED',
                'bg-amber-50 text-amber-700 border-amber-200': tpl.status === 'PENDING',
                'bg-rose-50 text-rose-700 border-rose-200': tpl.status === 'REJECTED',
              }"
            >
              {{ tpl.status }}
            </span>
          </div>

          <div class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            <span>{{ tpl.category }}</span>
            <span>•</span>
            <span>{{ tpl.language }}</span>
          </div>

          <div class="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
            {{ tpl.body }}
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span class="text-[11px] text-slate-400">Meta Verified</span>
          <button
            @click="handleDelete(tpl.id)"
            class="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create Template Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-900">Create HSM Template</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Template Name (lowercase, snake_case) *</label>
            <input
              v-model="newName"
              type="text"
              placeholder="e.g. order_confirmation_alert"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                v-model="newCategory"
                class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Language</label>
              <select
                v-model="newLanguage"
                class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="en_US">English (US)</option>
                <option value="es_ES">Spanish</option>
                <option value="pt_BR">Portuguese</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Template Body Text *</label>
            <textarea
              v-model="newBody"
              rows="4"
              placeholder="Hello {{1}}, your consultation appointment has been scheduled for {{2}}. Reply to confirm."
              class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
            ></textarea>
            <p class="text-[10px] text-slate-400 mt-1">
              Use <code class="bg-slate-100 px-1 rounded">&#123;&#123;1&#125;&#125;</code>, <code class="bg-slate-100 px-1 rounded">&#123;&#123;2&#125;&#125;</code> for dynamic parameters.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showCreateModal = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="handleCreateTemplate"
            :disabled="!newName.trim() || !newBody.trim() || isSubmitting"
            class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
