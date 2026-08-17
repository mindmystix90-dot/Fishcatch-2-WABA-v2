<script setup lang="ts">
import { ref } from 'vue';
import SizcLogo from './SizcLogo.vue';
import type { BusinessCategory } from '../types';
import {
  Building2,
  Layers,
  Globe2,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Key,
  ShieldAlert,
} from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  userName?: string;
}>();

const emit = defineEmits<{
  (e: 'complete', data: {
    businessName: string;
    category: BusinessCategory;
    country: string;
    ycloudApiKey?: string;
    wabaPhoneNumber?: string;
    skipWhatsApp: boolean;
  }): void;
}>();

const step = ref(1);
const businessName = ref('');
const category = ref<BusinessCategory>('Retail');
const country = ref('India');
const ycloudApiKey = ref('');
const wabaPhoneNumber = ref('');
const isSubmitting = ref(false);

const categories: { label: string; value: BusinessCategory; icon: string }[] = [
  { label: 'Retail & Stores', value: 'Retail', icon: '🛍️' },
  { label: 'Education & Coaching', value: 'Education', icon: '🎓' },
  { label: 'Real Estate & Builders', value: 'Real Estate', icon: '🏢' },
  { label: 'Healthcare & Clinics', value: 'Healthcare', icon: '🏥' },
  { label: 'Digital Agency', value: 'Agency', icon: '🚀' },
  { label: 'E-commerce & D2C', value: 'E-commerce', icon: '📦' },
  { label: 'Professional Services', value: 'Services', icon: '💼' },
  { label: 'Other Business', value: 'Other', icon: '✨' },
];

const nextStep = () => {
  if (step.value === 1 && !businessName.value.trim()) return;
  if (step.value < 4) {
    step.value++;
  } else {
    finishOnboarding(false);
  }
};

const prevStep = () => {
  if (step.value > 1) {
    step.value--;
  }
};

