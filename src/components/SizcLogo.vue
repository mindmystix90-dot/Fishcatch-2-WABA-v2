<script setup lang="ts">
interface Props {
  variant?: 'full' | 'icon' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withTagline?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'full',
  size: 'md',
  withTagline: false,
});
</script>

<template>
  <div class="inline-flex items-center gap-2.5 select-none" :id="'sizc-logo-' + size">
    <!-- Abstract Flowing Connected S Icon -->
    <div
      class="relative flex items-center justify-center shrink-0"
      :class="{
        'w-7 h-7': size === 'sm',
        'w-9 h-9': size === 'md',
        'w-11 h-11': size === 'lg',
        'w-14 h-14': size === 'xl',
      }"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="w-full h-full drop-shadow-sm transition-transform hover:scale-105 duration-200"
      >
        <defs>
          <!-- SIZC Signature Gradient: Deep Indigo -> Vibrant Electric Blue -> Violet -->
          <linearGradient id="sizcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4F46E5" />
            <stop offset="50%" stop-color="#3B82F6" />
            <stop offset="100%" stop-color="#8B5CF6" />
          </linearGradient>
          <linearGradient id="sizcAccentGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#06B6D4" />
            <stop offset="100%" stop-color="#3B82F6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Rounded Background tile for clean contrast -->
        <rect width="40" height="40" rx="10" fill="#0F172A" class="dark:fill-[#0F172A]" />
        
        <!-- Connected Flowing S-Curves representing Conversation & AI Loop -->
        <path
          d="M27 13.5C27 10.46 24.54 8 21.5 8H15.5C12.46 8 10 10.46 10 13.5C10 16.54 12.46 19 15.5 19H24.5C27.54 19 30 21.46 30 24.5C30 27.54 27.54 30 24.5 30H17.5C14.46 30 12 27.54 12 24.5"
          stroke="url(#sizcGradient)"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- WhatsApp / AI Conversation Pulse Node -->
        <circle cx="27" cy="13.5" r="2.5" fill="#10B981" />
        <circle cx="12" cy="24.5" r="2.5" fill="url(#sizcAccentGradient)" />

        <!-- AI Core spark in center connector -->
        <circle cx="20" cy="19" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>

    <!-- SIZC Wordmark -->
    <div v-if="variant !== 'icon'" class="flex flex-col">
      <div class="flex items-center gap-1.5 leading-none">
        <span
          class="font-black tracking-tight"
          :class="{
            'text-lg': size === 'sm',
            'text-xl': size === 'md',
            'text-2xl': size === 'lg',
            'text-3xl': size === 'xl',
            'text-white': variant === 'white',
            'text-slate-900': variant === 'full',
          }"
          style="font-family: system-ui, -apple-system, sans-serif;"
        >
          SIZC
        </span>
        <span
          class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 border border-indigo-200/50"
        >
          AI
        </span>
      </div>
      <span
        v-if="withTagline"
        class="text-[11px] font-medium text-slate-500 tracking-normal mt-0.5"
      >
        Turn every conversation into a customer
      </span>
    </div>
  </div>
</template>
