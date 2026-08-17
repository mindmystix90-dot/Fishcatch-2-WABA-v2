<script setup lang="ts">
import {
  MessageSquare,
  Users,
  Target,
  Bot,
  Zap,
  Send,
  FileText,
  BarChart3,
  Layers,
  Settings,
  HelpCircle,
  User,
  ShieldCheck,
  Building2,
} from 'lucide-vue-next';
import SizcLogo from './SizcLogo.vue';
import type { BusinessTenant, UserProfile } from '../types';

defineProps<{
  currentTab: string;
  unreadTotal: number;
  openLeadsTotal: number;
  tenant?: BusinessTenant | null;
  currentUser?: UserProfile | null;
}>();

const emit = defineEmits<{
  (e: 'navigate', tab: string): void;
  (e: 'open-settings'): void;
}>();

const menuItems = [
  { id: 'inbox', label: 'Inbox', icon: MessageSquare, badge: 'unread' },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'leads', label: 'Leads & Pipeline', icon: Target, badge: 'leads' },
  { id: 'ai-agent', label: 'AI Sales Agent', icon: Bot },
  { id: 'automations', label: 'Automations', icon: Zap },
  { id: 'campaigns', label: 'Campaigns', icon: Send },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'integrations', label: 'Integrations', icon: Layers },
  { id: 'settings', label: 'Settings', icon: Settings },
];
</script>

<template>
  <aside class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none h-screen" id="sizc-sidebar">
    <!-- Top Branding & Navigation -->
    <div class="flex flex-col h-full overflow-hidden">
      <!-- Logo Header -->
      <div class="p-4 border-b border-slate-100 flex items-center justify-between">
        <SizcLogo size="md" />
        <span class="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
          PRO
        </span>
      </div>

      <!-- Company Profile Widget -->
      <div class="px-4 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
          {{ tenant?.name ? tenant.name.charAt(0).toUpperCase() : 'S' }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-bold text-slate-800 truncate">
            {{ tenant?.name || 'My Business' }}
          </div>
          <div class="text-[10px] text-slate-500 truncate flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{{ tenant?.category || 'Retail' }} • {{ tenant?.country || 'India' }}</span>
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <div class="p-3 space-y-1 overflow-y-auto flex-1">
        <div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Workspace
        </div>

        <button
          v-for="item in menuItems"
          :key="item.id"
          @click="emit('navigate', item.id)"
          class="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all"
          :class="
            currentTab === item.id
              ? 'bg-indigo-50 text-indigo-900 font-bold shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          "
          :id="'nav-tab-' + item.id"
        >
          <div class="flex items-center gap-2.5">
            <component
              :is="item.icon"
              class="w-4 h-4 transition-colors"
              :class="currentTab === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'"
            />
            <span>{{ item.label }}</span>
          </div>

          <!-- Dynamic Badges -->
          <span
            v-if="item.badge === 'unread' && unreadTotal > 0"
            class="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full min-w-5 text-center"
          >
            {{ unreadTotal }}
          </span>
          <span
            v-else-if="item.badge === 'leads' && openLeadsTotal > 0"
            class="px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-700 rounded-full border border-rose-200"
          >
            {{ openLeadsTotal }}
          </span>
        </button>
      </div>

      <!-- Bottom User & Help Section -->
      <div class="p-3 border-t border-slate-100 space-y-2 bg-white shrink-0">
        <div
          @click="emit('navigate', 'settings')"
          class="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 transition-colors border border-transparent hover:border-slate-200"
          id="btn-sidebar-user-profile"
        >
          <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
            {{ currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-xs font-bold text-slate-800 truncate">
              {{ currentUser?.name || 'Business Owner' }}
            </div>
            <div class="text-[10px] text-slate-400 truncate">
              {{ currentUser?.email || 'admin@sizc.com' }}
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-1">
          <span class="flex items-center gap-1">
            <ShieldCheck class="w-3 h-3 text-emerald-500" />
            <span>SIZC v1.0 • Live</span>
          </span>
          <a
            href="#faq"
            @click.prevent="emit('navigate', 'integrations')"
            class="text-indigo-600 hover:underline font-semibold"
          >
            API Docs
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>