const finishOnboarding = (skipWhatsApp: boolean) => {
  isSubmitting.value = true;
  emit('complete', {
    businessName: businessName.value.trim() || 'My Business',
    category: category.value,
    country: country.value,
    ycloudApiKey: ycloudApiKey.value.trim(),
    wabaPhoneNumber: wabaPhoneNumber.value.trim(),
    skipWhatsApp,
  });
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in"
    id="sizc-onboarding-modal"
  >
    <div
      class="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
    >
      <!-- Progress Bar -->
      <div class="h-1.5 w-full bg-slate-100">
        <div
          class="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-600 transition-all duration-300"
          :style="{ width: `${(step / 4) * 100}%` }"
        ></div>
      </div>

      <div class="p-8">
        <!-- Brand Header -->
        <div class="flex items-center justify-between mb-8">
          <SizcLogo size="md" />
          <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span class="text-indigo-600">Step {{ step }}</span> of 4
          </div>
        </div>

        <!-- Step 1: Business Name -->
        <div v-if="step === 1" class="space-y-6 animate-fade-in">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-3">
              <Sparkles class="w-3.5 h-3.5" />
              Welcome to SIZC
            </div>
            <h2 class="text-2xl font-bold text-slate-900">
              What is your business name?
            </h2>
            <p class="text-sm text-slate-500 mt-1">
              We'll set up your dedicated customer communication workspace.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-2">Company / Brand Name</label>
            <div class="relative">
              <Building2 class="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="businessName"
                type="text"
                placeholder="e.g. Apex Jewellers, Jaipur"
                autofocus
                @keydown.enter="nextStep"
                class="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-inner"
                id="input-onboarding-biz-name"
              />
            </div>
          </div>
        </div>

        <!-- Step 2: Business Category -->
        <div v-if="step === 2" class="space-y-6 animate-fade-in">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">
              Select your business category
            </h2>
            <p class="text-sm text-slate-500 mt-1">
              SIZC customizes your Gemini AI prompts and qualification questions accordingly.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
            <button
              v-for="cat in categories"
              :key="cat.value"
              type="button"
              @click="category = cat.value"
              class="flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150"
              :class="
                category === cat.value
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm ring-1 ring-indigo-600/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              "
              :id="'btn-category-' + cat.value"
            >
              <span class="text-xl shrink-0">{{ cat.icon }}</span>
              <span class="text-sm font-semibold">{{ cat.label }}</span>
            </button>
          </div>
        </div>

        <!-- Step 3: Country -->
        <div v-if="step === 3" class="space-y-6 animate-fade-in">
          <div>
            <h2 class="text-2xl font-bold text-slate-900">
              Select primary market / country
            </h2>
            <p class="text-sm text-slate-500 mt-1">
              WhatsApp phone number formatting, currency (₹ INR) and local timezones will match.
            </p>
          </div>

          <div class="space-y-3">
            <div
              @click="country = 'India'"
              class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all"
              :class="
                country === 'India'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm ring-1 ring-indigo-600/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              "
              id="radio-country-india"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">🇮🇳</span>
                <div>
                  <div class="font-bold text-sm">India (Default)</div>
                  <div class="text-xs text-slate-500">₹ INR pricing, +91 WhatsApp validation, IST timezone</div>
                </div>
              </div>
              <CheckCircle2 v-if="country === 'India'" class="w-5 h-5 text-indigo-600" />
            </div>

            <div
              @click="country = 'United Arab Emirates'"
              class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all"
              :class="
                country === 'United Arab Emirates'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm ring-1 ring-indigo-600/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              "
              id="radio-country-uae"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">🇦🇪</span>
                <div>
                  <div class="font-bold text-sm">UAE & Middle East</div>
                  <div class="text-xs text-slate-500">+971 WhatsApp validation, GST/VAT compliant</div>
                </div>
              </div>
              <CheckCircle2 v-if="country === 'United Arab Emirates'" class="w-5 h-5 text-indigo-600" />
            </div>

            <div
              @click="country = 'International'"
              class="flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all"
              :class="
                country === 'International'
                  ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm ring-1 ring-indigo-600/30'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              "
              id="radio-country-intl"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">🌐</span>
                <div>
                  <div class="font-bold text-sm">International / Global</div>
                  <div class="text-xs text-slate-500">Worldwide E.164 phone numbering</div>
                </div>
              </div>
              <CheckCircle2 v-if="country === 'International'" class="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <!-- Step 4: WhatsApp Connection -->
        <div v-if="step === 4" class="space-y-5 animate-fade-in">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
              <MessageSquare class="w-3.5 h-3.5" />
              WhatsApp Business
            </div>
            <h2 class="text-2xl font-bold text-slate-900">
              Connect your WhatsApp Business account
            </h2>
            <p class="text-sm text-slate-500 mt-1">
              Connect your business WhatsApp number to receive, manage and reply to customer conversations from SIZC.
            </p>
          </div>

          <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <MessageSquare class="w-5 h-5" />
              </div>
              <div>
                <div class="text-sm font-bold text-slate-900">WhatsApp Business Connection</div>
                <div class="text-xs text-slate-500">Secure server-side message synchronization and AI sales replies.</div>
              </div>
            </div>

            <div class="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
              <div class="flex items-center gap-2 font-medium text-slate-800">
                <CheckCircle2 class="w-4 h-4 text-emerald-600" />
                <span>Zero client secrets exposure</span>
              </div>
              <div class="flex items-center gap-2 font-medium text-slate-800">
                <CheckCircle2 class="w-4 h-4 text-emerald-600" />
                <span>Multi-tenant CRM isolation</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <button
            v-if="step > 1"
            type="button"
            @click="prevStep"
            class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            id="btn-onboarding-prev"
          >
            Back
          </button>
          <div v-else></div>

          <div class="flex items-center gap-3">
            <button
              v-if="step === 4"
              type="button"
              @click="finishOnboarding(true)"
              class="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              id="btn-onboarding-skip"
            >
              Skip for now
            </button>

            <button
              type="button"
              @click="nextStep"
              :disabled="step === 1 && !businessName.trim()"
              class="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all duration-150 active:scale-[0.99] disabled:opacity-50"
              id="btn-onboarding-next"
            >
              <span>{{ step === 4 ? 'Launch SIZC Dashboard' : 'Continue' }}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
