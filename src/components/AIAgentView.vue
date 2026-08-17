<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { AIConfig, GeminiSalesAgentOutput, LeadScoreBand } from '../types';
import { api } from '../services/api';
import {
  Bot,
  Sparkles,
  Save,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Zap,
  Sliders,
  Send,
  MessageSquare,
} from 'lucide-vue-next';

const props = defineProps<{
  businessId: string;
}>();

const config = ref<AIConfig>({
  businessId: props.businessId,
  enabled: true,
  autoReply: true,
  agentName: 'SIZC Sales Agent',
  modelName: 'gemini-3.7-flash',
  systemPrompt: 'You are the intelligent WhatsApp AI Sales Agent for SIZC. Your goal is to qualify inbound customer inquiries, understand requirements, budget, and timeline, and guide them toward a deal without inventing false information.',
  businessDescription: 'We are a premium retail and bespoke jewellery store based in Jaipur & Bangalore, offering 100% BIS Hallmarked 22K/18K Gold, Polki, and Certified Diamond jewellery.',
  productsServices: '- Bridal Kundan & Polki sets (₹1,20,000 - ₹5,00,000)\n- Daily wear diamond rings & pendants (₹25,000 - ₹80,000)\n- Custom design consultations with 3D CAD render previews\n- Insured PAN-India express delivery',
  pricingInfo: 'Standard making charges: 12-16%. Certified IGI/GIA diamonds. 100% exchange value on gold weight.',
  businessHours: 'Monday - Saturday: 10:00 AM - 8:00 PM IST. Sunday: Closed.',
  faqs: 'Q: Do you ship to Mumbai & Bangalore?\nA: Yes, via insured BVC logistics with 2-3 business day delivery.\nQ: Is COD available?\nA: COD available up to ₹50,000 with ₹2,000 advance booking.',
  rules: '1. Never invent prices or discounts not listed.\n2. Never promise delivery under 48 hours without manager approval.\n3. Always state BIS hallmark guarantee.\n4. If customer requests human agent, immediately escalate.',
  qualificationQuestions: [
    'Which specific design or jewellery piece caught your eye?',
    'What approximate budget or weight range do you have in mind?',
    'What is your target date or occasion for this purchase?',
    'Which city should we deliver this to?',
  ],
  personality: 'Professional',
  tone: 'Warm, Consultative, and Trustworthy',
  language: 'English, Hindi, Hinglish',
  humanHandoff: true,
  humanHandoffKeywords: ['speak with human', 'call me', 'manager', 'human agent', 'talk to person', 'real agent'],
  leadQualificationCriteria: 'Inquire about requirements, approximate budget, timeline, and city location.',
});

const isSaving = ref(false);
const saveSuccess = ref(false);

// Test Playground state
const testMessage = ref('Hi! I am looking for a Kundan bridal necklace set for my wedding next month. My budget is around 2 Lakhs. Do you deliver to Pune?');
const isTesting = ref(false);
const testResult = ref<GeminiSalesAgentOutput | null>(null);
const calculatedScore = ref<number | null>(null);
const calculatedBand = ref<LeadScoreBand | null>(null);

const personalities: Array<'Professional' | 'Friendly' | 'Concise' | 'Consultative'> = [
  'Professional',
  'Friendly',
  'Concise',
  'Consultative',
];

const loadConfig = async () => {
  try {
    const data = await api.getAIConfig();
    if (data) {
      config.value = { ...config.value, ...data };
    }
  } catch (err) {
    console.error('Failed to load AI config:', err);
  }
};

const saveConfig = async () => {
  isSaving.value = true;
  saveSuccess.value = false;
  try {
    await api.updateAIConfig(config.value);
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } catch (err) {
    console.error('Failed to save AI config:', err);
  } finally {
    isSaving.value = false;
  }
};

