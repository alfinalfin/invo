<script setup lang="ts">
import { ref, watch } from 'vue';
import { 
  X, FileUp, FileSpreadsheet, FileText, 
  CheckCircle2, AlertCircle, Loader2, 
  ChevronRight, UploadCloud, Info
} from 'lucide-vue-next';
import { useFirebaseServices } from '~/composables/useFirebaseServices';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'imported']);

const isDragging = ref(false);
const file = ref<File | null>(null);
const isUploading = ref(false);
const uploadStatus = ref<'idle' | 'parsing' | 'success' | 'error'>('idle');
const errorMessage = ref('');
const importedCount = ref(0);
const previewLeads = ref<any[]>([]);

function close() {
  if (isUploading.value) return;
  emit('update:modelValue', false);
  // Reset after transition
  setTimeout(reset, 300);
}

function reset() {
  file.value = null;
  uploadStatus.value = 'idle';
  errorMessage.value = '';
  importedCount.value = 0;
  previewLeads.value = [];
}

function handleFileDrop(e: DragEvent) {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files?.length) handleFile(files[0]);
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.length) handleFile(target.files[0]);
}

function handleFile(selectedFile: File) {
  const ext = selectedFile.name.split('.').pop()?.toLowerCase();
  if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
    uploadStatus.value = 'error';
    errorMessage.value = "Invalid file type. Please upload a .csv or .xlsx file.";
    return;
  }
  
  file.value = selectedFile;
  uploadStatus.value = 'idle';
  errorMessage.value = '';
}

async function startImport() {
  if (!file.value) return;
  
  isUploading.value = true;
  uploadStatus.value = 'parsing';
  
  const formData = new FormData();
  formData.append('file', file.value);
  
  try {
    const config = useRuntimeConfig();
    const apiEndpoint = `${config.public.apiBase || 'http://129.154.254.139'}/api/import-leads`;

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
      // Pass the user ID if available, or empty (backend will handle it)
      headers: {
        'x-user-id': 'local-dev-user-123'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to import leads");
    }
    
    uploadStatus.value = 'success';
    importedCount.value = data.count;
    previewLeads.value = data.leads || [];
    
    emit('imported');
  } catch (err: any) {
    uploadStatus.value = 'error';
    errorMessage.value = err.message || "An unexpected error occurred during import.";
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[200] flex items-center justify-center p-4 font-body">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-surface-contrast/30 dark:bg-black/80 backdrop-blur-md" @click="close" />
    
    <!-- Modal Container -->
    <div 
      class="bg-surface relative w-full max-w-[540px] overflow-hidden rounded-[32px] shadow-2xl border border-outline-variant/20 transition-all duration-500 scale-100"
      style="animation: modal-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1);"
    >
      <!-- Header -->
      <div class="px-8 pt-8 pb-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <FileUp class="h-6 w-6" />
          </div>
          <div>
            <h2 class="text-xl font-black text-on-surface">Import Leads</h2>
            <p class="text-[12px] text-outline font-bold uppercase tracking-wider mt-1 opacity-70">CSV or Excel Ingestion</p>
          </div>
        </div>
        <button @click="close" class="p-2 rounded-full hover:bg-surface-variant transition-colors">
          <X class="h-5 w-5 text-outline" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-8 pt-4">
        
        <!-- STEP 1: Upload / Idle -->
        <div v-if="uploadStatus === 'idle' || uploadStatus === 'parsing' || uploadStatus === 'error'" class="space-y-6">
          
          <div 
            v-if="!file"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
            class="relative border-2 border-dashed rounded-[24px] p-12 flex flex-col items-center justify-center text-center transition-all group"
            :class="isDragging ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:border-primary/50 hover:bg-surface-container-low'"
          >
            <input type="file" @change="handleFileInput" class="absolute inset-0 opacity-0 cursor-pointer" accept=".csv,.xlsx,.xls" />
            
            <div class="w-16 h-16 rounded-3xl bg-surface-variant flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <UploadCloud class="h-8 w-8 text-outline group-hover:text-primary transition-colors" />
            </div>
            
            <h3 class="text-lg font-bold text-on-surface">Drop your spreadsheet here</h3>
            <p class="text-sm text-outline font-medium mt-2">or <span class="text-primary font-bold">click to browse</span></p>
            <p class="text-[11px] text-outline/60 mt-4 font-bold uppercase tracking-widest">Supports CSV, XLSX, XLS</p>
          </div>

          <!-- File Selected Card -->
          <div v-else class="surface-card p-5 border border-primary/20 bg-primary/5 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <FileSpreadsheet v-if="file.name.includes('xls')" class="h-6 w-6" />
              <FileText v-else class="h-6 w-6" />
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-black text-on-surface truncate">{{ file.name }}</p>
              <p class="text-[11px] text-outline font-bold">{{ (file.size / 1024).toFixed(1) }} KB</p>
            </div>
            <button v-if="!isUploading" @click="file = null" class="p-2 text-outline hover:text-red-500 transition-colors">
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Instruction / Format Help -->
          <div class="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 flex gap-3">
            <Info class="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p class="text-xs text-outline font-medium leading-relaxed">
              Ensure your file contains columns for <span class="text-on-surface font-bold">Company Name</span>, <span class="text-on-surface font-bold">Email</span>, and <span class="text-on-surface font-bold">Phone</span>. We will automatically map matching fields.
            </p>
          </div>

          <!-- Error Alert -->
          <div v-if="uploadStatus === 'error'" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle class="h-5 w-5 text-red-500 grow-0" />
            <p class="text-xs font-bold text-red-600 dark:text-red-400 leading-tight">{{ errorMessage }}</p>
          </div>

          <!-- Action Button -->
          <button 
            v-if="file"
            @click="startImport"
            :disabled="isUploading"
            class="w-full py-4 rounded-2xl bg-on-surface text-surface font-black text-[15px] flex items-center justify-center gap-3 shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
          >
            <template v-if="isUploading">
              <Loader2 class="h-5 w-5 animate-spin" />
              <span>Ingesting Records...</span>
            </template>
            <template v-else>
              <span>Launch Import</span>
              <ChevronRight class="h-5 w-5" stroke-width="3" />
            </template>
          </button>
        </div>

        <!-- STEP 2: Success -->
        <div v-else-if="uploadStatus === 'success'" class="text-center py-6 space-y-6">
          <div class="flex justify-center">
            <div class="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
              <div class="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse rounded-full"></div>
              <CheckCircle2 class="h-10 w-10 text-emerald-500 relative z-10" stroke-width="3" />
            </div>
          </div>
          
          <div>
            <h3 class="text-2xl font-black text-on-surface">Import Complete</h3>
            <p class="text-sm text-outline font-semibold mt-2">
              <span class="text-emerald-500 font-black text-lg">{{ importedCount }}</span> leads have been added to your pipeline.
            </p>
          </div>

          <!-- Mini Preview -->
          <div class="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl overflow-hidden text-left max-h-48 overflow-y-auto no-scrollbar">
            <div v-for="(lead, idx) in previewLeads" :key="idx" class="p-3 border-b border-outline-variant/10 flex items-center justify-between gap-4 last:border-0">
              <div class="flex-1 overflow-hidden">
                <p class="text-[13px] font-black text-on-surface truncate">{{ lead.company }}</p>
                <p class="text-[11px] text-outline font-medium truncate">{{ lead.email || 'No email' }}</p>
              </div>
              <div class="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">New</div>
            </div>
          </div>

          <button 
            @click="close"
            class="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-[15px] shadow-lg shadow-emerald-500/20 hover:-translate-y-1 transition-all"
          >
            View Leads
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes modal-pop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
