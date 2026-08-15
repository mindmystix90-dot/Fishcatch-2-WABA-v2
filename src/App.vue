<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type {
  BusinessTenant,
  WhatsAppConnection,
  Conversation,
  Customer,
  Lead,
  MessageTemplate,
  AutomationRule,
  AIConfig,
} from './types';
import { api, setApiBusinessId } from './services/api';
import {
  LayoutDashboard,
  MessageSquare,
  Target,
  Users,
  Bot,
  Settings,
} from 'lucide-vue-next';

// Components
import Header from './components/Header.vue';
import Sidebar from './components/Sidebar.vue';
import DashboardView from './components/DashboardView.vue';
import InboxView from './components/InboxView.vue';
import LeadsView from './components/LeadsView.vue';
import ContactsView from './components/ContactsView.vue';
import TemplatesView from './components/TemplatesView.vue';
import AutomationView from './components/AutomationView.vue';
import StorageView from './components/StorageView.vue';
import SettingsView from './components/SettingsView.vue';
import AdminView from './components/AdminView.vue';
import LegalView from './components/LegalView.vue';

// State
const currentTab = ref('dashboard');
const businesses = ref<BusinessTenant[]>([]);
const activeBusiness = ref<BusinessTenant | null>(null);
const connection = ref<WhatsAppConnection | null>(null);
const conversations = ref<Conversation[]>([]);
const contacts = ref<Customer[]>([]);
const leads = ref<Lead[]>([]);
const templates = ref<MessageTemplate[]>([]);
const automations = ref<AutomationRule[]>([]);
const aiConfig = ref<AIConfig | null>(null);

const selectedConversationId = ref<string | null>(null);
const isLoading = ref(true);

// Modal state
const showCreateWorkspaceModal = ref(false);
const newWorkspaceName = ref('');
const newWorkspaceEmail = ref('');
const isCreatingWorkspace = ref(false);

// Computed counts
const unreadTotal = computed(() => {
  return conversations.value.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
});

const openLeadsTotal = computed(() => {
  return leads.value.filter(l => l.status === 'NEW' || l.status === 'QUALIFIED').length;
});

// Load all workspace data
const loadWorkspaceData = async () => {
  try {
    const [
      bizData,
      connData,
      convs,
      custs,
      lds,
      tpls,
      autos,
      aiCfg,
    ] = await Promise.all([
      api.getBusinesses(),
      api.getWhatsAppConnection(),
      api.getConversations(),
      api.getContacts(),
      api.getLeads(),
      api.getTemplates(),
      api.getAutomations(),
      api.getAIConfig(),
    ]);

    businesses.value = bizData.businesses;
    activeBusiness.value =
      bizData.businesses.find(b => b.id === bizData.activeBusinessId) ||
      bizData.businesses[0] ||
      null;

    connection.value = connData.connection;
    conversations.value = convs;
    contacts.value = custs;
    leads.value = lds;
    templates.value = tpls;
    automations.value = autos;
    aiConfig.value = aiCfg;
  } catch (err: any) {
    console.error('Error loading Fishcatch workspace data:', err);
  } finally {
    isLoading.value = false;
  }
};

// Switch Workspace
const handleSwitchBusiness = async (bizId: string) => {
  try {
    isLoading.value = true;
    const biz = await api.switchBusiness(bizId);
    activeBusiness.value = biz;
    setApiBusinessId(bizId);
    await loadWorkspaceData();
  } catch (err: any) {
    alert(err.message);
  } finally {
    isLoading.value = false;
  }
};

// Create New Workspace
const handleCreateWorkspace = async () => {
  if (!newWorkspaceName.value.trim() || isCreatingWorkspace.value) return;
  isCreatingWorkspace.value = true;
  try {
    const newBiz = await api.createBusiness(
      newWorkspaceName.value.trim(),
      newWorkspaceEmail.value.trim() || 'admin@fishcatch.io'
    );
    showCreateWorkspaceModal.value = false;
    newWorkspaceName.value = '';
    newWorkspaceEmail.value = '';
    await handleSwitchBusiness(newBiz.id);
  } catch (err: any) {
    alert(err.message);
  } finally {
    isCreatingWorkspace.value = false;
  }
};

// Live polling for real-time incoming messages & status every 5 seconds
let pollTimer: any = null;

