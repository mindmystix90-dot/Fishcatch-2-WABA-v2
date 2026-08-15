<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import type {
  Conversation,
  ChatMessage,
  Customer,
  Lead,
  MessageTemplate,
  WhatsAppConnection,
  LeadStatus,
} from '../types';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Send,
  Sparkles,
  Bot,
  User,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Tag,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Plus,
  Info,
  Sliders,
  ShieldCheck,
  Paperclip,
  Image as ImageIcon,
  Music,
  Video,
  File,
  Download,
  Maximize2,
  X,
  UploadCloud,
} from 'lucide-vue-next';

const props = defineProps<{
  conversations: Conversation[];
  contacts: Customer[];
  leads: Lead[];
  templates: MessageTemplate[];
  connection: WhatsAppConnection | null;
  selectedConversationId: string | null;
}>();

const emit = defineEmits<{
  (e: 'selectConversation', id: string | null): void;
  (e: 'refresh'): void;
}>();

const filterTab = ref<'all' | 'open' | 'unread' | 'resolved'>('all');
const searchQuery = ref('');
const messageInput = ref('');
const isSending = ref(false);
const isGeneratingDraft = ref(false);
const messages = ref<ChatMessage[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);
const showMobileDetails = ref(false);

// Media Attachment in Composer
const fileInputRef = ref<HTMLInputElement | null>(null);
const stagedFile = ref<File | null>(null);
const isUploadingAttachment = ref(false);
const uploadProgress = ref(0);

// Media Lightbox
const lightboxMedia = ref<{ url: string; type: string; filename?: string } | null>(null);

// Template picker modal
const showTemplateModal = ref(false);
const selectedTemplate = ref<MessageTemplate | null>(null);
const templateParamValues = ref<string[]>(['', '', '', '']);

// Filtered conversations
const filteredConversations = computed(() => {
  return props.conversations.filter(conv => {
    // Tab filter
    if (filterTab.value === 'open' && conv.status !== 'open') return false;
    if (filterTab.value === 'unread' && conv.unreadCount === 0) return false;
    if (filterTab.value === 'resolved' && conv.status !== 'resolved') return false;

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      const matchName = conv.customerName.toLowerCase().includes(q);
      const matchPhone = conv.customerPhone.toLowerCase().includes(q);
      const matchMsg = (conv.lastMessage || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchMsg;
    }
    return true;
  });
});

const activeConversation = computed(() => {
  return props.conversations.find(c => c.id === props.selectedConversationId) || null;
});

const activeCustomer = computed(() => {
  if (!activeConversation.value) return null;
  return props.contacts.find(c => c.id === activeConversation.value?.customerId) || null;
});

const activeLead = computed(() => {
  if (!activeConversation.value?.leadId) return null;
  return props.leads.find(l => l.id === activeConversation.value?.leadId) || null;
});

// 24-Hour WhatsApp Service Window evaluation
const isWindowActive = computed(() => {
  if (!activeConversation.value?.lastMessageTime) return true;
  const diffMs = Date.now() - new Date(activeConversation.value.lastMessageTime).getTime();
  return diffMs < 24 * 60 * 60 * 1000;
});

// Load messages when conversation changes
const loadMessages = async (convId: string) => {
  try {
    const data = await api.getConversationMessages(convId);
    messages.value = data.messages;
    await api.markConversationRead(convId);
    scrollToBottom();
  } catch (err: any) {
    console.error('Failed to load messages', err);
  }
};

watch(
  () => props.selectedConversationId,
  (newId) => {
    if (newId) {
      loadMessages(newId);
    } else {
      messages.value = [];
    }
  },
  { immediate: true }
);

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const handleSelect = (id: string) => {
  emit('selectConversation', id);
};

const handleBackToList = () => {
  emit('selectConversation', null);
  showMobileDetails.value = false;
};

const handleAttachmentSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    stagedFile.value = target.files[0];
  }
};

const handleRemoveStagedFile = () => {
  stagedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
};

