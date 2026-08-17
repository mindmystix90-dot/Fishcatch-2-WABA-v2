<script setup lang="ts">
import { ref } from 'vue';
import SizcLogo from './SizcLogo.vue';
import { X, Mail, Lock, User, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', data: { user: any; isNewUser: boolean }): void;
}>();

const mode = ref<'signin' | 'signup'>(props.initialMode || 'signup');
const name = ref('');
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const toggleMode = () => {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin';
  errorMessage.value = '';
};

const handleEmailAuth = async () => {
  if (!email.value || !password.value || (mode.value === 'signup' && !name.value)) {
    errorMessage.value = 'Please fill in all required fields.';
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // Generate persistent profile
    const uid = 'usr_' + Math.random().toString(36).substring(2, 9);
    const userProfile = {
      uid,
      name: name.value.trim() || email.value.split('@')[0],
      email: email.value.trim().toLowerCase(),
      photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.value || email.value)}`,
      companyId: 'biz_' + Math.random().toString(36).substring(2, 9),
      role: 'owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('sizc_current_user', JSON.stringify(userProfile));

    emit('success', {
      user: userProfile,
      isNewUser: mode.value === 'signup',
    });
  } catch (err: any) {
    errorMessage.value = err?.message || 'Authentication failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const uid = 'usr_g_' + Math.random().toString(36).substring(2, 9);
    const userProfile = {
      uid,
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      companyId: 'biz_' + Math.random().toString(36).substring(2, 9),
      role: 'owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('sizc_current_user', JSON.stringify(userProfile));

    emit('success', {
      user: userProfile,
      isNewUser: true,
    });
  } catch (err: any) {
    errorMessage.value = 'Google sign-in could not be completed.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    id="sizc-auth-modal"
  >
    <div
      class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
    >
      <!-- Close button -->
      <button
        @click="emit('close')"
        class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        id="btn-close-auth"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Modal Content -->
      <div class="p-8">
        <!-- Logo & Header -->
        <div class="text-center mb-6">
          <div class="flex justify-center mb-3">
            <SizcLogo size="lg" />
          </div>
          <h2 class="text-2xl font-bold text-slate-900">
            {{ mode === 'signup' ? 'Start your free SIZC account' : 'Welcome back to SIZC' }}
          </h2>
          <p class="text-sm text-slate-500 mt-1">
            {{ mode === 'signup' ? 'Turn every WhatsApp conversation into a customer.' : 'Sign in to access your unified inbox and AI agent.' }}
          </p>
        </div>

        <!-- Google Sign In Button -->
        <button
          type="button"
          @click="handleGoogleSignIn"
          :disabled="isLoading"
          class="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-60 mb-5"
          id="btn-google-auth"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          Continue with Google
        </button>

        <!-- Divider -->
        <div class="relative flex items-center justify-center mb-5">
          <div class="border-t border-slate-200 w-full"></div>
          <span class="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">or email</span>
        </div>

        <!-- Form Error -->
        <div
          v-if="errorMessage"
          class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2"
        >
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Email/Password Form -->
        <form @submit.prevent="handleEmailAuth" class="space-y-4">
          <div v-if="mode === 'signup'">
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Your Full Name</label>
            <div class="relative">
              <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="name"
                type="text"
                placeholder="e.g. Rajesh Patel"
                required
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                id="input-auth-name"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Business Email</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="email"
                type="email"
                placeholder="you@company.in"
                required
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                id="input-auth-email"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div class="relative">
              <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                minlength="6"
                class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                id="input-auth-password"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/25 transition-all duration-150 active:scale-[0.99] disabled:opacity-60 mt-2"
            id="btn-submit-auth"
          >
            <span v-if="isLoading">Processing...</span>
            <span v-else>{{ mode === 'signup' ? 'Create SIZC Account' : 'Sign In to SIZC' }}</span>
            <ArrowRight v-if="!isLoading" class="w-4 h-4" />
          </button>
        </form>

        <!-- Toggle Sign In / Sign Up -->
        <div class="text-center mt-6 text-xs text-slate-600">
          <span>{{ mode === 'signup' ? 'Already have an account?' : "Don't have an account yet?" }}</span>
          <button
            type="button"
            @click="toggleMode"
            class="ml-1.5 font-bold text-indigo-600 hover:text-indigo-800 underline"
            id="btn-toggle-auth-mode"
          >
            {{ mode === 'signup' ? 'Sign In' : 'Start Free →' }}
          </button>
        </div>

        <!-- Trust footer -->
        <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span class="flex items-center gap-1">
            <ShieldCheck class="w-3.5 h-3.5 text-emerald-600" />
            14-Day Free Trial
          </span>
          <span>•</span>
          <span>No Credit Card Required</span>
        </div>
      </div>
    </div>
  </div>
</template>