const computeScore = (signals: GeminiSalesAgentOutput['buying_signals']) => {
  const buyingIntentScore = (signals.buying_intent || 0) * 25;
  const budgetScore = signals.budget_provided ? 15 : 0;
  const productScore = signals.product_interest ? 10 : 0;
  const urgencyScore = (signals.urgency || 0) * 15;
  const demoScore = signals.demo_requested ? 15 : 0;
  const priceScore = signals.price_requested ? 10 : 0;
  const repeatScore = 5;
  const qualScore = 5;

  const total = Math.min(
    100,
    Math.round(buyingIntentScore + budgetScore + productScore + urgencyScore + demoScore + priceScore + repeatScore + qualScore)
  );

  let band: LeadScoreBand = 'Cold';
  if (total > 80) band = 'Very Hot';
  else if (total > 60) band = 'Hot';
  else if (total > 30) band = 'Warm';

  return { total, band };
};

const runSimulation = async () => {
  if (!testMessage.value.trim()) return;
  isTesting.value = true;
  testResult.value = null;

  try {
    const res = await api.simulateAIQualification({
      message: testMessage.value,
      config: config.value,
    });

    testResult.value = res.analysis;
    const { total, band } = computeScore(res.analysis.buying_signals);
    calculatedScore.value = total;
    calculatedBand.value = band;
  } catch (err) {
    console.error('Simulation failed:', err);
  } finally {
    isTesting.value = false;
  }
};

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <div class="space-y-8 max-w-7xl mx-auto" id="view-ai-agent">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Bot class="w-6 h-6" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-bold text-slate-900">Gemini AI Sales Agent</h1>
            <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Gemini 3.7 Flash
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Configure automated WhatsApp sales qualification, business knowledge guidelines, and handoff triggers.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- AI Toggle Switch -->
        <button
          @click="config.enabled = !config.enabled"
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all"
          :class="
            config.enabled
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-slate-100 text-slate-500 border-slate-300'
          "
          id="btn-toggle-ai-active"
        >
          <span class="w-2 h-2 rounded-full" :class="config.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
          <span>{{ config.enabled ? 'AI Status: Active' : 'AI Status: Paused' }}</span>
        </button>

        <button
          @click="saveConfig"
          :disabled="isSaving"
          class="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          id="btn-save-ai-config"
        >
          <Save class="w-4 h-4" />
          <span>{{ isSaving ? 'Saving...' : 'Save Changes' }}</span>
        </button>
      </div>
    </div>

    <!-- Success Toast -->
    <div
      v-if="saveSuccess"
      class="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in"
    >
      <CheckCircle2 class="w-4 h-4 text-emerald-600" />
      <span>AI Agent configuration successfully updated and synced across all WhatsApp channels.</span>
    </div>

    <!-- Main Grid: Configuration Left, Simulation Right -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <!-- Left Column: Business Knowledge & Rules (7 cols) -->
      <div class="lg:col-span-7 space-y-6">
        <!-- 1. Personality & Auto-Reply -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders class="w-4 h-4 text-indigo-600" />
            Personality & Tone
          </h2>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              v-for="p in personalities"
              :key="p"
              type="button"
              @click="config.personality = p"
              class="py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center"
              :class="
                config.personality === p
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm ring-1 ring-indigo-600/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              "
              :id="'btn-personality-' + p.toLowerCase()"
            >
              {{ p }}
            </button>
          </div>

          <div class="pt-2">
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tone & Communication Style</label>
            <input
              v-model="config.tone"
              type="text"
              class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              id="input-ai-tone"
            />
          </div>
        </div>

        <!-- 2. Business Knowledge Base -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-indigo-600" />
              Business Knowledge & Catalog
            </h2>
            <span class="text-[11px] text-slate-400">Plain text knowledge base</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Business Description & Background</label>
            <textarea
              v-model="config.businessDescription"
              rows="3"
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-sans"
              placeholder="Describe your business, location, brand specialty..."
              id="textarea-biz-desc"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Products, Services & Pricing Ranges</label>
            <textarea
              v-model="config.productsServices"
              rows="4"
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-mono"
              placeholder="List services, products, pricing guidelines..."
              id="textarea-products"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Frequently Asked Questions & Answers</label>
            <textarea
              v-model="config.faqs"
              rows="3"
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-sans"
              placeholder="Q: Do you ship to Mumbai? A: Yes..."
              id="textarea-faqs"
            ></textarea>
          </div>
        </div>

        <!-- 3. Strict AI Rules & Human Handoff -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-emerald-600" />
            Safety Rules & Guardrails
          </h2>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Strict Rules (Never invent prices or policies)</label>
            <textarea
              v-model="config.rules"
              rows="3"
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed font-sans"
              placeholder="Rules the AI must never violate..."
              id="textarea-rules"
            ></textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Human Handoff Trigger Keywords</label>
            <div class="flex flex-wrap gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span
                v-for="(kw, idx) in config.humanHandoffKeywords"
                :key="idx"
                class="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-lg text-[11px] font-semibold"
              >
                "{{ kw }}"
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Interactive Lead Qualification Playground (5 cols) -->
      <div class="lg:col-span-5 space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-500/5 space-y-5 sticky top-24">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div class="flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-indigo-600" />
              <h2 class="text-sm font-bold text-slate-900">AI Qualification Simulator</h2>
            </div>
            <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Live Test</span>
          </div>

          <p class="text-xs text-slate-500">
            Type any customer inquiry below to test how Gemini analyzes intent, extracts buying signals, calculates lead score, and crafts replies.
          </p>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Customer Message</label>
            <textarea
              v-model="testMessage"
              rows="3"
              class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Type simulated WhatsApp message..."
              id="input-sim-message"
            ></textarea>
          </div>

          <button
            @click="runSimulation"
            :disabled="isTesting || !testMessage.trim()"
            class="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
            id="btn-run-simulation"
          >
            <Play class="w-3.5 h-3.5" />
            <span>{{ isTesting ? 'Gemini is Analyzing...' : 'Run Qualification Test' }}</span>
          </button>

          <!-- Simulation Output Card -->
          <div v-if="testResult" class="space-y-4 pt-4 border-t border-slate-100 animate-fade-in text-xs">
            <!-- Score & Band Badge -->
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Calculated Score</span>
                <div class="text-2xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                  {{ calculatedScore }}/100
                  <span
                    class="text-xs px-2 py-0.5 rounded-full font-bold"
                    :class="{
                      'bg-purple-100 text-purple-800': calculatedBand === 'Very Hot',
                      'bg-rose-100 text-rose-800': calculatedBand === 'Hot',
                      'bg-amber-100 text-amber-800': calculatedBand === 'Warm',
                      'bg-slate-200 text-slate-700': calculatedBand === 'Cold',
                    }"
                  >
                    {{ calculatedBand }}
                  </span>
                </div>
              </div>

              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase">Stage</span>
                <div class="font-bold text-indigo-700 mt-1">{{ testResult.suggested_stage }}</div>
              </div>
            </div>

            <!-- AI Response Preview -->
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase">AI WhatsApp Reply</span>
              <div class="mt-1 p-3 bg-indigo-600 text-white rounded-xl leading-relaxed shadow-sm font-sans">
                {{ testResult.reply_text }}
              </div>
            </div>

            <!-- Extracted Buying Signals & Qualification -->
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-[11px]">
              <div><strong class="text-slate-500">Intent:</strong> {{ testResult.detected_intent }}</div>
              <div><strong class="text-slate-500">Requirement:</strong> {{ testResult.qualification?.requirement || 'N/A' }}</div>
              <div><strong class="text-slate-500">Budget:</strong> {{ testResult.qualification?.budget || 'N/A' }}</div>
              <div><strong class="text-slate-500">Location:</strong> {{ testResult.qualification?.location || 'N/A' }}</div>
              <div><strong class="text-slate-500">Timeline:</strong> {{ testResult.qualification?.timeline || 'N/A' }}</div>
              <div class="flex items-center gap-1 flex-wrap pt-1 font-sans">
                <span class="text-[10px] text-slate-500 font-bold">Tags:</span>
                <span
                  v-for="t in testResult.suggested_tags"
                  :key="t"
                  class="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-semibold"
                >
                  {{ t }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