const handleSendMessage = async () => {
  if (!activeConversation.value || (!messageInput.value.trim() && !stagedFile.value) || isSending.value) return;

  const text = messageInput.value.trim();
  const fileToSend = stagedFile.value;
  messageInput.value = '';
  stagedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
  isSending.value = true;

  try {
    let fileId: string | undefined;
    let mediaUrl: string | undefined;
    let mediaType: string | undefined;
    let type: string = 'text';

    if (fileToSend) {
      isUploadingAttachment.value = true;
      const formData = new FormData();
      formData.append('file', fileToSend);
      formData.append('category', 'whatsapp-media');
      formData.append('conversationId', activeConversation.value.id);
      formData.append('customerId', activeConversation.value.customerId);
      formData.append('uploadedBy', 'agent');

      const uploadRes = await api.uploadFile(formData, (percent) => {
        uploadProgress.value = percent;
      });

      fileId = uploadRes.file.id;
      mediaUrl = uploadRes.file.fileUrl;
      mediaType = uploadRes.file.mimeType;

      if (mediaType.startsWith('image/')) type = 'image';
      else if (mediaType.startsWith('audio/')) type = 'audio';
      else if (mediaType.startsWith('video/')) type = 'video';
      else type = 'document';
    }

    const res = await api.sendMessage(activeConversation.value.id, {
      text: text || (fileToSend ? `[Sent Attachment: ${fileToSend.name}]` : ''),
      type,
      fileId,
      mediaUrl,
      mediaType,
    });

    messages.value.push(res.message);
    activeConversation.value.lastMessage = res.message.text;
    activeConversation.value.lastMessageTime = res.message.timestamp;
    scrollToBottom();
    emit('refresh');
  } catch (err: any) {
    alert(err.response?.data?.error?.message || err.message);
  } finally {
    isSending.value = false;
    isUploadingAttachment.value = false;
    uploadProgress.value = 0;
  }
};

// Generate AI Draft
const handleGenerateDraft = async () => {
  if (!activeConversation.value || isGeneratingDraft.value) return;
  isGeneratingDraft.value = true;
  try {
    const draft = await api.generateAIDraft(activeConversation.value.id);
    if (draft) {
      messageInput.value = draft;
    }
  } catch (err: any) {
    console.error(err);
  } finally {
    isGeneratingDraft.value = false;
  }
};

// Toggle AI vs HUMAN Mode
const toggleMode = async () => {
  if (!activeConversation.value) return;
  const newMode = activeConversation.value.mode === 'AI' ? 'HUMAN' : 'AI';
  try {
    const updated = await api.updateConversation(activeConversation.value.id, { mode: newMode });
    activeConversation.value.mode = updated.mode;
  } catch (err: any) {
    console.error(err);
  }
};

// Toggle Open vs Resolved
const toggleResolved = async () => {
  if (!activeConversation.value) return;
  const newStatus = activeConversation.value.status === 'open' ? 'resolved' : 'open';
  try {
    const updated = await api.updateConversation(activeConversation.value.id, { status: newStatus });
    activeConversation.value.status = updated.status;
    emit('refresh');
  } catch (err: any) {
    console.error(err);
  }
};

// Update Lead Status
const handleUpdateLeadStatus = async (status: LeadStatus) => {
  if (!activeLead.value) return;
  try {
    const updated = await api.updateLead(activeLead.value.id, { status });
    activeLead.value.status = updated.status;
    if (activeConversation.value) {
      activeConversation.value.leadStatus = updated.status;
    }
    emit('refresh');
  } catch (err: any) {
    console.error(err);
  }
};

// Template sending
const openTemplateModal = () => {
  selectedTemplate.value = props.templates[0] || null;
  templateParamValues.value = ['', '', '', ''];
  showTemplateModal.value = true;
};

