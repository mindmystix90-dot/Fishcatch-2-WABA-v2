<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { AutomationRule, AIConfig, LeadStatus, StoredFileMetadata } from '../types';
import { api } from '../services/api';
import {
  Bot,
  Zap,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  FileText,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Play,
  Send,
  RefreshCw,
  Clock,
  DollarSign,
  Shield,
  Layers,
  ChevronRight,
  HardDrive,
  UploadCloud,
  Eye,
} from 'lucide-vue-next';

const props = defineProps<{
  automations: AutomationRule[];
  aiConfig: AIConfig | null;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const activeSubTab = ref<'agent' | 'knowledge' | 'qualification' | 'handoff' | 'test' | 'keywords'>('agent');

// Knowledge files from Cloud Storage
const knowledgeFiles = ref<StoredFileMetadata[]>([]);
const isLoadingKnowledgeFiles = ref(false);

const loadKnowledgeFiles = async () => {
  try {
    isLoadingKnowledgeFiles.value = true;
    knowledgeFiles.value = await api.getStorageFiles({ category: 'knowledge' });
  } catch (e) {
    // Silent
  } finally {
    isLoadingKnowledgeFiles.value = false;
  }
};

onMounted(() => {
  loadKnowledgeFiles();
});

// AI Config Form State
const aiEnabled = ref(true);
const aiAutoReply = ref(true);
const agentName = ref('Fishcatch AI Assistant');
const modelName = ref('gemini-3.7-flash');
const aiSystemPrompt = ref('');
const businessDescription = ref('');
const productsServices = ref('');
const pricingInfo = ref('');
const businessHours = ref('');
const faqs = ref('');
const rules = ref('');
const aiTone = ref('Professional & Helpful');
const aiLanguage = ref('auto');
const leadQualificationCriteria = ref('');
const qualificationQuestions = ref<string[]>([]);
const newQuestionText = ref('');
const humanHandoff = ref(true);
const humanHandoffKeywords = ref<string[]>([]);
const newKeywordTag = ref('');

const isSavingAI = ref(false);
const saveSuccess = ref(false);

// Live Tester State
const testInput = ref('');
const isTesting = ref(false);
const testResult = ref<{
  response?: string;
  intent?: string;
  leadScore?: number;
  handoff?: boolean;
  notice?: string;
} | null>(null);

// Keyword Rules State
const showAddRuleModal = ref(false);
const newKeyword = ref('');
const newMatchType = ref<'exact' | 'contains' | 'starts_with'>('contains');
const newResponse = ref('');
const newLeadTarget = ref<LeadStatus>('QUALIFIED');
const isSubmittingRule = ref(false);

watch(
  () => props.aiConfig,
  (cfg) => {
    if (cfg) {
      aiEnabled.value = cfg.enabled ?? true;
      aiAutoReply.value = cfg.autoReply ?? true;
      agentName.value = cfg.agentName || 'Fishcatch AI Assistant';
      modelName.value = cfg.modelName || 'gemini-3.7-flash';
      aiSystemPrompt.value = cfg.systemPrompt || '';
      businessDescription.value = cfg.businessDescription || '';
      productsServices.value = cfg.productsServices || '';
      pricingInfo.value = cfg.pricingInfo || '';
      businessHours.value = cfg.businessHours || 'Mon - Fri: 9:00 AM - 6:00 PM';
      faqs.value = cfg.faqs || '';
      rules.value = cfg.rules || '';
      aiTone.value = cfg.tone || 'Professional & Helpful';
      aiLanguage.value = cfg.language || 'auto';
      leadQualificationCriteria.value = cfg.leadQualificationCriteria || '';
      qualificationQuestions.value = Array.isArray(cfg.qualificationQuestions) ? [...cfg.qualificationQuestions] : [];
      humanHandoff.value = cfg.humanHandoff ?? true;
      humanHandoffKeywords.value = Array.isArray(cfg.humanHandoffKeywords)
        ? [...cfg.humanHandoffKeywords]
        : ['human', 'agent', 'representative', 'support'];
    }
  },
  { immediate: true }
);

const handleSaveAI = async () => {
  isSavingAI.value = true;
  saveSuccess.value = false;
  try {
    await api.saveAIConfig({
      enabled: aiEnabled.value,
      autoReply: aiAutoReply.value,
      agentName: agentName.value.trim(),
      modelName: modelName.value,
      systemPrompt: aiSystemPrompt.value.trim(),
      businessDescription: businessDescription.value.trim(),
      productsServices: productsServices.value.trim(),
      pricingInfo: pricingInfo.value.trim(),
      businessHours: businessHours.value.trim(),
      faqs: faqs.value.trim(),
      rules: rules.value.trim(),
      tone: aiTone.value,
      language: aiLanguage.value,
      leadQualificationCriteria: leadQualificationCriteria.value.trim(),
      qualificationQuestions: qualificationQuestions.value,
      humanHandoff: humanHandoff.value,
      humanHandoffKeywords: humanHandoffKeywords.value,
    });
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
    emit('refresh');
  } catch (err: any) {
    alert(err.message);
  } finally {
    isSavingAI.value = false;
  }
};

const addQuestion = () => {
  if (!newQuestionText.value.trim()) return;
  qualificationQuestions.value.push(newQuestionText.value.trim());
  newQuestionText.value = '';
};

const removeQuestion = (idx: number) => {
  qualificationQuestions.value.splice(idx, 1);
};

const addHandoffKeyword = () => {
  if (!newKeywordTag.value.trim()) return;
  const kw = newKeywordTag.value.trim().toLowerCase();
  if (!humanHandoffKeywords.value.includes(kw)) {
    humanHandoffKeywords.value.push(kw);
  }
  newKeywordTag.value = '';
};

const removeHandoffKeyword = (idx: number) => {
  humanHandoffKeywords.value.splice(idx, 1);
};

const runLiveTest = async () => {
  if (!testInput.value.trim() || isTesting.value) return;
  isTesting.value = true;
  testResult.value = null;
  try {
    const res = await api.testAIPrompt(testInput.value.trim());
    testResult.value = res;
  } catch (err: any) {
    testResult.value = {
      response: 'Error testing AI prompt: ' + err.message,
    };
  } finally {
    isTesting.value = false;
  }
};

const handleCreateRule = async () => {
  if (!newKeyword.value.trim() || isSubmittingRule.value) return;
  isSubmittingRule.value = true;
  try {
    await api.createAutomation({
      keyword: newKeyword.value.trim(),
      matchType: newMatchType.value,
      responseText: newResponse.value.trim(),
      leadStatusTarget: newLeadTarget.value,
      action: 'reply_text',
      active: true,
    });
    showAddRuleModal.value = false;
    newKeyword.value = '';
    newResponse.value = '';
    emit('refresh');
  } catch (err: any) {
    alert(err.response?.data?.error?.message || err.message);
  } finally {
    isSubmittingRule.value = false;
  }
};

const handleToggleRule = async (rule: AutomationRule) => {
  try {
    await api.updateAutomation(rule.id, { active: !rule.active });
    emit('refresh');
  } catch (err: any) {
    alert(err.message);
  }
};

const handleDeleteRule = async (ruleId: string) => {
  if (!confirm('Are you sure you want to delete this keyword rule?')) return;
  try {
    await api.deleteAutomation(ruleId);
    emit('refresh');
  } catch (err: any) {
    alert(err.message);
  }
};
</script>

<template>
  <div class="p-4 sm:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
    <!-- Header -->
    <div class="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">AI Agent &amp; Automations</h1>
          <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
            Powered by Google Gemini
          </span>
        </div>
        <p class="text-xs text-slate-500 mt-0.5">
          Configure business intelligence, automated lead qualification, tone, guardrails, and keyword triggers.
        </p>
      </div>

      <!-- Quick Save Button -->
      <div class="flex items-center gap-2">
        <button
          @click="handleSaveAI"
          :disabled="isSavingAI"
          class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw v-if="isSavingAI" class="w-3.5 h-3.5 animate-spin" />
          <CheckCircle2 v-else-if="saveSuccess" class="w-3.5 h-3.5 text-white" />
          <span>{{ isSavingAI ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save AI Configuration' }}</span>
        </button>
      </div>
    </div>

    <!-- Sub Navigation Tabs -->
    <div class="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-semibold text-slate-600">
      <button
        @click="activeSubTab = 'agent'"
        class="px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5"
        :class="activeSubTab === 'agent' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'"
      >
        <Bot class="w-3.5 h-3.5" />
        <span>Agent Identity</span>
      </button>

      <button
        @click="activeSubTab = 'knowledge'"
        class="px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5"
        :class="activeSubTab === 'knowledge' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'"
      >
        <FileText class="w-3.5 h-3.5" />
        <span>Business Knowledge</span>
      </button>

      <button
        @click="activeSubTab = 'qualification'"
        class="px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5"
        :class="activeSubTab === 'qualification' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'"
      >
        <Sparkles class="w-3.5 h-3.5" />
        <span>Lead Qualification</span>
      </button>

      <button
        @click="activeSubTab = 'handoff'"
        class="px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5"
        :class="activeSubTab === 'handoff' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'"
      >
        <Shield class="w-3.5 h-3.5" />
        <span>Handoff &amp; Guardrails</span>
      </button>

      <button
        @click="activeSubTab = 'test'"
        class="px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5"
        :class="activeSubTab === 'test' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'"
      >
        <Play class="w-3.5 h-3.5" />
        <span>Live Playground</span>
      </button>

      <button
        @click="activeSubTab = 'keywords'"
        class="px-3.5 py-2 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5"
        :class="activeSubTab === 'keywords' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'hover:text-slate-900'"
      >
        <Zap class="w-3.5 h-3.5" />
        <span>Keyword Rules ({{ automations.length }})</span>
      </button>
    </div>

    <!-- 1. TAB: AGENT IDENTITY & SETTINGS -->
    <div v-if="activeSubTab === 'agent'" class="space-y-5">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <!-- Master Switches -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-5">
          <div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div class="text-xs font-bold text-slate-900">AI Agent Engine</div>
              <div class="text-[11px] text-slate-500">Enable Google Gemini AI for this workspace</div>
            </div>
            <input
              type="checkbox"
              v-model="aiEnabled"
              class="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
          </div>

          <div class="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <div class="text-xs font-bold text-slate-900">Autonomous WhatsApp Auto-Reply</div>
              <div class="text-[11px] text-slate-500">Respond automatically when chat mode is "AI"</div>
            </div>
            <input
              type="checkbox"
              v-model="aiAutoReply"
              class="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Agent Name -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1">Agent Name</label>
            <input
              v-model="agentName"
              type="text"
              placeholder="e.g. Fishcatch AI Assistant"
              class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <!-- Model Version -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1">Gemini AI Model</label>
            <select
              v-model="modelName"
              class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:ring-1 focus:ring-emerald-500"
            >
              <option value="gemini-3.7-flash">gemini-3.7-flash (Fast, Low Latency, Production Default)</option>
            </select>
          </div>

          <!-- Tone -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1">Communication Tone</label>
            <select
              v-model="aiTone"
              class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Professional & Helpful">Professional &amp; Helpful</option>
              <option value="Warm & Friendly">Warm &amp; Friendly</option>
              <option value="Consultative & Expert">Consultative &amp; Expert</option>
              <option value="Direct & Concise">Direct &amp; Concise</option>
              <option value="High-End & Luxury">High-End &amp; Luxury</option>
            </select>
          </div>

          <!-- Language Preference -->
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1">Language Response Mode</label>
            <select
              v-model="aiLanguage"
              class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="auto">Auto-detect (Matches customer language)</option>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="Portuguese">Portuguese</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Arabic">Arabic</option>
            </select>
          </div>
        </div>

        <!-- System Prompt / Persona Instructions -->
        <div>
          <label class="block text-xs font-bold text-slate-800 mb-1">System Instructions &amp; Persona</label>
          <textarea
            v-model="aiSystemPrompt"
            rows="4"
            placeholder="Describe how the AI should introduce itself, answer customer inquiries, qualify leads, and represent your brand..."
            class="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed focus:ring-1 focus:ring-emerald-500"
          ></textarea>
          <p class="text-[10px] text-slate-400 mt-1">
            Defines the core personality and conversation boundaries for WhatsApp messaging.
          </p>
        </div>
      </div>
    </div>

    <!-- 2. TAB: BUSINESS KNOWLEDGE -->
    <div v-if="activeSubTab === 'knowledge'" class="space-y-5">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Custom Business Knowledge Repository</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            The Gemini AI Agent accesses these sections to answer inquiries accurately without inventing information.
          </p>
        </div>

        <!-- Business Description -->
        <div>
          <label class="block text-xs font-bold text-slate-800 mb-1">About the Business</label>
          <textarea
            v-model="businessDescription"
            rows="3"
            placeholder="e.g. Fishcatch is a premier B2B SaaS platform that automates WhatsApp lead qualification, sales routing, and customer communication..."
            class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
          ></textarea>
        </div>

        <!-- Products and Services -->
        <div>
          <label class="block text-xs font-bold text-slate-800 mb-1">Products, Services &amp; Solutions</label>
          <textarea
            v-model="productsServices"
            rows="4"
            placeholder="List your core offerings, features, deliverables, or service packages..."
            class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
          ></textarea>
        </div>

        <!-- Pricing Info -->
        <div>
          <label class="block text-xs font-bold text-slate-800 mb-1">Pricing &amp; Rates (Optional)</label>
          <textarea
            v-model="pricingInfo"
            rows="3"
            placeholder="e.g. Starter: $49/mo, Growth: $149/mo, Custom Enterprise. (Leave blank or specify 'Custom quotation based on requirements')."
            class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
          ></textarea>
        </div>

        <!-- Business Hours -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1">Business Hours &amp; Availability</label>
            <input
              v-model="businessHours"
              type="text"
              placeholder="e.g. Mon - Fri: 9:00 AM - 6:00 PM EST"
              class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-800 mb-1">Frequently Asked Questions (FAQs)</label>
            <textarea
              v-model="faqs"
              rows="3"
              placeholder="Q: How do we get started? A: Sign up online and our onboarding team will guide you..."
              class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            ></textarea>
          </div>
        </div>

        <!-- Grounded Storage Knowledge Documents -->
        <div class="border-t border-slate-100 pt-5 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <HardDrive class="w-4 h-4 text-emerald-600" />
                <span>Uploaded Knowledge Documents &amp; Manuals</span>
              </h3>
              <p class="text-[11px] text-slate-500">
                PDFs and manuals uploaded to Cloud Storage with text extracted for Gemini AI grounding.
              </p>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full">
              {{ knowledgeFiles.length }} Active Documents
            </span>
          </div>

          <div v-if="knowledgeFiles.length === 0" class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center justify-between">
            <span>No knowledge documents uploaded yet.</span>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="kf in knowledgeFiles"
              :key="kf.id"
              class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 truncate">
                  <FileText class="w-4 h-4 text-emerald-700 shrink-0" />
                  <span class="text-xs font-bold text-slate-900 truncate">{{ kf.originalFilename }}</span>
                </div>
                <span class="text-[10px] text-slate-400 font-mono">
                  {{ Math.round((kf.fileSize || 0) / 1024) }} KB
                </span>
              </div>
              <p v-if="kf.extractedText" class="text-[10px] text-emerald-950 bg-emerald-50/80 p-1.5 rounded border border-emerald-100 line-clamp-2">
                {{ kf.extractedText }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. TAB: LEAD QUALIFICATION -->
    <div v-if="activeSubTab === 'qualification'" class="space-y-5">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Autonomous Lead Qualification</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Configure how the AI agent qualifies incoming WhatsApp prospects into CRM Leads (Intent, Budget, Timeline, Requirement).
          </p>
        </div>

        <!-- Lead Qualification Criteria -->
        <div>
          <label class="block text-xs font-bold text-slate-800 mb-1">Qualification Criteria &amp; Scoring Target</label>
          <textarea
            v-model="leadQualificationCriteria"
            rows="2"
            placeholder="e.g. Prospect has a verified business phone, expresses interest in core services, has budget > $500, and is ready within 30 days."
            class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
          ></textarea>
        </div>

        <!-- Qualification Questions List -->
        <div class="space-y-3">
          <label class="block text-xs font-bold text-slate-800">
            Qualification Questions to Inquire
          </label>
          <div v-if="qualificationQuestions.length === 0" class="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
            No custom qualification questions configured yet.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="(q, idx) in qualificationQuestions"
              :key="idx"
              class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <div class="flex items-center gap-2 text-slate-800 font-medium">
                <span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                  {{ idx + 1 }}
                </span>
                <span>{{ q }}</span>
              </div>
              <button
                @click="removeQuestion(idx)"
                class="text-slate-400 hover:text-rose-600 p-1 transition-colors"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Add question row -->
          <div class="flex items-center gap-2 pt-2">
            <input
              v-model="newQuestionText"
              @keydown.enter.prevent="addQuestion"
              type="text"
              placeholder="e.g. What is your expected project timeline?"
              class="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              @click="addQuestion"
              class="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. TAB: HANDOFF & GUARDRAILS -->
    <div v-if="activeSubTab === 'handoff'" class="space-y-5">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Safety Guardrails &amp; Human Escalation</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Maintain strict brand compliance and provide seamless handoffs to human operators.
          </p>
        </div>

        <!-- Strict Operational Rules -->
        <div>
          <label class="block text-xs font-bold text-slate-800 mb-1">Operational Guardrails &amp; Constraints</label>
          <textarea
            v-model="rules"
            rows="3"
            placeholder="e.g. Never invent or promise prices not explicitly listed in knowledge. If a customer is frustrated, politely offer to connect them with a human specialist."
            class="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
          ></textarea>
        </div>

        <!-- Human Handoff Keywords -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs font-bold text-slate-800">Human Handoff Trigger Keywords</div>
              <div class="text-[11px] text-slate-500">When customer messages contain any of these phrases, conversation switches mode to "HUMAN".</div>
            </div>
            <input
              type="checkbox"
              v-model="humanHandoff"
              class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <!-- Tags list -->
          <div class="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span
              v-for="(kw, idx) in humanHandoffKeywords"
              :key="idx"
              class="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <span>{{ kw }}</span>
              <button @click="removeHandoffKeyword(idx)" class="text-slate-400 hover:text-rose-600">×</button>
            </span>
          </div>

          <!-- Add keyword tag -->
          <div class="flex items-center gap-2 pt-1">
            <input
              v-model="newKeywordTag"
              @keydown.enter.prevent="addHandoffKeyword"
              type="text"
              placeholder="e.g. speak with agent"
              class="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              @click="addHandoffKeyword"
              class="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Add Keyword
            </button>
          </div>
        </div>

        <!-- Legal Opt-Out Notice -->
        <div class="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1 text-xs text-emerald-900">
          <div class="font-bold flex items-center gap-1.5">
            <Shield class="w-3.5 h-3.5 text-emerald-700" />
            <span>Automatic WhatsApp Opt-Out Compliance</span>
          </div>
          <p class="text-[11px] text-emerald-800 leading-relaxed">
            Fishcatch automatically respects Meta WhatsApp compliance: when a customer sends "STOP", "UNSUBSCRIBE", "CANCEL", or "QUIT", opt-in status is revoked immediately and automated AI replies are halted.
          </p>
        </div>
      </div>
    </div>

    <!-- 5. TAB: LIVE PLAYGROUND -->
    <div v-if="activeSubTab === 'test'" class="space-y-5">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div>
          <h2 class="text-sm font-bold text-slate-900">Interactive AI Agent Live Playground</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            Test how the Gemini AI Agent responds to prospective WhatsApp messages using the current workspace knowledge.
          </p>
        </div>

        <!-- Input & Test Button -->
        <div class="space-y-3">
          <label class="block text-xs font-bold text-slate-800">Simulate WhatsApp Customer Inquiry</label>
          <div class="flex items-center gap-2">
            <input
              v-model="testInput"
              @keydown.enter.prevent="runLiveTest"
              type="text"
              placeholder="e.g. Hi! Can you tell me what your pricing is and how fast we can get set up?"
              class="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              @click="runLiveTest"
              :disabled="isTesting || !testInput.trim()"
              class="px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw v-if="isTesting" class="w-3.5 h-3.5 animate-spin" />
              <Play v-else class="w-3.5 h-3.5" />
              <span>{{ isTesting ? 'Generating...' : 'Test Inquiry' }}</span>
            </button>
          </div>
        </div>

        <!-- Playground Output Result Card -->
        <div v-if="testResult" class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
          <div class="flex items-center justify-between text-xs border-b border-slate-200/80 pb-2">
            <span class="font-bold text-slate-900 flex items-center gap-1.5">
              <Bot class="w-3.5 h-3.5 text-emerald-600" />
              <span>AI Agent Output Response</span>
            </span>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                Intent: {{ testResult.intent || 'Inquiry' }}
              </span>
              <span class="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-800 rounded">
                Lead Score: {{ testResult.leadScore || 70 }}/100
              </span>
              <span
                v-if="testResult.handoff"
                class="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded"
              >
                Handoff Triggered
              </span>
            </div>
          </div>

          <div class="p-3.5 bg-emerald-600 text-white rounded-xl text-xs leading-relaxed max-w-lg shadow-xs">
            {{ testResult.response }}
          </div>

          <div v-if="testResult.notice" class="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
            Notice: {{ testResult.notice }}
          </div>
        </div>
      </div>
    </div>

    <!-- 6. TAB: KEYWORD RULES -->
    <div v-if="activeSubTab === 'keywords'" class="space-y-5">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-slate-900">Instant Keyword Triggers</h2>
            <p class="text-xs text-slate-500 mt-0.5">
              Match exact keywords or prefixes for instant rule-based actions before routing to AI.
            </p>
          </div>
          <button
            @click="showAddRuleModal = true"
            class="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </div>

        <!-- Rules List -->
        <div v-if="automations.length === 0" class="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
          No custom keyword rules created yet. Click "Add Rule" to configure one.
        </div>

        <div v-else class="space-y-2.5">
          <div
            v-for="rule in automations"
            :key="rule.id"
            class="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900">"{{ rule.keyword }}"</span>
                <span class="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">
                  Match: {{ rule.matchType }}
                </span>
                <span
                  v-if="rule.leadStatusTarget"
                  class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded"
                >
                  Target Lead: {{ rule.leadStatusTarget }}
                </span>
              </div>
              <p class="text-slate-600 text-[11px]">{{ rule.responseText || '(No direct response text)' }}</p>
            </div>

            <div class="flex items-center gap-3">
              <button
                @click="handleToggleRule(rule)"
                class="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors border"
                :class="
                  rule.active
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-slate-200 text-slate-600 border-slate-300'
                "
              >
                {{ rule.active ? 'Active' : 'Paused' }}
              </button>
              <button
                @click="handleDeleteRule(rule.id)"
                class="text-slate-400 hover:text-rose-600 p-1 transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Keyword Rule Modal -->
    <div
      v-if="showAddRuleModal"
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100"
    >
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4 border border-slate-200">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-sm font-bold text-slate-900">Add Keyword Automation Rule</h3>
          <button @click="showAddRuleModal = false" class="text-slate-400 hover:text-slate-600 text-lg">×</button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-800 mb-1">Trigger Keyword *</label>
            <input
              v-model="newKeyword"
              type="text"
              placeholder="e.g. quote, price, demo"
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-800 mb-1">Match Type</label>
            <select
              v-model="newMatchType"
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="contains">Contains Keyword</option>
              <option value="exact">Exact Match</option>
              <option value="starts_with">Starts With</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-800 mb-1">Auto-Response Message</label>
            <textarea
              v-model="newResponse"
              rows="3"
              placeholder="Enter message to reply with when triggered..."
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            ></textarea>
          </div>

          <div>
            <label class="block font-bold text-slate-800 mb-1">Set Lead Status To</label>
            <select
              v-model="newLeadTarget"
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="NEW">NEW</option>
            </select>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            @click="showAddRuleModal = false"
            class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleCreateRule"
            :disabled="!newKeyword.trim() || isSubmittingRule"
            class="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
