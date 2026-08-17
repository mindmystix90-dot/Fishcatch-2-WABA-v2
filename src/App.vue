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
  UserProfile,
  BusinessCategory,
} from './types';
import { api, setApiBusinessId } from './services/api';

// Components
import Header from './components/Header.vue';
import Sidebar from './components/Sidebar.vue';
import LandingPageView from './components/LandingPageView.vue';
import AuthModal from './components/AuthModal.vue';
import OnboardingModal from './components/OnboardingModal.vue';
import DashboardView from './components/DashboardView.vue';
import InboxView from './components/InboxView.vue';
import LeadsView from './components/LeadsView.vue';
import ContactsView from './components/ContactsView.vue';
import AIAgentView from './components/AIAgentView.vue';
import AutomationView from './components/AutomationView.vue';
import CampaignsView from './components/CampaignsView.vue';
import TemplatesView from './components/TemplatesView.vue';
import AnalyticsView from './components/AnalyticsView.vue';
import IntegrationsView from './components/IntegrationsView.vue';
import StorageView from './components/StorageView.vue';
import SettingsView from './components/SettingsView.vue';
import AdminView from './components/AdminView.vue';
import LegalView from './components/LegalView.vue';

// Navigation & View State
const viewMode = ref<'landing' | 'app'>('app'); // App workspace default
const currentTab = ref('inbox');
const currentUser = ref<UserProfile | null>({
  id: 'usr_owner_01',
  email: 'admin@sizc.com',
  name: 'Dev Admin',
  role: 'OWNER',
  businessId: 'biz_sizc_default',
  createdAt: new Date().toISOString(),
});

// Modals
const showAuthModal = ref(false);
const authInitialMode = ref<'signin' | 'signup'>('signup');
const showOnboardingModal = ref(false);
const showCreateWorkspaceModal = ref(false);

// App State
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

// Workspace Modal form
const newWorkspaceName = ref('');
const newWorkspaceCategory = ref<BusinessCategory>('Retail');
const newWorkspaceCountry = ref('India');
const isCreatingWorkspace = ref(false);

// Computed counts
const unreadTotal = computed(() => {
  return conversations.value.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
});

const openLeadsTotal = computed(() => {
  return leads.value.filter(l => l.status === 'New' || l.status === 'Contacted' || l.status === 'Qualified').length;
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
    console.error('Error loading SIZC workspace data:', err);
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
    console.error(err);
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
      currentUser.value?.email || 'admin@sizc.com',
      newWorkspaceCategory.value,
      newWorkspaceCountry.value
    );
    showCreateWorkspaceModal.value = false;
    newWorkspaceName.value = '';
    await handleSwitchBusiness(newBiz.id);
  } catch (err: any) {
    alert(err.message);
  } finally {
    isCreatingWorkspace.value = false;
  }
};

// Auth Handlers
const handleAuthSuccess = (user: UserProfile, isNewUser: boolean) => {
  currentUser.value = user;
  showAuthModal.value = false;
  if (isNewUser) {
    showOnboardingModal.value = true;
  } else {
    viewMode.value = 'app';
  }
};

// Onboarding completion
const handleOnboardingComplete = async (data: {
  businessName: string;
  category: BusinessCategory;
  country: string;
  ycloudApiKey?: string;
  wabaPhoneNumber?: string;
  skipWhatsApp: boolean;
}) => {
  try {
    const newBiz = await api.createBusiness(
      data.businessName,
      currentUser.value?.email || 'admin@sizc.com',
      data.category,
      data.country
    );
    if (!data.skipWhatsApp && data.ycloudApiKey) {
      await api.verifyCredentials({
        phoneNumberId: data.wabaPhoneNumber || 'ycloud_waba_01',
        accessToken: data.ycloudApiKey,
      });
    }
    showOnboardingModal.value = false;
    viewMode.value = 'app';
    await handleSwitchBusiness(newBiz.id);
  } catch (err: any) {
    console.error('Onboarding failed:', err);
    showOnboardingModal.value = false;
    viewMode.value = 'app';
  }
};

// Live polling for real-time incoming messages & status every 4 seconds
let pollTimer: any = null;

const legalInitialTab = ref<'privacy' | 'terms' | 'deletion'>('privacy');

const checkRoute = () => {
  const path = window.location.pathname;
  if (path.includes('/privacy-policy') || path.includes('/privacy')) {
    viewMode.value = 'app';
    currentTab.value = 'legal';
    legalInitialTab.value = 'privacy';
  } else if (path.includes('/terms')) {
    viewMode.value = 'app';
    currentTab.value = 'legal';
    legalInitialTab.value = 'terms';
  } else if (path.includes('/data-deletion')) {
    viewMode.value = 'app';
    currentTab.value = 'legal';
    legalInitialTab.value = 'deletion';
  }
};

onMounted(async () => {
  checkRoute();
  window.addEventListener('popstate', checkRoute);
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
  }, 4000);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  window.removeEventListener('popstate', checkRoute);
});

const handleNavigate = (tab: string) => {
  currentTab.value = tab;
  viewMode.value = 'app';
  if (tab === 'legal') window.history.pushState({}, '', '/privacy-policy');
  else window.history.pushState({}, '', '/');
};

