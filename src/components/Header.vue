<script setup lang="ts">
import { ref } from 'vue';
import type { BusinessTenant, WhatsAppConnection } from '../types';
import {
  Building2,
  Plus,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Shield,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-vue-next';

const props = defineProps<{
  businesses: BusinessTenant[];
  activeBusiness: BusinessTenant | null;
  connection: WhatsAppConnection | null;
  currentTab: string;
}>();

const emit = defineEmits<{
  (e: 'switchBusiness', id: string): void;
  (e: 'openCreateBusinessModal'): void;
  (e: 'navigate', tab: string): void;
}>();

const isDropdownOpen = ref(false);

const handleSelect = (id: string) => {
  isDropdownOpen.value = false;
  emit('switchBusiness', id);
};
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
    <!-- Brand & Workspace Switcher -->
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2.5 cursor-pointer" @click="emit('navigate', 'dashboard')">
        <div class="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-lg">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5L2 22l5.14-1.34C8.58 21.5 10.24 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="text-lg font-bold tracking-tight text-slate-900">Fishcatch</span>
            <span class="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Production</span>
          </div>
          <p class="text-[11px] text-slate-500 font-medium">WhatsApp AI Lead Automation</p>
        </div>
      </div>

      <!-- Workspace Selector -->
      <div class="relative">
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <Building2 class="w-3.5 h-3.5 text-slate-500" />
          <span class="max-w-[150px] truncate font-semibold text-slate-800">{{ activeBusiness?.name || 'Select Workspace' }}</span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="isDropdownOpen"
          class="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspaces
          </div>
          <div class="max-h-56 overflow-y-auto">
            <button
              v-for="biz in businesses"
              :key="biz.id"
              @click="handleSelect(biz.id)"
              class="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 text-xs transition-colors"
              :class="biz.id === activeBusiness?.id ? 'text-emerald-700 bg-emerald-50/50 font-semibold' : 'text-slate-700'"
            >
              <div class="truncate">
                <div>{{ biz.name }}</div>
                <div class="text-[10px] text-slate-400 truncate">{{ biz.email }}</div>
              </div>
              <span v-if="biz.id === activeBusiness?.id" class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            </button>
          </div>
          <div class="border-t border-slate-100 mt-1 pt-1">
            <button
              @click="isDropdownOpen = false; emit('openCreateBusinessModal')"
              class="w-full px-3 py-2 text-left text-xs font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
            >
              <Plus class="w-3.5 h-3.5" />
              Create New Business Workspace
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: WhatsApp Cloud API Status & Action -->
    <div class="flex items-center gap-3">
      <!-- WhatsApp Status Badge -->
      <div
        v-if="connection?.status === 'CONNECTED'"
        @click="emit('navigate', 'settings')"
        class="cursor-pointer flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-800 text-xs font-medium hover:bg-emerald-100 transition-colors"
      >
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Meta Cloud API: <strong>Connected</strong> ({{ connection.displayPhoneNumber || 'Active' }})</span>
      </div>

      <div
        v-else
        @click="emit('navigate', 'settings')"
        class="cursor-pointer flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-medium hover:bg-amber-100 transition-colors"
      >
        <AlertCircle class="w-3.5 h-3.5 text-amber-600" />
        <span>WhatsApp: <strong>Not Connected</strong></span>
      </div>

      <!-- Quick Action -->
      <button
        @click="emit('navigate', 'inbox')"
        class="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs"
      >
        <MessageSquare class="w-3.5 h-3.5" />
        Open Live Inbox
      </button>
    </div>
  </header>
</template>
