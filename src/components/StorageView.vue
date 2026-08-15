<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { StoredFileMetadata, StorageOverview, StorageCategory } from '../types';
import { api } from '../services/api';
import {
  HardDrive,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  File,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
  Layers,
  FileCheck,
  Grid,
  List,
  X,
  Plus,
} from 'lucide-vue-next';

const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const overview = ref<StorageOverview | null>(null);
const files = ref<StoredFileMetadata[]>([]);
const isLoading = ref(true);
const selectedCategory = ref<string>('all');
const searchQuery = ref('');
const viewMode = ref<'grid' | 'table'>('grid');

// Upload Modal State
const showUploadModal = ref(false);
const uploadCategory = ref<StorageCategory>('knowledge');
const uploadDescription = ref('');
const selectedFile = ref<File | null>(null);
const uploadProgress = ref(0);
const isUploading = ref(false);
const uploadError = ref('');
const isDragging = ref(false);

// Inspector Modal (Knowledge Extracted Text & Lightbox)
const inspectingFile = ref<StoredFileMetadata | null>(null);
const isReindexing = ref(false);
const reindexMessage = ref('');

// Delete Confirmation
const deletingFile = ref<StoredFileMetadata | null>(null);
const isDeleting = ref(false);

const loadStorageData = async () => {
  try {
    isLoading.value = true;
    const [ov, fileList] = await Promise.all([
      api.getStorageOverview(),
      api.getStorageFiles({
        category: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
        search: searchQuery.value.trim() || undefined,
      }),
    ]);
    overview.value = ov;
    files.value = fileList;
  } catch (err: any) {
    console.error('Failed to load storage overview:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadStorageData();
});

watch([selectedCategory, searchQuery], () => {
  loadStorageData();
});

const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
    uploadError.value = '';
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    selectedFile.value = e.dataTransfer.files[0];
    uploadError.value = '';
  }
};

const handleUploadSubmit = async () => {
  if (!selectedFile.value || isUploading.value) return;
  isUploading.value = true;
  uploadProgress.value = 10;
  uploadError.value = '';

  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('category', uploadCategory.value);
  formData.append('description', uploadDescription.value);
  formData.append('uploadedBy', 'agent');

  try {
    const res = await api.uploadFile(formData, (percent) => {
      uploadProgress.value = Math.max(15, percent);
    });

    showUploadModal.value = false;
    selectedFile.value = null;
    uploadDescription.value = '';
    uploadProgress.value = 0;
    await loadStorageData();
    emit('refresh');
  } catch (err: any) {
    uploadError.value = err.response?.data?.error?.message || err.message || 'Upload failed.';
  } finally {
    isUploading.value = false;
  }
};

const handleDeleteConfirm = async () => {
  if (!deletingFile.value || isDeleting.value) return;
  isDeleting.value = true;
  try {
    await api.deleteFile(deletingFile.value.id);
    deletingFile.value = null;
    await loadStorageData();
    emit('refresh');
  } catch (err: any) {
    alert(err.response?.data?.error?.message || 'Delete failed');
  } finally {
    isDeleting.value = false;
  }
};

const handleReindex = async (file: StoredFileMetadata) => {
  isReindexing.value = true;
  reindexMessage.value = '';
  try {
    const res = await api.reindexKnowledgeFile(file.id);
    reindexMessage.value = res.message;
    file.extractedText = res.extractedPreview;
    await loadStorageData();
    emit('refresh');
  } catch (err: any) {
    reindexMessage.value = 'Failed: ' + (err.response?.data?.error?.message || err.message);
  } finally {
    isReindexing.value = false;
  }
};