onMounted(async () => {
  await loadWorkspaceData();
  pollTimer = setInterval(async () => {
    try {
      const [convs, lds, custs] = await Promise.all([
        api.getConversations(),
        api.getLeads(),
        api.getContacts(),
      ]);
      conversations.value = convs;
      leads.value = lds;
      contacts.value = custs;
    } catch (e) {
      // Background poll fail silent
    }
  }, 5000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
});

const handleNavigate = (tab: string) => {
  currentTab.value = tab;
};

const handleSelectConversation = (id: string | null) => {
  selectedConversationId.value = id;
  currentTab.value = 'inbox';
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
    <!-- Header Component -->
    <Header
      :businesses="businesses"
      :active-business="activeBusiness"
      :connection="connection"
      :current-tab="currentTab"
      @switch-business="handleSwitchBusiness"
      @open-create-business-modal="showCreateWorkspaceModal = true"
      @navigate="handleNavigate"
    />

    <!-- Main Workspace Area -->
    <div class="flex-1 flex overflow-hidden pb-14 md:pb-0">
      <!-- Sidebar Component (Desktop) -->
      <Sidebar
        class="hidden md:flex"
        :current-tab="currentTab"
        :unread-total="unreadTotal"
        :open-leads-total="openLeadsTotal"
        @navigate="handleNavigate"
      />

      <!-- Content Views -->
      <main class="flex-1 overflow-y-auto bg-slate-50/70">
        <!-- Dashboard -->
        <DashboardView
          v-if="currentTab === 'dashboard'"
          :active-business="activeBusiness"
          :connection="connection"
          :conversations="conversations"
          :contacts="contacts"
          :leads="leads"
          :ai-config="aiConfig"
          @navigate="handleNavigate"
          @select-conversation="handleSelectConversation"
        />

        <!-- Live Inbox -->
        <InboxView
          v-else-if="currentTab === 'inbox'"
          :conversations="conversations"
          :contacts="contacts"
          :leads="leads"
          :templates="templates"
          :connection="connection"
          :selected-conversation-id="selectedConversationId"
          @select-conversation="handleSelectConversation"
          @refresh="loadWorkspaceData"
        />

        <!-- Leads Pipeline -->
        <LeadsView
          v-else-if="currentTab === 'leads'"
          :leads="leads"
          @refresh="loadWorkspaceData"
          @open-chat="handleNavigate('inbox')"
        />

        <!-- Contacts CRM -->
        <ContactsView
          v-else-if="currentTab === 'contacts'"
          :contacts="contacts"
          @refresh="loadWorkspaceData"
        />

        <!-- HSM Templates -->
        <TemplatesView
          v-else-if="currentTab === 'templates'"
          :templates="templates"
          :connection="connection"
          @refresh="loadWorkspaceData"
        />

        <!-- AI & Automations -->
        <AutomationView
          v-else-if="currentTab === 'automations'"
          :automations="automations"
          :ai-config="aiConfig"
          @refresh="loadWorkspaceData"
        />

        <!-- Media & Cloud Storage -->
        <StorageView
          v-else-if="currentTab === 'storage'"
          @refresh="loadWorkspaceData"
        />

        <!-- Settings & WhatsApp -->
        <SettingsView
          v-else-if="currentTab === 'settings'"
          :connection="connection"
          :active-business="activeBusiness"
          @refresh="loadWorkspaceData"
        />

        <!-- Admin System Health -->
        <AdminView
          v-else-if="currentTab === 'admin'"
        />

        <!-- Legal & Policies -->
        <LegalView
          v-else-if="currentTab === 'legal'"
        />
      </main>
    </div>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around h-14 px-1 shadow-lg">
      <button
        @click="handleNavigate('dashboard')"
        class="flex flex-col items-center justify-center flex-1 py-1 transition-colors"
        :class="currentTab === 'dashboard' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <LayoutDashboard class="w-4 h-4 mb-0.5" />
        <span class="text-[10px]">Dashboard</span>
      </button>

      <button
        @click="handleNavigate('inbox')"
        class="flex flex-col items-center justify-center flex-1 py-1 transition-colors relative"
        :class="currentTab === 'inbox' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <MessageSquare class="w-4 h-4 mb-0.5" />
        <span class="text-[10px]">Inbox</span>
        <span
          v-if="unreadTotal > 0"
          class="absolute top-1 right-3 px-1 py-0.2 text-[8px] font-bold bg-emerald-600 text-white rounded-full min-w-3.5 text-center"
        >
          {{ unreadTotal }}
        </span>
      </button>

      <button
        @click="handleNavigate('leads')"
        class="flex flex-col items-center justify-center flex-1 py-1 transition-colors relative"
        :class="currentTab === 'leads' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <Target class="w-4 h-4 mb-0.5" />
        <span class="text-[10px]">Leads</span>
        <span
          v-if="openLeadsTotal > 0"
          class="absolute top-1 right-3 px-1 py-0.2 text-[8px] font-bold bg-slate-200 text-slate-800 rounded-full min-w-3.5 text-center"
        >
          {{ openLeadsTotal }}
        </span>
      </button>

      <button
        @click="handleNavigate('contacts')"
        class="flex flex-col items-center justify-center flex-1 py-1 transition-colors"
        :class="currentTab === 'contacts' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <Users class="w-4 h-4 mb-0.5" />
        <span class="text-[10px]">Contacts</span>
      </button>

      <button
        @click="handleNavigate('automations')"
        class="flex flex-col items-center justify-center flex-1 py-1 transition-colors"
        :class="currentTab === 'automations' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <Bot class="w-4 h-4 mb-0.5" />
        <span class="text-[10px]">AI Agent</span>
      </button>

      <button
        @click="handleNavigate('settings')"
        class="flex flex-col items-center justify-center flex-1 py-1 transition-colors"
        :class="currentTab === 'settings' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'"
      >
        <Settings class="w-4 h-4 mb-0.5" />
        <span class="text-[10px]">Settings</span>
      </button>
    </nav>

    <!-- Create Workspace Modal -->
    <div
      v-if="showCreateWorkspaceModal"
      class="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100"
    >
      <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-900">Create New Business Workspace</h3>
          <button @click="showCreateWorkspaceModal = false" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Workspace / Business Name *</label>
            <input
              v-model="newWorkspaceName"
              type="text"
              placeholder="e.g. Apex Health Clinic"
              class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Admin Email (Optional)</label>
            <input
              v-model="newWorkspaceEmail"
              type="email"
              placeholder="admin@example.com"
              class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showCreateWorkspaceModal = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="handleCreateWorkspace"
            :disabled="!newWorkspaceName.trim() || isCreatingWorkspace"
            class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
