<script setup lang="ts">
import { ref } from 'vue';
import SizcLogo from './SizcLogo.vue';
import {
  MessageSquare,
  Bot,
  Target,
  Zap,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  Sparkles,
  Users,
  Send,
  Building,
  Check,
  Flame,
  Star,
  Layers,
  HelpCircle,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'start-free'): void;
  (e: 'sign-in'): void;
  (e: 'explore-demo'): void;
}>();

const selectedFaq = ref<number | null>(0);
const pricingBillingCycle = ref<'monthly' | 'annual'>('monthly');

const toggleFaq = (index: number) => {
  selectedFaq.value = selectedFaq.value === index ? null : index;
};

const faqs = [
  {
    q: 'How does SIZC integrate with WhatsApp?',
    a: 'SIZC connects directly with the official WhatsApp Business Platform. This gives you verified green-tick eligibility, official message deliverability, multi-agent human handoff, and compliance with Meta policies.',
  },
  {
    q: 'How does the Gemini AI Sales Agent qualify leads?',
    a: 'When an inquiry arrives, Gemini evaluates intent, budget, timeline, and product interest in real-time. It returns structured qualification data, calculates a 0-100 lead score (Cold, Warm, Hot, Very Hot), and assigns tags automatically.',
  },
  {
    q: 'Can human agents take over from the AI at any time?',
    a: 'Yes! SIZC provides a single-click "Take Over" button on every conversation. Once a human takes over, the AI instantly yields control so your sales team can negotiate and close.',
  },
  {
    q: 'Is SIZC designed for Indian small and medium businesses?',
    a: 'Absolutely. SIZC is optimized for Indian SMB workflows—supporting Indian phone validation (+91), INR (₹) transparent pricing, multi-language responses (English, Hindi, Hinglish), and GST invoice compatibility.',
  },
  {
    q: 'Do I need technical or coding knowledge to use SIZC?',
    a: 'None at all. You can set up your business profile, customize your AI knowledge in simple plain text, and start qualifying WhatsApp leads in under 5 minutes.',
  },
];
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 selection:bg-indigo-500 selection:text-white" id="sizc-landing-page">
    <!-- TOP NAVBAR -->
    <header class="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <!-- Brand Logo -->
        <a href="#hero" class="flex items-center">
          <SizcLogo size="lg" />
        </a>

        <!-- Nav Links -->
        <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <a href="#features" class="hover:text-indigo-600 transition-colors">Features</a>
          <a href="#ai-agent" class="hover:text-indigo-600 transition-colors">AI Sales Agent</a>
          <a href="#how-it-works" class="hover:text-indigo-600 transition-colors">How It Works</a>
          <a href="#pricing" class="hover:text-indigo-600 transition-colors">Pricing</a>
          <a href="#faq" class="hover:text-indigo-600 transition-colors">FAQ</a>
        </nav>

        <!-- Action CTAs -->
        <div class="flex items-center gap-3">
          <button
            @click="emit('sign-in')"
            class="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
            id="nav-btn-signin"
          >
            Sign In
          </button>
          <button
            @click="emit('start-free')"
            class="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-95"
            id="nav-btn-start-free"
          >
            <span>Start Free</span>
            <ArrowRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>

    <!-- 1. HERO SECTION -->
    <section id="hero" class="relative pt-20 pb-28 overflow-hidden">
      <!-- Background subtle gradient glow -->
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-100/60 via-purple-100/40 to-blue-50/20 blur-3xl -z-10 rounded-full"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <!-- Trust badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold mb-6 shadow-sm">
          <span class="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Official WhatsApp Business Platform</span>
          <span class="text-slate-300">|</span>
          <span class="text-indigo-600 font-bold">Powered by Gemini AI</span>
        </div>

        <!-- Main Headline -->
        <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Turn every conversation <br class="hidden sm:inline" />
          into a <span class="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">customer.</span>
        </h1>

        <!-- Subheadline -->
        <p class="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          AI-powered conversations, WhatsApp automation and sales management — built for businesses that want to respond faster and sell smarter.
        </p>

        <!-- CTAs -->
        <div class="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            @click="emit('start-free')"
            class="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
            id="hero-btn-start-free"
          >
            <span>Get Started</span>
            <ArrowRight class="w-5 h-5" />
          </button>

          <button
            @click="emit('explore-demo')"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded-2xl border border-slate-200 transition-all duration-150"
            id="hero-btn-explore-demo"
          >
            <Sparkles class="w-5 h-5 text-indigo-600" />
            <span>See how it works</span>
          </button>
        </div>

        <!-- Trust indicators -->
        <div class="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span>14-Day Free Trial</span>
          </div>
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span>No Credit Card Required</span>
          </div>
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Official WhatsApp Compliance</span>
          </div>
          <div class="flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Ready for Indian Businesses</span>
          </div>
        </div>

        <!-- 2. PRODUCT PREVIEW HERO MOCKUP -->
        <div class="mt-14 relative max-w-5xl mx-auto rounded-2xl border border-slate-200/80 bg-white p-2.5 sm:p-4 shadow-2xl shadow-slate-300/40 overflow-hidden">
          <div class="rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden text-left">
            <!-- Mock Header Bar -->
            <div class="h-12 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span class="text-xs font-bold text-slate-700 ml-2">SIZC Intelligent Inbox</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  WhatsApp Connected
                </span>
                <span class="text-xs font-semibold text-slate-500">Apex Jewellers Workspace</span>
              </div>
            </div>

            <!-- Mock 3-Column Preview -->
            <div class="grid grid-cols-12 h-[420px] bg-white divide-x divide-slate-100 text-xs">
              <!-- Left: Chats list -->
              <div class="col-span-4 p-3 bg-slate-50/60 flex flex-col space-y-2 overflow-hidden">
                <div class="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span class="font-bold text-slate-800">Inbox Conversations</span>
                  <span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold">3 New</span>
                </div>

                <!-- Active Chat 1 -->
                <div class="p-3 bg-white rounded-xl border border-indigo-200 shadow-sm flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-900">Ananya Verma</span>
                    <span class="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-bold text-[10px] flex items-center gap-1">
                      <Flame class="w-3 h-3 text-rose-500" />
                      Score: 92 (Hot)
                    </span>
                  </div>
                  <p class="text-slate-500 truncate text-[11px]">"Looking for 22K bridal jewellery for next month..."</p>
                  <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span class="text-indigo-600 font-semibold">AI Qualified</span>
                    <span>Just now</span>
                  </div>
                </div>

                <!-- Chat 2 -->
                <div class="p-3 bg-white/70 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-700">Rohan Kapoor</span>
                    <span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[10px]">Score: 68 (Warm)</span>
                  </div>
                  <p class="text-slate-500 truncate text-[11px]">"Can you share the pricing catalog for rings?"</p>
                </div>
              </div>

              <!-- Middle: Thread -->
              <div class="col-span-5 p-4 flex flex-col justify-between bg-white">
                <div class="space-y-3">
                  <!-- Customer msg -->
                  <div class="flex flex-col items-start">
                    <div class="bg-slate-100 text-slate-800 p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-[11px] leading-relaxed">
                      Hi, I saw your bridal set catalogue. What is the approximate pricing for the Kundan choker set, and do you deliver to Bangalore?
                    </div>
                    <span class="text-[9px] text-slate-400 mt-0.5">10:42 AM</span>
                  </div>

                  <!-- AI reply -->
                  <div class="flex flex-col items-end">
                    <div class="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%] text-[11px] leading-relaxed shadow-sm">
                      <div class="flex items-center gap-1 mb-1 text-[10px] font-bold text-indigo-200">
                        <Bot class="w-3 h-3" />
                        <span>SIZC Gemini Sales Agent</span>
                      </div>
                      Hello Ananya! Our handcrafted Kundan choker sets range from ₹1,20,000 to ₹3,50,000 with 100% BIS hallmark certification. Yes, we provide insured express delivery to Bangalore! Would you like our specialist to share custom video previews?
                    </div>
                    <span class="text-[9px] text-slate-400 mt-0.5">10:42 AM • AI Sent</span>
                  </div>
                </div>

                <!-- Action Bar -->
                <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                    <Bot class="w-3.5 h-3.5" />
                    AI Agent is actively qualifying
                  </span>
                  <button
                    @click="emit('explore-demo')"
                    class="px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-600 transition-colors"
                  >
                    Take Over Chat
                  </button>
                </div>
              </div>

              <!-- Right: Customer Profile Panel -->
              <div class="col-span-3 p-3 bg-slate-50/50 space-y-3">
                <div class="font-bold text-slate-800 border-b border-slate-200 pb-1.5">Lead Intelligence</div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-semibold">Lead Score</div>
                  <div class="text-xl font-black text-rose-600 flex items-center gap-1.5">
                    92/100
                    <span class="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold">Very Hot</span>
                  </div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-semibold">Requirement</div>
                  <div class="font-medium text-slate-700 text-[11px]">Bridal Kundan Set (Bengaluru)</div>
                </div>
                <div>
                  <div class="text-[10px] text-slate-400 uppercase font-semibold">Pipeline Stage</div>
                  <span class="inline-block mt-0.5 px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">Qualified Lead</span>
                </div>
                <div class="pt-2 border-t border-slate-200">
                  <div class="text-[10px] text-slate-400 uppercase font-semibold mb-1">Tags</div>
                  <div class="flex flex-wrap gap-1">
                    <span class="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-semibold">Pricing Requested</span>
                    <span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-semibold">High Value</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. WHY SIZC & VALUE PROPOSITION -->
    <section class="py-20 bg-slate-50/70 border-y border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Why SIZC</h2>
          <p class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Stop losing WhatsApp leads to slow responses and chaotic chats.
          </p>
          <p class="mt-4 text-slate-600">
            Traditional CRMs were built for email. SIZC is purpose-built for the speed, intimacy, and conversion rates of modern WhatsApp conversations.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
              <Zap class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Sub-Second Response Times</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Gemini AI engages every lead immediately 24/7, answering pricing, policies, and requirements before customer attention drifts away.
            </p>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
            <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
              <Target class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Mathematical Lead Scoring</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              Every conversation is scored 0–100 across buying intent, budget, timeline, and urgency. Your sales team focuses only on high-conversion deals.
            </p>
          </div>

          <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
            <div class="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6">
              <Users class="w-6 h-6" />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">Seamless Human Handover</h3>
            <p class="text-sm text-slate-600 leading-relaxed">
              When high-touch negotiation is needed, humans take over with one click. The AI pauses automatically and records all background context.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. CORE FEATURES BREAKDOWN (Sections 4-8) -->
    <section id="features" class="py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        <!-- Feature 1: Unified Inbox -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4">
              <MessageSquare class="w-3.5 h-3.5" />
              Unified Inbox
            </div>
            <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              Manage customer conversations from one clean workspace.
            </h3>
            <p class="mt-4 text-slate-600 leading-relaxed">
              Eliminate shared phone confusion. SIZC provides a synchronized multi-agent team inbox where agents and AI collaborate smoothly with real-time status indicators and customer profiles.
            </p>
            <ul class="mt-6 space-y-3 text-sm text-slate-700">
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Multi-agent assignment and conversation resolution</span>
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Custom filters: Unread, Leads, AI Handled, Human Assigned</span>
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Rich media: Images, documents, templates, and voice notes</span>
              </li>
            </ul>
          </div>
          <div class="bg-slate-900 p-6 rounded-2xl shadow-xl text-white">
            <div class="text-xs text-slate-400 font-mono mb-3">Live Team Collaboration</div>
            <div class="space-y-3">
              <div class="p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">RK</div>
                  <div>
                    <div class="font-bold text-sm">Rahul (Sales Lead)</div>
                    <div class="text-xs text-slate-400">Assigned to Hot Lead #1042</div>
                  </div>
                </div>
                <span class="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Active</span>
              </div>
              <div class="p-3 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">AI</div>
                  <div>
                    <div class="font-bold text-sm">Gemini Sales Agent</div>
                    <div class="text-xs text-slate-400">Autonomously qualifying 8 inbound leads</div>
                  </div>
                </div>
                <span class="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">Autonomous</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature 2: AI Sales Agent (Gemini) -->
        <div id="ai-agent" class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <div class="lg:order-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-4">
              <Bot class="w-3.5 h-3.5" />
              AI Sales Agent
            </div>
            <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              Let Gemini qualify customers, answer questions and move conversations toward conversion.
            </h3>
            <p class="mt-4 text-slate-600 leading-relaxed">
              Powered by Google's latest Gemini models, the SIZC agent learns your business catalog, answers inquiries with strict boundary rules (never inventing prices), and extracts structured qualification data.
            </p>
            <ul class="mt-6 space-y-3 text-sm text-slate-700">
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Structured intent & buying signal extraction in real-time</span>
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Strict business knowledge boundaries & policy adherence</span>
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Multi-language support (English, Hindi, Hinglish, regional)</span>
              </li>
            </ul>
          </div>
          <div class="lg:order-1 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <span class="font-bold text-xs text-slate-700">Gemini Structured Analysis</span>
                <span class="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Confidence: 94%</span>
              </div>
              <div class="space-y-2 text-xs font-mono">
                <div class="text-slate-500">intent: <span class="text-indigo-600 font-bold">"bulk_pricing_inquiry"</span></div>
                <div class="text-slate-500">budget_provided: <span class="text-emerald-600 font-bold">true (₹2.5 Lakhs)</span></div>
                <div class="text-slate-500">timeline: <span class="text-amber-600 font-bold">"Within 14 days"</span></div>
                <div class="text-slate-500">suggested_tags: <span class="text-purple-600">["Hot Lead", "Pricing Requested", "High Value"]</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature 3: Lead Management & Pipeline -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-4">
              <Target class="w-3.5 h-3.5" />
              Lead Scoring & Pipeline
            </div>
            <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              Automatically organize, score and track your leads.
            </h3>
            <p class="mt-4 text-slate-600 leading-relaxed">
              Every contact is assigned a dynamic lead score (0-100) and placed into visual pipeline stages (New, Contacted, Qualified, Negotiation, Won, Lost) so no deal gets neglected.
            </p>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="grid grid-cols-4 gap-2 text-center text-xs mb-4 font-bold">
              <div class="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">0-30<br /><span class="font-normal text-[10px]">Cold</span></div>
              <div class="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">31-60<br /><span class="font-normal text-[10px]">Warm</span></div>
              <div class="p-2 bg-rose-50 rounded-lg border border-rose-200 text-rose-800">61-80<br /><span class="font-normal text-[10px]">Hot</span></div>
              <div class="p-2 bg-purple-50 rounded-lg border border-purple-200 text-purple-800">81-100<br /><span class="font-normal text-[10px]">Very Hot</span></div>
            </div>
            <p class="text-xs text-slate-500 text-center">Idempotent tag categorization and automatic stage progression based on buying signals.</p>
          </div>
        </div>

        <!-- Feature 4: Smart Follow-ups & Automations -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <div class="lg:order-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-4">
              <Zap class="w-3.5 h-3.5" />
              Smart Follow-ups & Automations
            </div>
            <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              Never let an interested prospect go cold.
            </h3>
            <p class="mt-4 text-slate-600 leading-relaxed">
              Trigger contextual auto-replies, keyword flows, and scheduled follow-ups. Ensure timely responses when customers ask about pricing, catalog downloads, or location details.
            </p>
            <ul class="mt-6 space-y-3 text-sm text-slate-700">
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Instant keyword triggers and interactive reply menus</span>
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Automated lead status adjustments on customer action</span>
              </li>
            </ul>
          </div>
          <div class="lg:order-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div class="text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">Active Automation Flow</div>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <span class="font-semibold text-slate-700">Keyword: "PRICING"</span>
              <span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Active</span>
            </div>
            <div class="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-slate-700">
              Action: Send official product catalog + notify sales team immediately.
            </div>
          </div>
        </div>

        <!-- Feature 5: Broadcast Campaigns & Analytics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
              <BarChart3 class="w-3.5 h-3.5" />
              Campaigns & Analytics
            </div>
            <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              Launch targeted broadcasts and monitor revenue metrics.
            </h3>
            <p class="mt-4 text-slate-600 leading-relaxed">
              Send personalized WhatsApp campaigns to segmented customer lists with pre-approved message templates. Track delivery rates, read receipts, and real-time sales conversions.
            </p>
            <ul class="mt-6 space-y-3 text-sm text-slate-700">
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Audience filtering by tags, lead score, and opt-in status</span>
              </li>
              <li class="flex items-center gap-2.5">
                <CheckCircle2 class="w-4 h-4 text-indigo-600" />
                <span>Live conversion rate tracking and revenue analytics</span>
              </li>
            </ul>
          </div>
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div class="text-[10px] uppercase font-bold text-slate-400">Broadcast Sent</div>
                <div class="text-2xl font-black text-slate-900 mt-1">1,250</div>
                <div class="text-[10px] text-emerald-600 font-semibold mt-0.5">99.4% Delivery</div>
              </div>
              <div class="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <div class="text-[10px] uppercase font-bold text-indigo-400">Response Rate</div>
                <div class="text-2xl font-black text-indigo-600 mt-1">38.2%</div>
                <div class="text-[10px] text-indigo-600 font-semibold mt-0.5">478 Inquiries Generated</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Feature 6: Enterprise Security & Data Isolation -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
          <div class="lg:order-2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-4">
              <ShieldCheck class="w-3.5 h-3.5 text-indigo-600" />
              Security & Privacy
            </div>
            <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">
              Tenant isolation and cloud-grade data protection.
            </h3>
            <p class="mt-4 text-slate-600 leading-relaxed">
              Every workspace operates in a strictly isolated tenant boundary. Credentials and customer data are encrypted server-side with zero cross-tenant leakage.
            </p>
          </div>
          <div class="lg:order-1 bg-slate-900 text-white p-6 rounded-2xl shadow-lg space-y-3 text-xs font-mono">
            <div class="text-slate-400 border-b border-slate-800 pb-2 flex items-center justify-between">
              <span>Security Protocols</span>
              <span class="text-emerald-400">ENCRYPTED</span>
            </div>
            <div class="space-y-1.5 text-slate-300">
              <div class="flex items-center gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
                <span>Server-side only WhatsApp token storage</span>
              </div>
              <div class="flex items-center gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
                <span>HMAC-SHA256 signature verification on all webhooks</span>
              </div>
              <div class="flex items-center gap-2">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
                <span>Firestore multi-tenant security rules</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 10. HOW IT WORKS -->
    <section id="how-it-works" class="py-20 bg-slate-900 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">Simple 3-Step Setup</h2>
        <p class="text-3xl sm:text-4xl font-extrabold tracking-tight">
          How SIZC transforms your sales in minutes
        </p>

        <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div class="bg-slate-800/80 p-8 rounded-2xl border border-slate-700">
            <div class="w-10 h-10 rounded-xl bg-indigo-500 text-white font-bold flex items-center justify-center mb-6">1</div>
            <h3 class="text-xl font-bold mb-2">Connect WhatsApp</h3>
            <p class="text-sm text-slate-400 leading-relaxed">
              Connect your existing business number via official WhatsApp Business Platform in just a few clicks.
            </p>
          </div>

          <div class="bg-slate-800/80 p-8 rounded-2xl border border-slate-700">
            <div class="w-10 h-10 rounded-xl bg-purple-500 text-white font-bold flex items-center justify-center mb-6">2</div>
            <h3 class="text-xl font-bold mb-2">Configure AI Sales Agent</h3>
            <p class="text-sm text-slate-400 leading-relaxed">
              Paste your product catalog, pricing guidelines, and qualifying questions into SIZC. Gemini adopts your exact tone.
            </p>
          </div>

          <div class="bg-slate-800/80 p-8 rounded-2xl border border-slate-700">
            <div class="w-10 h-10 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center mb-6">3</div>
            <h3 class="text-xl font-bold mb-2">Turn Chats into Revenue</h3>
            <p class="text-sm text-slate-400 leading-relaxed">
              Watch qualified leads flow into your pipeline with score ratings while your team focuses on closing deals.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 11. PRICING SECTION -->
    <section id="pricing" class="py-24 bg-slate-50/70 border-t border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-14">
          <h2 class="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Transparent Pricing</h2>
          <p class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Predictable plans designed for growing businesses
          </p>
          <p class="mt-3 text-slate-600">
            14-day free trial on all plans. No credit card required. Cancel anytime.
          </p>
        </div>

        <!-- Pricing Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <!-- Starter -->
          <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="text-xs font-bold uppercase text-slate-500">Starter</div>
              <div class="mt-4 flex items-baseline gap-1">
                <span class="text-4xl font-black text-slate-900">₹1,499</span>
                <span class="text-xs font-semibold text-slate-500">/ month</span>
              </div>
              <p class="text-xs text-slate-500 mt-2">For single-location businesses & solo founders starting on WhatsApp.</p>
              
              <ul class="mt-6 space-y-3 text-xs text-slate-700">
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> 1 WhatsApp Number</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> Up to 1,000 Conversations/mo</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> Gemini AI Sales Qualification</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> 2 Team Members</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> Unified Inbox & CRM</li>
              </ul>
            </div>
            <button
              @click="emit('start-free')"
              class="w-full mt-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
            >
              Start 14-Day Free Trial
            </button>
          </div>

          <!-- Growth (Featured) -->
          <div class="bg-white p-8 rounded-2xl border-2 border-indigo-600 shadow-xl relative flex flex-col justify-between">
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider shadow-sm">
              Most Popular
            </div>
            <div>
              <div class="text-xs font-bold uppercase text-indigo-600">Growth</div>
              <div class="mt-4 flex items-baseline gap-1">
                <span class="text-4xl font-black text-slate-900">₹3,999</span>
                <span class="text-xs font-semibold text-slate-500">/ month</span>
              </div>
              <p class="text-xs text-slate-500 mt-2">For established SMBs scaling inbound leads and sales operations.</p>
              
              <ul class="mt-6 space-y-3 text-xs text-slate-700">
                <li class="flex items-center gap-2 font-bold"><Check class="w-4 h-4 text-indigo-600 shrink-0" /> Everything in Starter</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-indigo-600 shrink-0" /> Up to 5,000 Conversations/mo</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-indigo-600 shrink-0" /> 5 Team Members with Roles</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-indigo-600 shrink-0" /> Smart Automations & Follow-ups</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-indigo-600 shrink-0" /> WhatsApp Campaign Broadcasts</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-indigo-600 shrink-0" /> Advanced Analytics & Reports</li>
              </ul>
            </div>
            <button
              @click="emit('start-free')"
              class="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 transition-all"
            >
              Start 14-Day Free Trial
            </button>
          </div>

          <!-- Scale -->
          <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div class="text-xs font-bold uppercase text-slate-500">Scale</div>
              <div class="mt-4 flex items-baseline gap-1">
                <span class="text-4xl font-black text-slate-900">₹8,999</span>
                <span class="text-xs font-semibold text-slate-500">/ month</span>
              </div>
              <p class="text-xs text-slate-500 mt-2">For multi-branch retail, real estate builders, and high-volume agencies.</p>
              
              <ul class="mt-6 space-y-3 text-xs text-slate-700">
                <li class="flex items-center gap-2 font-bold"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> Everything in Growth</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Conversations</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited Team Seats</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> Dedicated Account Manager</li>
                <li class="flex items-center gap-2"><Check class="w-4 h-4 text-emerald-600 shrink-0" /> Custom Webhook Ingestion</li>
              </ul>
            </div>
            <button
              @click="emit('start-free')"
              class="w-full mt-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
            >
              Start 14-Day Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 12. FAQ SECTION -->
    <section id="faq" class="py-20 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-14">
          <h2 class="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Got Questions?</h2>
          <p class="text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(faq, idx) in faqs"
            :key="idx"
            class="border border-slate-200 rounded-2xl overflow-hidden transition-all"
          >
            <button
              @click="toggleFaq(idx)"
              class="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <span class="text-sm sm:text-base">{{ faq.q }}</span>
              <ChevronDown
                class="w-5 h-5 text-slate-400 transition-transform duration-200"
                :class="{ 'rotate-180 text-indigo-600': selectedFaq === idx }"
              />
            </button>
            <div
              v-show="selectedFaq === idx"
              class="px-6 pb-5 pt-1 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50"
            >
              {{ faq.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 13. FINAL CTA -->
    <section class="py-20 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 class="text-3xl sm:text-5xl font-extrabold tracking-tight">
          Ready to turn every conversation into a customer?
        </h2>
        <p class="mt-4 text-base sm:text-lg text-indigo-200 max-w-2xl mx-auto">
          Join modern businesses automating lead qualification and growing WhatsApp sales with SIZC today.
        </p>
        <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            @click="emit('start-free')"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl shadow-xl transition-all"
            id="final-cta-btn"
          >
            <span>Start Free Now</span>
            <ArrowRight class="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>

    <!-- 14. FOOTER -->
    <footer class="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <SizcLogo variant="white" size="sm" />
          <span class="text-slate-500">© 2026 SIZC Inc. All rights reserved.</span>
        </div>

        <div class="flex items-center gap-6">
          <a href="#features" class="hover:text-white transition-colors">Features</a>
          <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" class="hover:text-white transition-colors">FAQ</a>
          <button @click="emit('sign-in')" class="hover:text-white transition-colors">Sign In</button>
        </div>
      </div>
    </footer>
  </div>
</template>
