<script setup lang="ts">
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Target,
  FileText,
  Bot,
  Settings,
  ShieldAlert,
  FileCheck2,
  ExternalLink,
  HardDrive,
} from 'lucide-vue-next';

defineProps<{
  currentTab: string;
  unreadTotal: number;
  openLeadsTotal: number;
}>();

const emit = defineEmits<{
  (e: 'navigate', tab: string): void;
}>();

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Live Inbox', icon: MessageSquare, badge: 'unread' },
  { id: 'leads', label: 'Leads Pipeline', icon: Target, badge: 'leads' },
  { id: 'contacts', label: 'Contacts CRM', icon: Users },
  { id: 'templates', label: 'HSM Templates', icon: FileText },
  { id: 'automations', label: 'AI & Automations', icon: Bot },
  { id: 'storage', label: 'Media & Storage', icon: HardDrive },
  { id: 'settings', label: 'Settings & WhatsApp', icon: Settings },
  { id: 'admin', label: 'Admin Health', icon: ShieldAlert },
  { id: 'legal', label: 'Privacy & Legal', icon: FileCheck2 },
];
</script>

<template>
  <aside class="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
    <!-- Navigation Links -->
    <div class="p-3 space-y-1">
      <div class="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Workspace Navigation
      </div>

      <button
        v-for="item in menuItems"
        :key="item.id"
        @click="emit('navigate', item.id)"
        class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all"
        :class="
          currentTab === item.id
            ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        "
      >
        <div class="flex items-center gap-2.5">
          <component
            :is="item.icon"
            class="w-4 h-4 transition-colors"
            :class="currentTab === item.id ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'"
          />
          <span>{{ item.label }}</span>
        </div>

        <!-- Dynamic Badges -->
        <span
          v-if="item.badge === 'unread' && unreadTotal > 0"
          class="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full min-w-5 text-center"
        >
          {{ unreadTotal }}
        </span>
        <span
          v-else-if="item.badge === 'leads' && openLeadsTotal > 0"
          class="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200"
        >
          {{ openLeadsTotal }}
        </span>
      </button>
    </div>

    <!-- Bottom Footer Box -->
    <div class="p-3 border-t border-slate-100 space-y-2">
      <div class="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
        <div class="flex items-center justify-between text-[11px] font-semibold text-slate-800 mb-1">
          <span>Meta WhatsApp WABA</span>
          <span class="text-[9px] font-bold uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">v21.0</span>
        </div>
        <p class="text-[11px] text-slate-500 leading-snug">
          Cloud API Webhook pipeline active & verified.
        </p>
      </div>

      <div class="px-2 pt-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>Fishcatch v1.0.0</span>
        <span>Zero-Fake SaaS</span>
      </div>

      <!-- Public Legal Links -->
      <div class="px-2 pt-2 border-t border-slate-100 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-500">
        <a href="/privacy-policy" @click.prevent="emit('navigate', 'legal')" class="hover:text-emerald-700 hover:underline">Privacy Policy</a>
        <span class="text-slate-300">•</span>
        <a href="/terms" @click.prevent="emit('navigate', 'legal')" class="hover:text-emerald-700 hover:underline">Terms</a>
        <span class="text-slate-300">•</span>
        <a href="/data-deletion" @click.prevent="emit('navigate', 'legal')" class="hover:text-emerald-700 hover:underline">Data Deletion</a>
      </div>
    </div>
  </aside>
</template>