const handleSelectConversation = (id: string | null) => {
  selectedConversationId.value = id;
  currentTab.value = 'inbox';
  viewMode.value = 'app';
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white" id="sizc-app-root">
    <!-- LANDING PAGE VIEW -->
    <LandingPageView
      v-if="viewMode === 'landing'"
      @start-free="() => { authInitialMode = 'signup'; showAuthModal = true; }"
      @sign-in="() => { authInitialMode = 'signin'; showAuthModal = true; }"
      @explore-demo="() => { viewMode = 'app'; currentTab = 'inbox'; }"
    />

    <!-- APP DASHBOARD VIEW -->
    <div v-else class="min-h-screen flex flex-col">
      <!-- Header -->
      <Header
        :businesses="businesses"
        :active-business="activeBusiness"
        :connection="connection"
        :current-tab="currentTab"
        :current-user="currentUser"
        @switch-business="handleSwitchBusiness"
        @open-create-business-modal="showCreateWorkspaceModal = true"
        @navigate="handleNavigate"
        @logout="viewMode = 'landing'"
      />

      <!-- Workspace Area -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Sidebar -->
        <Sidebar
          class="hidden md:flex"
          :current-tab="currentTab"
          :unread-total="unreadTotal"
          :open-leads-total="openLeadsTotal"
          :tenant="activeBusiness"
          :current-user="currentUser"
          @navigate="handleNavigate"
        />

        <!-- Main Content Views -->
        <main class="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 lg:p-8">
          <!-- 1. Live Inbox -->
          <InboxView
            v-if="currentTab === 'inbox'"
            :conversations="conversations"
            :contacts="contacts"
            :leads="leads"
            :templates="templates"
            :connection="connection"
            :selected-conversation-id="selectedConversationId"
            @select-conversation="handleSelectConversation"
            @refresh="loadWorkspaceData"
          />

          <!-- 2. Contacts CRM -->
          <ContactsView
            v-else-if="currentTab === 'contacts'"
            :contacts="contacts"
            @refresh="loadWorkspaceData"
          />

          <!-- 3. Leads & Pipeline -->
          <LeadsView
            v-else-if="currentTab === 'leads'"
            :leads="leads"
            @refresh="loadWorkspaceData"
            @open-chat="handleNavigate('inbox')"
          />

          <!-- 4. Gemini AI Sales Agent -->
          <AIAgentView
            v-else-if="currentTab === 'ai-agent'"
            :business-id="activeBusiness?.id || 'default'"
          />

          <!-- 5. Automations -->
          <AutomationView
            v-else-if="currentTab === 'automations'"
            :automations="automations"
            :ai-config="aiConfig"
            @refresh="loadWorkspaceData"
          />

          <!-- 6. WhatsApp Campaigns -->
          <CampaignsView
            v-else-if="currentTab === 'campaigns'"
            :business-id="activeBusiness?.id || 'default'"
          />

          <!-- 7. HSM Templates -->
          <TemplatesView
            v-else-if="currentTab === 'templates'"
            :templates="templates"
            :connection="connection"
            @refresh="loadWorkspaceData"
          />

          <!-- 8. Analytics & Sales Funnel -->
          <AnalyticsView
            v-else-if="currentTab === 'analytics'"
            :conversations="conversations"
            :leads="leads"
            :contacts="contacts"
          />

          <!-- 9. Integrations & API Architecture -->
          <IntegrationsView
            v-else-if="currentTab === 'integrations'"
            :business-id="activeBusiness?.id || 'default'"
          />

          <!-- 10. Settings & WhatsApp -->
          <SettingsView
            v-else-if="currentTab === 'settings'"
            :connection="connection"
            :active-business="activeBusiness"
            @refresh="loadWorkspaceData"
            @navigate="handleNavigate"
          />

          <!-- 11. Media & Storage -->
          <StorageView
            v-else-if="currentTab === 'storage'"
            @refresh="loadWorkspaceData"
          />

          <!-- 12. Admin System Health -->
          <AdminView
            v-else-if="currentTab === 'admin'"
          />

          <!-- 13. Legal & Policies -->
          <LegalView
            v-else-if="currentTab === 'legal'"
            :initial-tab="legalInitialTab"
            @navigate="handleNavigate"
          />
        </main>
      </div>
    </div>

    <!-- Auth Modal -->
    <AuthModal
      :is-open="showAuthModal"
      :initial-mode="authInitialMode"
      @close="showAuthModal = false"
      @auth-success="handleAuthSuccess"
    />

    <!-- Onboarding Modal -->
    <OnboardingModal
      :is-open="showOnboardingModal"
      :user-name="currentUser?.name"
      @complete="handleOnboardingComplete"
    />

    <!-- Create Workspace Modal -->
    <div
      v-if="showCreateWorkspaceModal"
      class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
    >
      <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-900">Create Business Workspace</h3>
          <button @click="showCreateWorkspaceModal = false" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Company / Brand Name *</label>
            <input
              v-model="newWorkspaceName"
              type="text"
              placeholder="e.g. Royal Silks, Surat"
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Business Category</label>
            <select
              v-model="newWorkspaceCategory"
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="Retail">Retail & Stores</option>
              <option value="Education">Education & Coaching</option>
              <option value="Real Estate">Real Estate & Builders</option>
              <option value="Healthcare">Healthcare & Clinics</option>
              <option value="Agency">Digital Agency</option>
              <option value="E-commerce">E-commerce & D2C</option>
              <option value="Services">Professional Services</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Country</label>
            <select
              v-model="newWorkspaceCountry"
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="India">India (₹ INR)</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="International">International</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            @click="showCreateWorkspaceModal = false"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl"
          >
            Cancel
          </button>
          <button
            @click="handleCreateWorkspace"
            :disabled="!newWorkspaceName.trim() || isCreatingWorkspace"
            class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {{ isCreatingWorkspace ? 'Creating...' : 'Create Workspace' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
