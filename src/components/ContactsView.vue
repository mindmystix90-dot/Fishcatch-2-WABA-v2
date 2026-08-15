<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Customer } from '../types';
import { api } from '../services/api';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Tag,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-vue-next';

const props = defineProps<{
  contacts: Customer[];
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const searchQuery = ref('');
const showAddModal = ref(false);
const newName = ref('');
const newPhone = ref('');
const newEmail = ref('');
const newTags = ref('');
const isSubmitting = ref(false);

const filteredContacts = computed(() => {
  if (!searchQuery.value.trim()) return props.contacts;
  const q = searchQuery.value.toLowerCase();
  return props.contacts.filter(
    c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
  );
});

const handleAddContact = async () => {
  if (!newPhone.value.trim() || isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await api.createContact({
      name: newName.value.trim(),
      phone: newPhone.value.trim(),
      email: newEmail.value.trim() || undefined,
      tags: newTags.value ? newTags.value.split(',').map(t => t.trim()) : ['Manual CRM'],
    });
    showAddModal.value = false;
    newName.value = '';
    newPhone.value = '';
    newEmail.value = '';
    newTags.value = '';
    emit('refresh');
  } catch (err: any) {
    alert(err.response?.data?.error?.message || err.message);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Contacts CRM</h1>
        <p class="text-xs text-slate-500 mt-0.5">
          Real customer identities, opt-in records, and interaction history.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="relative w-64">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search contacts..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <button
          @click="showAddModal = true"
          class="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <Plus class="w-3.5 h-3.5" />
          Add Contact
        </button>
      </div>
    </div>

    <!-- Zero State -->
    <div v-if="contacts.length === 0" class="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
      <div class="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-3">
        <Users class="w-7 h-7" />
      </div>
      <h2 class="text-base font-bold text-slate-900">No contacts yet</h2>
      <p class="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
        Contacts will automatically appear when customers message your WhatsApp number, or you can manually create customer records.
      </p>
      <button
        @click="showAddModal = true"
        class="mt-4 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
      >
        <Plus class="w-3.5 h-3.5" />
        Add First Contact
      </button>
    </div>

    <!-- Table -->
    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
          <tr>
            <th class="p-3.5">Customer Name</th>
            <th class="p-3.5">Phone Number</th>
            <th class="p-3.5">Email</th>
            <th class="p-3.5">Opt-In Status</th>
            <th class="p-3.5">Tags</th>
            <th class="p-3.5">Last Active</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="contact in filteredContacts" :key="contact.id" class="hover:bg-slate-50/80 transition-colors">
            <td class="p-3.5 font-bold text-slate-900">{{ contact.name }}</td>
            <td class="p-3.5 font-medium text-slate-700">{{ contact.phone }}</td>
            <td class="p-3.5 text-slate-500">{{ contact.email || '—' }}</td>
            <td class="p-3.5">
              <span
                class="px-2 py-0.5 text-[10px] font-bold rounded-full border"
                :class="
                  contact.optInStatus === 'opted_out'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                "
              >
                {{ contact.optInStatus === 'opted_out' ? 'Opted-Out' : 'Opted-In' }}
              </span>
            </td>
            <td class="p-3.5">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="tag in contact.tags"
                  :key="tag"
                  class="px-1.5 py-0.2 text-[10px] font-medium bg-slate-100 text-slate-600 rounded border border-slate-200"
                >
                  {{ tag }}
                </span>
              </div>
            </td>
            <td class="p-3.5 text-slate-400 text-[11px]">
              {{ new Date(contact.lastInteraction).toLocaleDateString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Contact Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-900">Add Customer Contact</h3>
          <button @click="showAddModal = false" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              v-model="newName"
              type="text"
              placeholder="e.g. Jane Doe"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Phone Number *</label>
            <input
              v-model="newPhone"
              type="text"
              placeholder="e.g. +1 555 123 4567"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
            <input
              v-model="newEmail"
              type="email"
              placeholder="jane@example.com"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
            <input
              v-model="newTags"
              type="text"
              placeholder="e.g. VIP, Priority, Consultation"
              class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showAddModal = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="handleAddContact"
            :disabled="!newPhone.trim() || isSubmitting"
            class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Save Contact
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