const getFileIcon = (file: StoredFileMetadata) => {
  const mime = file.mimeType.toLowerCase();
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime.startsWith('audio/')) return Music;
  if (mime.startsWith('video/')) return Video;
  if (mime.includes('pdf') || mime.includes('text') || mime.includes('document')) return FileText;
  return File;
};
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Header & Storage Backend Status -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
      <div class="space-y-1">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <HardDrive class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Cloud Storage & Media</span>
              <span
                class="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border"
                :class="
                  overview?.firebaseConfigured
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                "
              >
                {{ overview?.firebaseConfigured ? 'Firebase Cloud Storage' : 'Tenant Storage' }}
              </span>
            </h1>
            <p class="text-xs text-slate-500">
              Centralized, multi-tenant asset storage for WhatsApp media and Gemini AI grounding documents.
            </p>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          @click="loadStorageData"
          :disabled="isLoading"
          class="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
          title="Refresh storage"
        >
          <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
        </button>

        <button
          @click="showUploadModal = true"
          class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2"
        >
          <UploadCloud class="w-4 h-4" />
          <span>Upload File</span>
        </button>
      </div>
    </div>

    <!-- Storage Metrics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-[11px] font-medium uppercase tracking-wider">Total Storage</span>
          <HardDrive class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-xl font-extrabold text-slate-900">
          {{ overview?.formattedTotalSize || '0 B' }}
        </div>
        <div class="text-[11px] text-slate-400">
          {{ overview?.totalFiles || 0 }} files in bucket
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-[11px] font-medium uppercase tracking-wider">AI Knowledge Docs</span>
          <Sparkles class="w-4 h-4 text-emerald-600" />
        </div>
        <div class="text-xl font-extrabold text-slate-900">
          {{ overview?.categoryCounts?.['knowledge'] || 0 }}
        </div>
        <div class="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
          <Bot class="w-3 h-3" />
          <span>Grounding Gemini AI</span>
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-[11px] font-medium uppercase tracking-wider">WhatsApp Media</span>
          <ImageIcon class="w-4 h-4 text-cyan-600" />
        </div>
        <div class="text-xl font-extrabold text-slate-900">
          {{ overview?.categoryCounts?.['whatsapp-media'] || 0 }}
        </div>
        <div class="text-[11px] text-slate-400">
          Inbound photos, voice & files
        </div>
      </div>

      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
        <div class="flex items-center justify-between text-slate-400">
          <span class="text-[11px] font-medium uppercase tracking-wider">Storage Target</span>
          <Layers class="w-4 h-4 text-slate-600" />
        </div>
        <div class="text-xs font-bold text-slate-900 truncate" :title="overview?.storageBucket">
          {{ overview?.storageBucket || 'Local Isolated Storage' }}
        </div>
        <div class="text-[11px] text-slate-400">
          Multi-tenant isolated
        </div>
      </div>
    </div>

    <!-- Filter Bar & Search Controls -->
    <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      <!-- Category Tabs -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <button
          v-for="tab in [
            { id: 'all', label: 'All Files' },
            { id: 'knowledge', label: 'AI Knowledge Docs' },
            { id: 'whatsapp-media', label: 'WhatsApp Media' },
            { id: 'documents', label: 'Documents' },
            { id: 'profile', label: 'Logos & Profile' },
          ]"
          :key="tab.id"
          @click="selectedCategory = tab.id"
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          :class="
            selectedCategory === tab.id
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          "
        >
          {{ tab.label }}
          <span
            v-if="overview?.categoryCounts?.[tab.id] !== undefined"
            class="ml-1 px-1.5 py-0.2 text-[10px] rounded-full"
            :class="selectedCategory === tab.id ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'"
          >
            {{ overview.categoryCounts[tab.id] }}
          </span>
        </button>
      </div>

      <!-- Search & Layout Toggle -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 md:w-64">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search filename or text..."
            class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
          />
        </div>

        <div class="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
          <button
            @click="viewMode = 'grid'"
            class="p-1.5 rounded-md transition-colors"
            :class="viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'"
          >
            <Grid class="w-4 h-4" />
          </button>
          <button
            @click="viewMode = 'table'"
            class="p-1.5 rounded-md transition-colors"
            :class="viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'"
          >
            <List class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Files Container -->
    <div v-if="isLoading && files.length === 0" class="py-16 text-center text-slate-400 text-xs">
      <RefreshCw class="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
      <span>Loading workspace storage...</span>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="files.length === 0"
      class="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3"
    >
      <div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
        <UploadCloud class="w-6 h-6" />
      </div>
      <div class="space-y-1 max-w-sm mx-auto">
        <h3 class="text-sm font-bold text-slate-800">No files found</h3>
        <p class="text-xs text-slate-500">
          Upload PDF manuals, pricing guides, or product FAQs to ground the Gemini AI agent, or receive WhatsApp media from customers.
        </p>
      </div>
      <button
        @click="showUploadModal = true"
        class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
      >
        <Plus class="w-4 h-4" />
        <span>Upload First File</span>
      </button>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="file in files"
        :key="file.id"
        class="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
      >
        <!-- Preview / Header Area -->
        <div class="h-36 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
          <!-- Image preview -->
          <img
            v-if="file.mimeType.startsWith('image/')"
            :src="file.fileUrl"
            :alt="file.originalFilename"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <!-- Audio preview badge -->
          <div v-else-if="file.mimeType.startsWith('audio/')" class="flex flex-col items-center gap-2 p-3 text-center">
            <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Music class="w-5 h-5" />
            </div>
            <audio controls :src="file.fileUrl" class="w-48 h-8 scale-90" />
          </div>

          <!-- Video preview badge -->
          <div v-else-if="file.mimeType.startsWith('video/')" class="flex flex-col items-center gap-2">
            <div class="w-12 h-12 rounded-full bg-slate-900/80 text-white flex items-center justify-center shadow-lg">
              <Video class="w-6 h-6" />
            </div>
          </div>

          <!-- Document / PDF icon -->
          <div v-else class="flex flex-col items-center gap-2 p-4 text-center">
            <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
              <FileText class="w-6 h-6 text-emerald-700" />
            </div>
            <span class="text-[10px] font-mono text-slate-400 uppercase">{{ file.mimeType.split('/')[1] || 'FILE' }}</span>
          </div>

          <!-- Category Pill -->
          <span
            class="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-700 border border-slate-200 shadow-2xs"
          >
            {{ file.category }}
          </span>

          <!-- Grounded Pill -->
          <span
            v-if="file.extractedText"
            class="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white shadow-2xs flex items-center gap-1"
            title="Grounded in Gemini AI Agent"
          >
            <Sparkles class="w-2.5 h-2.5" />
            <span>AI Grounded</span>
          </span>
        </div>

        <!-- Metadata Body -->
        <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2">
          <div>
            <h4 class="text-xs font-bold text-slate-900 truncate" :title="file.originalFilename">
              {{ file.originalFilename }}
            </h4>
            <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
              <span>{{ formatBytes(file.fileSize) }}</span>
              <span>{{ new Date(file.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <!-- Extracted Text Snippet if Knowledge Doc -->
          <div
            v-if="file.extractedText"
            class="p-2 bg-emerald-50/70 border border-emerald-100 rounded-lg text-[10px] text-emerald-950 line-clamp-2 cursor-pointer hover:bg-emerald-100 transition-colors"
            @click="inspectingFile = file"
          >
            <span class="font-bold">Knowledge: </span>
            {{ file.extractedText }}
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
            <div class="flex items-center gap-1">
              <!-- View / Inspect Modal -->
              <button
                @click="inspectingFile = file"
                class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Preview & Details"
              >
                <Eye class="w-3.5 h-3.5" />
              </button>

              <!-- Download -->
              <a
                :href="file.fileUrl"
                :download="file.originalFilename"
                target="_blank"
                class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Download file"
              >
                <Download class="w-3.5 h-3.5" />
              </a>

              <!-- Reindex if Knowledge -->
              <button
                v-if="file.category === 'knowledge' || file.mimeType.includes('pdf') || file.mimeType.includes('text')"
                @click="handleReindex(file)"
                :disabled="isReindexing"
                class="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Re-index for Gemini AI"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isReindexing }" />
              </button>
            </div>

            <!-- Delete -->
            <button
              @click="deletingFile = file"
              class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete File"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Table View -->
    <div v-else class="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
          <tr>
            <th class="py-3 px-4">Filename</th>
            <th class="py-3 px-4">Category</th>
            <th class="py-3 px-4">Size</th>
            <th class="py-3 px-4">AI Grounding</th>
            <th class="py-3 px-4">Uploaded</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="file in files" :key="file.id" class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-4">
              <div class="flex items-center gap-2.5">
                <component :is="getFileIcon(file)" class="w-4 h-4 text-emerald-700 shrink-0" />
                <span class="font-bold text-slate-900 truncate max-w-xs" :title="file.originalFilename">
                  {{ file.originalFilename }}
                </span>
              </div>
            </td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded border border-slate-200">
                {{ file.category }}
              </span>
            </td>
            <td class="py-3 px-4 text-slate-500">
              {{ formatBytes(file.fileSize) }}
            </td>
            <td class="py-3 px-4">
              <span
                v-if="file.extractedText"
                class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer"
                @click="inspectingFile = file"
              >
                <Sparkles class="w-3 h-3" />
                <span>{{ file.extractedText.length }} chars</span>
              </span>
              <span v-else class="text-slate-400 text-[11px]">—</span>
            </td>
            <td class="py-3 px-4 text-slate-500 text-[11px]">
              {{ new Date(file.createdAt).toLocaleDateString() }}
            </td>
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button
                  @click="inspectingFile = file"
                  class="p-1 text-slate-500 hover:text-slate-900 rounded"
                  title="Inspect"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <a
                  :href="file.fileUrl"
                  :download="file.originalFilename"
                  target="_blank"
                  class="p-1 text-slate-500 hover:text-slate-900 rounded"
                  title="Download"
                >
                  <Download class="w-4 h-4" />
                </a>
                <button
                  @click="deletingFile = file"
                  class="p-1 text-rose-500 hover:text-rose-700 rounded"
                  title="Delete"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Upload Modal -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UploadCloud class="w-4 h-4" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900">Upload to Cloud Storage</h3>
              <p class="text-[11px] text-slate-500">Multi-tenant Firebase Storage pipeline</p>
            </div>
          </div>
          <button @click="showUploadModal = false" class="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Drag & Drop Zone -->
        <div
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          class="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer"
          :class="
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50'
              : selectedFile
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          "
        >
          <input
            type="file"
            id="fileUploadInput"
            class="hidden"
            @change="handleFileSelect"
          />
          <label for="fileUploadInput" class="cursor-pointer block space-y-2">
            <div class="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
              <UploadCloud class="w-5 h-5 text-emerald-600" />
            </div>
            <div v-if="selectedFile">
              <span class="text-xs font-bold text-slate-900">{{ selectedFile.name }}</span>
              <span class="text-[11px] text-slate-500 block">{{ formatBytes(selectedFile.size) }}</span>
            </div>
            <div v-else>
              <span class="text-xs font-bold text-slate-800">Click to browse or drag file here</span>
              <p class="text-[11px] text-slate-400">PDF, DOCX, TXT, CSV, PNG, JPG, MP3, MP4 (Max 30MB)</p>
            </div>
          </label>
        </div>

        <!-- Category & Options -->
        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Target Category</label>
            <select
              v-model="uploadCategory"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="knowledge">AI Knowledge Document (Auto-ground Gemini Agent)</option>
              <option value="whatsapp-media">WhatsApp Media Asset</option>
              <option value="documents">General Document / Proposal</option>
              <option value="profile">Profile & Brand Logo</option>
              <option value="customer">Customer Attachment</option>
            </select>
            <p v-if="uploadCategory === 'knowledge'" class="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
              <Sparkles class="w-3 h-3" />
              <span>Text will be extracted automatically and injected into the Gemini AI system prompt.</span>
            </p>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Notes / Description (Optional)</label>
            <input
              v-model="uploadDescription"
              type="text"
              placeholder="e.g., 2026 Product Catalog & Pricing"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <!-- Progress bar -->
        <div v-if="isUploading" class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px] font-semibold text-slate-700">
            <span>Uploading to Firebase Cloud Storage...</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              class="bg-emerald-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>

        <!-- Error Alert -->
        <div v-if="uploadError" class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ uploadError }}</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            @click="showUploadModal = false"
            :disabled="isUploading"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleUploadSubmit"
            :disabled="!selectedFile || isUploading"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <UploadCloud class="w-4 h-4" />
            <span>{{ isUploading ? 'Uploading...' : 'Confirm Upload' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Inspector / Knowledge Grounding Lightbox Modal -->
    <div
      v-if="inspectingFile"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl border border-slate-200 space-y-4 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div class="flex items-center gap-2.5 truncate">
            <component :is="getFileIcon(inspectingFile)" class="w-5 h-5 text-emerald-700 shrink-0" />
            <div class="truncate">
              <h3 class="text-sm font-bold text-slate-900 truncate">{{ inspectingFile.originalFilename }}</h3>
              <p class="text-[11px] text-slate-500">
                {{ formatBytes(inspectingFile.fileSize) }} • {{ inspectingFile.mimeType }}
              </p>
            </div>
          </div>
          <button @click="inspectingFile = null" class="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Content Area -->
        <div class="flex-1 overflow-y-auto space-y-4">
          <!-- Image preview -->
          <div v-if="inspectingFile.mimeType.startsWith('image/')" class="text-center bg-slate-900 rounded-xl p-4">
            <img :src="inspectingFile.fileUrl" class="max-h-80 mx-auto object-contain rounded-lg" />
          </div>

          <!-- Audio preview -->
          <div v-else-if="inspectingFile.mimeType.startsWith('audio/')" class="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
            <Music class="w-10 h-10 text-emerald-600 mx-auto" />
            <audio controls :src="inspectingFile.fileUrl" class="w-full" />
          </div>

          <!-- Video preview -->
          <div v-else-if="inspectingFile.mimeType.startsWith('video/')" class="bg-slate-900 rounded-xl p-2">
            <video controls :src="inspectingFile.fileUrl" class="w-full max-h-80 rounded-lg" />
          </div>

          <!-- AI Grounding Extracted Knowledge Section -->
          <div v-if="inspectingFile.extractedText" class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Sparkles class="w-4 h-4 text-emerald-600" />
                <span>Extracted Knowledge Base Grounding</span>
              </div>
              <button
                @click="handleReindex(inspectingFile)"
                :disabled="isReindexing"
                class="px-2.5 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <RefreshCw class="w-3 h-3" :class="{ 'animate-spin': isReindexing }" />
                <span>Re-extract</span>
              </button>
            </div>

            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {{ inspectingFile.extractedText }}
            </div>

            <div v-if="reindexMessage" class="text-[11px] text-emerald-700 font-medium">
              {{ reindexMessage }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div class="text-[11px] text-slate-400">
            Path: <span class="font-mono">{{ inspectingFile.storagePath }}</span>
          </div>
          <div class="flex items-center gap-2">
            <a
              :href="inspectingFile.fileUrl"
              :download="inspectingFile.originalFilename"
              target="_blank"
              class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Download class="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
            <button
              @click="inspectingFile = null"
              class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="deletingFile"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
        <div class="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <Trash2 class="w-5 h-5" />
        </div>
        <div class="text-center space-y-1">
          <h3 class="text-sm font-bold text-slate-900">Delete File?</h3>
          <p class="text-xs text-slate-500">
            Are you sure you want to delete <span class="font-semibold text-slate-800">"{{ deletingFile.originalFilename }}"</span> from Cloud Storage?
          </p>
        </div>
        <div class="flex items-center justify-center gap-2 pt-2">
          <button
            @click="deletingFile = null"
            class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleDeleteConfirm"
            :disabled="isDeleting"
            class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50"
          >
            {{ isDeleting ? 'Deleting...' : 'Yes, Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