const handleSendTemplate = async () => {
  if (!activeConversation.value || !selectedTemplate.value) return;
  isSending.value = true;
  try {
    const res = await api.sendMessage(activeConversation.value.id, {
      text: selectedTemplate.value.body,
      type: 'template',
      templateName: selectedTemplate.value.name,
      templateParams: templateParamValues.value.filter(Boolean),
    });
    messages.value.push(res.message);
    scrollToBottom();
    showTemplateModal.value = false;
    emit('refresh');
  } catch (err: any) {
    alert(err.response?.data?.error?.message || err.message);
  } finally {
    isSending.value = false;
  }
};
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex bg-white overflow-hidden relative">
    <!-- Left Pane: Conversations List (Hidden on mobile if a conversation is active) -->
    <div
      class="w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 bg-white"
      :class="{ 'hidden md:flex': activeConversation }"
    >
      <!-- Search & Filters -->
      <div class="p-3 border-b border-slate-200 space-y-2">
        <div class="relative">
          <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search conversations or phones..."
            class="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
          <button
            @click="filterTab = 'all'"
            class="flex-1 py-1 rounded-md text-center transition-colors"
            :class="filterTab === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'"
          >
            All ({{ conversations.length }})
          </button>
          <button
            @click="filterTab = 'open'"
            class="flex-1 py-1 rounded-md text-center transition-colors"
            :class="filterTab === 'open' ? 'bg-white text-emerald-800 font-bold shadow-xs' : 'hover:text-slate-900'"
          >
            Open
          </button>
          <button
            @click="filterTab = 'unread'"
            class="flex-1 py-1 rounded-md text-center transition-colors"
            :class="filterTab === 'unread' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'"
          >
            Unread
          </button>
          <button
            @click="filterTab = 'resolved'"
            class="flex-1 py-1 rounded-md text-center transition-colors"
            :class="filterTab === 'resolved' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'hover:text-slate-900'"
          >
            Resolved
          </button>
        </div>
      </div>

      <!-- Conversations Scroll List -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-100">
        <!-- Zero state -->
        <div v-if="filteredConversations.length === 0" class="p-8 text-center my-auto">
          <div class="w-10 h-10 mx-auto rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-2">
            <Search class="w-4 h-4" />
          </div>
          <h3 class="text-xs font-bold text-slate-700">No conversations found</h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            {{ searchQuery ? 'Try adjusting your search query.' : 'Real WhatsApp conversations will appear here.' }}
          </p>
        </div>

        <!-- Conversation Item -->
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          @click="handleSelect(conv.id)"
          class="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors border-l-2"
          :class="
            conv.id === selectedConversationId
              ? 'bg-emerald-50/50 border-emerald-600'
              : 'border-transparent'
          "
        >
          <div class="flex items-start justify-between gap-2 mb-1">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-xs font-bold text-slate-900 truncate">{{ conv.customerName }}</span>
              <span
                class="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded"
                :class="conv.mode === 'AI' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'"
              >
                {{ conv.mode }}
              </span>
            </div>
            <span class="text-[10px] text-slate-400 shrink-0">
              {{ new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-slate-500 truncate">{{ conv.lastMessage || 'No messages' }}</p>
            <span
              v-if="conv.unreadCount > 0"
              class="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-600 text-white rounded-full shrink-0"
            >
              {{ conv.unreadCount }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Pane: Active Conversation Thread -->
    <div
      class="flex-1 flex flex-col bg-slate-50/50 min-w-0"
      :class="{ 'hidden md:flex': !activeConversation }"
    >
      <!-- Top Thread Header -->
      <div v-if="activeConversation" class="h-14 px-3 sm:px-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
        <div class="flex items-center gap-2.5 sm:gap-3">
          <!-- Mobile Back Button -->
          <button
            @click="handleBackToList"
            class="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {{ activeConversation.customerName.charAt(0).toUpperCase() }}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900 truncate">{{ activeConversation.customerName }}</span>
              <span class="text-[11px] text-slate-500 hidden sm:inline">{{ activeConversation.customerPhone }}</span>
            </div>
            <div class="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
              <span>WhatsApp Cloud API</span>
              <span>•</span>
              <span :class="activeCustomer?.optInStatus === 'opted_out' ? 'text-rose-600 font-bold' : 'text-emerald-600'">
                {{ activeCustomer?.optInStatus === 'opted_out' ? 'Opted-Out (STOP)' : 'Opted-In' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Toggle AI / Human Mode -->
          <button
            @click="toggleMode"
            class="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5"
            :class="
              activeConversation.mode === 'AI'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            "
          >
            <Bot class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Mode:</span> <span>{{ activeConversation.mode }}</span>
          </button>

          <!-- Toggle Resolved -->
          <button
            @click="toggleResolved"
            class="hidden sm:inline-block px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {{ activeConversation.status === 'open' ? 'Resolve' : 'Reopen' }}
          </button>

          <!-- Info button on mobile for sidebar -->
          <button
            @click="showMobileDetails = !showMobileDetails"
            class="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <Info class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 24-Hour WhatsApp Service Window Banner -->
      <div
        v-if="activeConversation"
        class="px-4 py-2 text-[11px] flex items-center justify-between gap-2 border-b"
        :class="
          isWindowActive
            ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        "
      >
        <div class="flex items-center gap-1.5 font-medium truncate">
          <Clock class="w-3.5 h-3.5 shrink-0" :class="isWindowActive ? 'text-emerald-700' : 'text-amber-700'" />
          <span class="truncate">
            {{
              isWindowActive
                ? '24-Hour WhatsApp Service Window Active (Direct replies allowed)'
                : '24-Hour Window Closed. Send an approved HSM Template to re-open customer conversation.'
            }}
          </span>
        </div>
        <button
          v-if="!isWindowActive"
          @click="openTemplateModal"
          class="px-2 py-0.5 text-[10px] font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 rounded shrink-0 transition-colors"
        >
          Send Template
        </button>
      </div>

      <!-- Messages Stream -->
      <div v-if="activeConversation" ref="messagesContainer" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <!-- Message Bubbles -->
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex flex-col"
          :class="msg.from === 'customer' ? 'items-start' : 'items-end'"
        >
          <div
            class="max-w-[85%] sm:max-w-md rounded-2xl px-4 py-2.5 shadow-2xs text-xs leading-relaxed"
            :class="
              msg.from === 'customer'
                ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                : msg.from === 'ai'
                ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-tr-xs'
                : 'bg-emerald-600 text-white rounded-tr-xs'
            "
          >
            <!-- Sender Tag for AI -->
            <div v-if="msg.from === 'ai'" class="flex items-center gap-1 text-[10px] font-bold text-emerald-800 mb-1">
              <Sparkles class="w-3 h-3" />
              <span>Fishcatch AI Auto-Reply</span>
            </div>

            <!-- Media Attachments in Message Bubble -->
            <div v-if="msg.mediaUrl" class="mb-2 overflow-hidden rounded-xl">
              <!-- Image Attachment -->
              <div
                v-if="msg.type === 'image' || msg.mediaType?.startsWith('image/')"
                class="relative group cursor-pointer overflow-hidden rounded-xl bg-slate-900/10 max-h-64"
                @click="lightboxMedia = { url: msg.mediaUrl, type: 'image', filename: msg.originalFilename || 'Image' }"
              >
                <img
                  :src="msg.mediaUrl"
                  :alt="msg.originalFilename || 'WhatsApp Image'"
                  class="w-full h-auto object-cover rounded-xl group-hover:scale-105 transition-transform duration-200"
                />
                <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Maximize2 class="w-5 h-5" />
                </div>
              </div>

              <!-- Audio / Voice Note Attachment -->
              <div
                v-else-if="msg.type === 'audio' || msg.mediaType?.startsWith('audio/')"
                class="p-2.5 rounded-xl flex items-center gap-2.5"
                :class="msg.from === 'agent' ? 'bg-emerald-700/60' : 'bg-slate-100'"
              >
                <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" :class="msg.from === 'agent' ? 'bg-emerald-500 text-white' : 'bg-emerald-600 text-white'">
                  <Music class="w-4 h-4" />
                </div>
                <audio controls :src="msg.mediaUrl" class="h-8 max-w-[200px] sm:max-w-xs scale-90" />
              </div>

              <!-- Video Attachment -->
              <div
                v-else-if="msg.type === 'video' || msg.mediaType?.startsWith('video/')"
                class="rounded-xl overflow-hidden bg-slate-950"
              >
                <video controls :src="msg.mediaUrl" class="max-h-60 w-full rounded-xl" />
              </div>

              <!-- Document / PDF Attachment -->
              <div
                v-else
                class="p-2.5 rounded-xl flex items-center justify-between gap-3 border"
                :class="msg.from === 'agent' ? 'bg-emerald-700/50 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'"
              >
                <div class="flex items-center gap-2 truncate">
                  <FileText class="w-4 h-4 shrink-0 text-emerald-400" />
                  <span class="truncate font-semibold text-[11px]">{{ msg.originalFilename || 'Document attachment' }}</span>
                </div>
                <a
                  :href="msg.mediaUrl"
                  :download="msg.originalFilename || 'document'"
                  target="_blank"
                  class="p-1 rounded hover:bg-black/10 transition-colors shrink-0"
                  title="Download attachment"
                >
                  <Download class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <!-- Message Text -->
            <p v-if="msg.text" class="whitespace-pre-wrap select-text">{{ msg.text }}</p>

            <!-- Metadata footer -->
            <div
              class="flex items-center justify-end gap-1 text-[9px] mt-1 font-medium"
              :class="msg.from === 'agent' ? 'text-emerald-100' : 'text-slate-400'"
            >
              <span>{{ new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
              <span v-if="msg.from !== 'customer'">
                <CheckCheck v-if="msg.status === 'read'" class="w-3 h-3 text-cyan-300" />
                <CheckCheck v-else-if="msg.status === 'delivered'" class="w-3 h-3 text-emerald-200" />
                <Check v-else-if="msg.status === 'sent'" class="w-3 h-3 text-emerald-200" />
                <AlertCircle v-else-if="msg.status === 'failed'" class="w-3 h-3 text-rose-300" />
              </span>
            </div>
          </div>
        </div>

        <div v-if="messages.length === 0" class="text-center py-12 text-slate-400 text-xs">
          No message records in this conversation yet.
        </div>
      </div>

      <!-- Zero Selection State -->
      <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 my-auto">
        <div class="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
          <MessageSquare class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-bold text-slate-800">No conversation selected</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm">
          Select a customer conversation from the list to view real message history, generate AI replies, or dispatch WhatsApp HSM templates.
        </p>
      </div>

      <!-- Bottom Chat Composer -->
      <div v-if="activeConversation" class="p-3 bg-white border-t border-slate-200 space-y-2">
        <!-- AI Draft Assistant & Template Buttons -->
        <div class="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <button
            @click="handleGenerateDraft"
            :disabled="isGeneratingDraft"
            class="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Sparkles class="w-3.5 h-3.5 text-emerald-600" />
            <span>{{ isGeneratingDraft ? 'Generating...' : 'Gemini AI Draft' }}</span>
          </button>

          <button
            @click="openTemplateModal"
            class="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>HSM Templates</span>
          </button>
        </div>

        <!-- Staged File Attachment Chip -->
        <div
          v-if="stagedFile"
          class="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs"
        >
          <div class="flex items-center gap-2 truncate">
            <UploadCloud class="w-4 h-4 text-emerald-600 shrink-0" />
            <span class="font-bold text-slate-800 truncate">{{ stagedFile.name }}</span>
            <span class="text-[10px] text-slate-500">({{ Math.round(stagedFile.size / 1024) }} KB)</span>
          </div>
          <button
            @click="handleRemoveStagedFile"
            class="p-1 text-slate-400 hover:text-rose-600 rounded"
            title="Remove attachment"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Input Box -->
        <div class="flex items-center gap-2">
          <!-- Hidden File Input -->
          <input
            type="file"
            ref="fileInputRef"
            class="hidden"
            @change="handleAttachmentSelect"
          />

          <!-- Attachment Trigger Button -->
          <button
            @click="fileInputRef?.click()"
            class="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
            title="Attach file or media"
          >
            <Paperclip class="w-4 h-4" />
          </button>

          <input
            v-model="messageInput"
            @keydown.enter="handleSendMessage"
            type="text"
            placeholder="Type your WhatsApp reply or attach media..."
            class="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 placeholder-slate-400"
          />
          <button
            @click="handleSendMessage"
            :disabled="(!messageInput.trim() && !stagedFile) || isSending"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <Send class="w-3.5 h-3.5" />
            <span>{{ isSending ? 'Sending...' : 'Send' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Right Pane: Customer CRM & Lead Sidebar (Desktop + Mobile drawer toggle) -->
    <div
      v-if="activeConversation"
      class="border-l border-slate-200 bg-white p-5 space-y-6 overflow-y-auto shrink-0 z-20 transition-all"
      :class="
        showMobileDetails
          ? 'fixed inset-y-0 right-0 w-80 shadow-2xl block'
          : 'hidden lg:block w-72'
      "
    >
      <div v-if="showMobileDetails" class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 lg:hidden">
        <span class="text-xs font-bold text-slate-800">Customer Details</span>
        <button @click="showMobileDetails = false" class="text-slate-400 text-sm">✕</button>
      </div>

      <!-- Contact Overview -->
      <div>
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
          Customer Profile
        </div>
        <div class="space-y-2">
          <div class="text-sm font-bold text-slate-900">{{ activeConversation.customerName }}</div>
          <div class="text-xs text-slate-600 flex items-center gap-1.5">
            <Phone class="w-3.5 h-3.5 text-slate-400" />
            <span>{{ activeConversation.customerPhone }}</span>
          </div>
          <div v-if="activeCustomer?.email" class="text-xs text-slate-600 flex items-center gap-1.5">
            <Mail class="w-3.5 h-3.5 text-slate-400" />
            <span>{{ activeCustomer.email }}</span>
          </div>
        </div>
      </div>

      <!-- Lead Stage Status -->
      <div v-if="activeLead">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Lead Pipeline Stage
        </div>
        <select
          :value="activeLead.status"
          @change="(e: any) => handleUpdateLeadStatus(e.target.value)"
          class="w-full px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="NEW">NEW LEAD</option>
          <option value="QUALIFIED">QUALIFIED</option>
          <option value="CONTACTED">CONTACTED</option>
          <option value="CONVERTED">CONVERTED</option>
          <option value="LOST">LOST</option>
        </select>
        <p class="text-[11px] text-slate-500 mt-1.5 leading-snug">
          {{ activeLead.qualificationSummary || 'Inbound inquiry via WhatsApp' }}
        </p>
      </div>

      <!-- Opt-In / Safety Status -->
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          WhatsApp Opt-In State
        </div>
        <div class="text-xs font-bold" :class="activeCustomer?.optInStatus === 'opted_out' ? 'text-rose-600' : 'text-emerald-700'">
          {{ activeCustomer?.optInStatus === 'opted_out' ? 'Customer Opted Out (STOP)' : 'Active Customer Opt-In' }}
        </div>
        <p class="text-[10px] text-slate-400 leading-snug">
          {{ activeCustomer?.optInStatus === 'opted_out' ? 'Automated AI replies and promotional broadcasts are blocked.' : 'Can receive AI responses & HSM templates.' }}
        </p>
      </div>
    </div>

    <!-- Template Picker Modal -->
    <div v-if="showTemplateModal" class="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
      <div class="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-900">Send WhatsApp HSM Template</h3>
          <button @click="showTemplateModal = false" class="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>

        <div v-if="templates.length === 0" class="text-center py-6 text-xs text-slate-500">
          No templates found. Create HSM templates in the Templates tab.
        </div>

        <div v-else class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Select Template</label>
            <select
              v-model="selectedTemplate"
              class="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option v-for="tpl in templates" :key="tpl.id" :value="tpl">
                {{ tpl.name }} ({{ tpl.category }})
              </option>
            </select>
          </div>

          <div v-if="selectedTemplate" class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap font-mono">
            {{ selectedTemplate.body }}
          </div>

          <!-- Parameter inputs if placeholders present -->
          <div v-if="selectedTemplate && selectedTemplate.body.includes('{{1}}')" class="space-y-2">
            <label class="block text-xs font-semibold text-slate-700">Template Variables</label>
            <input
              v-model="templateParamValues[0]"
              type="text"
              placeholder="Value for {{1}} (e.g. Customer Name)"
              class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
            />
            <input
              v-if="selectedTemplate.body.includes('{{2}}')"
              v-model="templateParamValues[1]"
              type="text"
              placeholder="Value for {{2}} (e.g. Order ID / Time)"
              class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showTemplateModal = false"
            class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            Cancel
          </button>
          <button
            @click="handleSendTemplate"
            :disabled="!selectedTemplate || isSending"
            class="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Dispatch Template
          </button>
        </div>
      </div>
    </div>

    <!-- Media Lightbox Modal -->
    <div
      v-if="lightboxMedia"
      class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
      @click="lightboxMedia = null"
    >
      <div class="relative max-w-4xl max-h-[90vh] flex flex-col items-center" @click.stop>
        <button
          @click="lightboxMedia = null"
          class="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full"
        >
          <X class="w-5 h-5" />
        </button>

        <img
          v-if="lightboxMedia.type === 'image'"
          :src="lightboxMedia.url"
          :alt="lightboxMedia.filename || 'Preview'"
          class="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
        />

        <div class="mt-3 flex items-center gap-3 text-white text-xs font-semibold">
          <a
            :href="lightboxMedia.url"
            :download="lightboxMedia.filename || 'media'"
            target="_blank"
            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-xs"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Download High-Res</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
