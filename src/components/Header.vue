<script setup lang="ts">
import { ref } from 'vue';
import type { BusinessTenant, WhatsAppConnection, UserProfile } from '../types';
import {
  Building2,
  Plus,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Shield,
  MessageSquare,
  Sparkles,
  LogOut,
  ExternalLink,
} from 'lucide-vue-next';

const props = defineProps<{
  businesses: BusinessTenant[];
  activeBusiness: BusinessTenant | null;
  connection: WhatsAppConnection | null;
  currentTab: string;
  currentUser?: UserProfile | null;
}>();

const emit = defineEmits<{
  (e: 'switchBusiness', id: string): void;
  (e: 'openCreateBusinessModal'): void;
  (e: 'navigate', tab: string): void;
  (e: 'logout'): void;
}>();

const isDropdownOpen = ref(false);

const handleSelect = (id: string) => {
  isDropdownOpen.value = false;
  emit('switchBusiness', id);
};
</script>

<template>
  <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs" id="sizc-header">
    <!-- Left: Workspace Switcher -->
    <div class="flex items-center gap-4">
      <div class="relative">
        <button
          @click="isDropdownOpen = !isDropdownOpen"
          class="flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-xs"
          id="btn-workspace-switcher"
        >
          <Building2 class="w-3.5 h-3.5 text-indigo-600" />
          <span class="max-w-[160px] truncate font-bold text-slate-900">
            {{ activeBusiness?.name || 'My Workspace' }}
          </span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="isDropdownOpen"
          class="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in"
        >
          <div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Your Business Workspaces
          </div>
          <div class="max-h-56 overflow-y-auto">
            <button
              v-for="biz in businesses"
              :key="biz.id"
              @click="handleSelect(biz.id)"
              class="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 text-xs transition-colors"
              :class="biz.id === activeBusiness?.id ? 'text-indigo-700 bg-indigo-50/60 font-bold' : 'text-slate-700'"
            >
              <div class="truncate">
                <div>{{ biz.name }}</div>
                <div class="text-[10px] text-slate-400 truncate">{{ biz.category }} • {{ biz.country }}</div>
              </div>
              <span v-if="biz.id === activeBusiness?.id" class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            </button>
          </div>
          <div class="border-t border-slate-100 mt-1 pt-1">
            <button
              @click="isDropdownOpen = false; emit('openCreateBusinessModal')"
              class="w-full px-3 py-2 text-left text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
              id="btn-add-workspace-menu"
            >
              <Plus class="w-3.5 h-3.5" />
              Add Another Business Workspace
            </button>
          </div>
        </div>
      </div>

      <!-- Quick Tab Breadcrumb -->
      <div class="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span>/</span>
        <span class="text-slate-700 capitalize font-bold">{{ currentTab.replace('-', ' ') }}</span>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex items-center gap-3">
      <!-- WhatsApp Status Badge -->
      <div
        @click="emit('navigate', 'settings')"
        class="cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors"
        :class="
          connection?.status === 'CONNECTED'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
        "
        id="badge-whatsapp-status"
      >
        <span
          class="w-2 h-2 rounded-full"
          :class="connection?.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"
        ></span>
        <span class="hidden sm:inline">
          {{ connection?.status === 'CONNECTED' ? 'WhatsApp Connected' : 'WhatsApp Disconnected' }}
        </span>
        <span class="sm:hidden">WhatsApp</span>
      </div>

      <!-- AI Simulator Quick Button -->
      <button
        @click="emit('navigate', 'ai-agent')"
        class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors"
        id="btn-quick-ai-sim"
      >
        <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
        <span>Gemini AI Agent</span>
      </button>

      <!-- Logout / Switch to Landing -->
      <button
        @click="emit('logout')"
        title="Exit to Landing Page"
        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        id="btn-header-logout"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
