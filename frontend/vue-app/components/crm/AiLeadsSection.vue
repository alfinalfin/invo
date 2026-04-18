<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Bot, Mail, Phone, Filter, Search, Sparkles, MapPin, BadgeCheck, X, Info, Globe, Trash2 as TrashIcon } from "lucide-vue-next";
import type { LeadRecord } from "~/lib/crm";

const props = defineProps<{
  leads?: LeadRecord[];
}>();

const emit = defineEmits<{
  (e: 'delete-lead', id: string): void;
  (e: 'wipe-all-leads', collectionName: 'ai_leads' | 'leads', ids?: string[]): void;
  (e: 'import'): void;
}>();

const route = useRoute();
const router = useRouter();

interface TimelineEvent {
  title: string;
  desc: string;
  type: "active" | "planned" | "past";
}

interface Lead {
  id: string;
  company: string;
  initials: string;
  type: string;
  location: string;
  aiScore: number;
  matchRate: number;
  status: "Hot" | "Warm" | "Cold" | "Follow-up";
  label: string;
  lastContacted: string;
  needsAction?: boolean;
  website?: string;
  email: string;
  phone: string;
  contactName?: string;
  reasoning?: string[];
  timeline?: TimelineEvent[];
  draftEmailPreview?: string;
  rawSource: string;
}

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

const SOURCE_LABELS: Record<string, string> = {
  google_maps:     "Google Maps",
  companies_house: "UK Companies House",
  yelp:            "Yelp Directory",
  "Lead Engine":   "Lead Engine",
  "Google Ads":    "Google Ads",
  "google_ads":    "Google Ads",
};

function sourceLabel(raw: string | undefined): string {
  if (!raw) return "Lead Engine";
  return SOURCE_LABELS[raw] ?? raw;
}

const localEmailDrafts = ref<Record<string, string>>({});
const localReasoning = ref<Record<string, string>>({});
const localScores = ref<Record<string, number>>({});
const localEmails = ref<Record<string, string>>({});
const localContactNames = ref<Record<string, string>>({});

const isEnriching = ref<string | null>(null);

const aiLeads = computed<Lead[]>(() => {
  if (!props.leads) return [];
  
  // Show all leads that have a company name
  return props.leads.filter(l => l.company).map(l => {
    return {
      id: l.id,
      company: l.company || "Unknown",
      initials: (l.company || "U").substring(0, 2).toUpperCase(),
      type: l.goodsDescription || sourceLabel(l.source),
      rawSource: l.source || "Lead Engine",
      location: l.pickupAddress || "Unknown",
      aiScore: localScores.value[l.id] !== undefined ? localScores.value[l.id] / 10 : (l.lead_score ? l.lead_score / 10 : Math.round((7 + Math.random() * 2.8) * 10) / 10),
      matchRate: Math.round(75 + Math.random() * 24),
      status: l.priority === 'Urgent' ? 'Hot' : l.priority === 'High priority' ? 'Warm' : 'Follow-up',
      label: l.status,
      lastContacted: l.createdAt ? timeAgo(l.createdAt) : "Just now",
      needsAction: l.status === 'New',
      website: l.website || "",
      email: localEmails.value[l.id] || l.email || "",
      phone: l.phone || "",
      contactName: localContactNames.value[l.id] || (l as any).contactName || "",
      reasoning: localReasoning.value[l.id] ? localReasoning.value[l.id].split(/[\n.]/).map(s=>s.trim()).filter(r => r.length > 5) : ((l.ai_summary || l.customerNotes) ? (l.ai_summary || l.customerNotes)!.split(/[\n.]/).map(s=>s.trim()).filter(r => r.length > 5) : [
        `${l.company || 'This company'} is a prospective lead located near ${l.pickupAddress || 'their target market'}.`,
        `Identified via ${l.source || 'automated extraction'} and marked for outbound review.`,
        `Click 'Deploy AI Agent' below to generate a deep executive brief and intelligent email draft.`
      ]),
      draftEmailPreview: localEmailDrafts.value[l.id] || ((l.draft_email || l.notes) ? (l.draft_email || l.notes)!.replace(/AI Suggested Email Draft:\n?/i, '') : ""),
      timeline: [
        { title: "Processed by AI Engine", desc: l.createdAt ? timeAgo(l.createdAt) : "Just now", type: "active" },
        { title: "Sourced via " + l.source, desc: "Automatic Extraction", type: "past" }
      ]
    }
  });
});

const activeFilter = ref<"All" | "Hot Leads" | "Follow-up">("All");
const sourceFilter = ref<"All" | "google_maps" | "google_ads" | "companies_house" | "yelp" | "crm">("All");
const selectedLeadId = ref<string | null>(null);

const sourceCounts = computed(() => {
  const counts = {
    google_maps: 0,
    google_ads: 0,
    companies_house: 0,
    yelp: 0,
    crm: 0,
    all: aiLeads.value.length
  };
  aiLeads.value.forEach(l => {
    const s = (l.rawSource || "").toLowerCase();
    if (s.includes('google maps') || (s.includes('google') && !s.includes('ad'))) counts.google_maps++;
    else if (s.includes('google ads') || s.includes('adword') || s.includes('ads')) counts.google_ads++;
    else if (s.includes('company') || s.includes('house')) counts.companies_house++;
    else if (s.includes('yelp')) counts.yelp++;
    else counts.crm++;
  });
  return counts;
});

const filteredLeads = computed(() => {
  let leads = [...aiLeads.value];

  // 1. Status Filter
  if (activeFilter.value === "Hot Leads") {
    leads = leads.filter(lead => lead.status === "Hot");
  } else if (activeFilter.value === "Follow-up") {
    leads = leads.filter(lead => lead.status === "Follow-up" || lead.status === "Warm");
  }

  // 2. Source Filter
  if (sourceFilter.value !== "All") {
    leads = leads.filter(lead => {
      const s = (lead.rawSource || "").toLowerCase();
      if (sourceFilter.value === 'google_maps') return s.includes('google maps') || (s.includes('google') && !s.includes('ad'));
      if (sourceFilter.value === 'google_ads') return s.includes('google ads') || s.includes('adword') || s.includes('ads');
      if (sourceFilter.value === 'companies_house') return s.includes('company') || s.includes('house');
      if (sourceFilter.value === 'yelp') return s.includes('yelp');
      if (sourceFilter.value === 'crm') return !s.includes('google') && !s.includes('house') && !s.includes('yelp');
      return true;
    });
  }

  return leads;
});

const selectedLead = computed(() => 
  aiLeads.value.find(l => l.id === selectedLeadId.value) || null
);

const stats = computed(() => {
  const total = aiLeads.value.length;
  const hot = aiLeads.value.filter(l => l.status === 'Hot').length;
  const contacted = aiLeads.value.filter(l => l.label === 'Contacted' || l.label === 'Replied').length;
  const conv = total > 0 ? ((contacted / total) * 100).toFixed(1) : "0.0";
  return { total, hot, contacted, conv };
});

const isGenerating = ref<string | null>(null);
const toastMessage = ref("");

const showWipeConfirm = ref(false);
const wipeConfirmText = ref("");
const isWiping = ref(false);

function triggerWipeAll() {
  showWipeConfirm.value = true;
  wipeConfirmText.value = "";
}

function handleWipeAll() {
  if (wipeConfirmText.value !== 'DELETE ALL') return;
  emit('wipe-all-leads', 'ai_leads');
  showWipeConfirm.value = false;
  wipeConfirmText.value = "";
}

// ── Swipe-to-Delete ───────────────────────────────────────
const swipeState   = ref<Record<string, number>>({}); // translateX per lead id
const swipeStartX  = ref(0);
const swipingId    = ref<string | null>(null);
const isDragging   = ref(false);
const pendingDeleteId = ref<string | null>(null);

const isSelectionMode = ref(false);
const selectedIds = ref(new Set<string>());
let longPressTimer: any = null;

function toggleSelectionMode() {
  isSelectionMode.value = !isSelectionMode.value;
  if (!isSelectionMode.value) selectedIds.value.clear();
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id);
  else selectedIds.value.add(id);
}

const isAllSelected = computed(() => {
  return filteredLeads.value.length > 0 && Array.from(selectedIds.value).length >= filteredLeads.value.length;
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value.clear();
  } else {
    filteredLeads.value.forEach(l => selectedIds.value.add(l.id));
  }
}

async function handleDeleteSelected() {
  if (selectedIds.value.size === 0) return;
  emit('wipe-all-leads', 'ai_leads', Array.from(selectedIds.value));
  selectedIds.value.clear();
  isSelectionMode.value = false;
  toastMessage.value = 'Selected leads removed \uD83D\uDDD1\uFE0F';
}

const SWIPE_TRIGGER = 80; // px to trigger confirm
const SWIPE_MAX     = 100;

function onPointerDown(e: PointerEvent, id: string) {
  swipeStartX.value = e.clientX;
  swipingId.value   = id;
  isDragging.value  = false;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

  // Start long press timer
  if (longPressTimer) clearTimeout(longPressTimer);
  longPressTimer = setTimeout(() => {
    if (!isDragging.value && swipingId.value === id) {
      isSelectionMode.value = true;
      toggleSelect(id);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }
  }, 600);
}

function onPointerMove(e: PointerEvent, id: string) {
  if (swipingId.value !== id) return;
  const delta = e.clientX - swipeStartX.value;
  if (Math.abs(delta) > 10) {
    isDragging.value = true;
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
  if (delta < 0) {
    swipeState.value = { ...swipeState.value, [id]: Math.max(delta, -SWIPE_MAX) };
  }
}

function onPointerUp(e: PointerEvent, id: string) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  if (swipingId.value !== id) return;
  
  const offset = swipeState.value[id] ?? 0;
  if (offset <= -SWIPE_TRIGGER) {
    swipeState.value = { ...swipeState.value, [id]: -80 };
    pendingDeleteId.value = id;
  } else {
    const s = { ...swipeState.value };
    delete s[id];
    swipeState.value = s;
  }
  swipingId.value  = null;
  isDragging.value = false;
}

function cancelSwipe(id: string) {
  const s = { ...swipeState.value };
  delete s[id];
  swipeState.value = s;
  pendingDeleteId.value = null;
}

function confirmDelete() {
  const id = pendingDeleteId.value;
  if (!id) return;
  emit('delete-lead', id);
  cancelSwipe(id);
  toastMessage.value = 'Lead deleted \uD83D\uDDD1\uFE0F';
  setTimeout(() => (toastMessage.value = ''), 3000);
}

function handleRowClick(id: string) {
  if (isDragging.value) return; // don't select while swiping
  selectLead(id);
}

async function generateOutreach(id: string, event: Event) {
  event.stopPropagation();
  isGenerating.value = id;
  
  const lead = aiLeads.value.find(l => l.id === id);
  if (!lead) {
     isGenerating.value = null;
     return;
  }
  
  try {
    const apiEndpoint = process.env.NODE_ENV === "development" 
      ? "http://localhost:5000/api/generate-email" 
      : "https://invo-bgjy.onrender.com/api/generate-email";
      
    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead: {
          company: lead.company,
          location: lead.location,
          source: lead.type
        },
        aiProvider: aiProvider.value,
        aiModel: aiModel.value
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data) {
         if (data.email) localEmailDrafts.value[id] = data.email;
         if (data.reasoning) localReasoning.value[id] = data.reasoning;
         if (data.score) localScores.value[id] = data.score;
      }
      toastMessage.value = "AI Intelligence Generated! ✨";
    } else {
      throw new Error(await res.text());
    }
  } catch(e) {
    console.error("Failed to generate outreach email", e);
    toastMessage.value = "Failed to generate email ❌";
  } finally {
    isGenerating.value = null;
    setTimeout(() => toastMessage.value = "", 3000);
  }
}

async function enrichWithAi(id: string) {
  isEnriching.value = id;
  const lead = aiLeads.value.find(l => l.id === id);
  if (!lead) {
    isEnriching.value = null;
    return;
  }

  try {
    const apiEndpoint = process.env.NODE_ENV === "development" 
      ? "http://localhost:5000/api/enrich-single-lead-ai" 
      : "https://invo-bgjy.onrender.com/api/enrich-single-lead-ai";

    const res = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead: {
          company: lead.company,
          website: lead.website,
          location: lead.location,
          id: lead.id
        },
        aiProvider: aiProvider.value,
        aiModel: aiModel.value
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.lead) {
        if (data.lead.email) localEmails.value[id] = data.lead.email;
        if (data.lead.contactName) localContactNames.value[id] = data.lead.contactName;
        toastMessage.value = "Lead Enriched! ✨";
      }
    } else {
      throw new Error(await res.text());
    }
  } catch (e) {
    console.error("Enrichment failed", e);
    toastMessage.value = "Enrichment failed ❌";
  } finally {
    isEnriching.value = null;
    setTimeout(() => toastMessage.value = "", 3000);
  }
}

function selectLead(id: string) {
  selectedLeadId.value = id;
}

// ---- AI Model Configuration ----
const { aiProvider, aiModel } = useAiConfig();

const aiProviders = [
  { id: "groq", name: "Groq", icon: "⚡" },
  { id: "openrouter", name: "OpenRouter", icon: "🌐" },
  { id: "gemini", name: "Gemini", icon: "✨" },
];

const aiModels = {
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", speed: "Very Fast", intelligence: "High", costTier: "Balanced", recommended: true },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", speed: "Maximum", intelligence: "Standard", costTier: "Cheap" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", speed: "Maximum", intelligence: "Standard", costTier: "Cheap" },
    { id: "gemma2-9b-it", name: "Gemma 2 9B", speed: "Very Fast", intelligence: "Standard", costTier: "Cheap" },
    { id: "qwen-2.5-32b", name: "Qwen 2.5 32B", speed: "Fast", intelligence: "High", costTier: "Balanced" },
    { id: "deepseek-r1-distill-llama-70b", name: "DeepSeek R1 (70B Distill)", speed: "Fast", intelligence: "Very High", costTier: "Premium" },
  ],
  openrouter: [
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", speed: "Fast", intelligence: "Maximum", costTier: "Premium", recommended: true },
    { id: "anthropic/claude-3.5-haiku", name: "Claude 3.5 Haiku", speed: "Very Fast", intelligence: "High", costTier: "Cheap" },
    { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", speed: "Standard", intelligence: "Maximum", costTier: "Premium" },
    { id: "openai/gpt-4o", name: "GPT-4o", speed: "Fast", intelligence: "Maximum", costTier: "Premium" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", speed: "Very Fast", intelligence: "High", costTier: "Cheap" },
    { id: "openai/o3-mini", name: "o3-mini", speed: "Standard", intelligence: "Very High", costTier: "Premium" },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", speed: "Very Fast", intelligence: "High", costTier: "Cheap" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", speed: "Fast", intelligence: "Maximum", costTier: "Premium" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", speed: "Very Fast", intelligence: "High", costTier: "Balanced" },
    { id: "meta-llama/llama-3.1-405b-instruct", name: "Llama 3.1 405B", speed: "Standard", intelligence: "Maximum", costTier: "Premium" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek V3", speed: "Fast", intelligence: "Very High", costTier: "Cheap" },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", speed: "Standard", intelligence: "Maximum", costTier: "Premium" },
    { id: "x-ai/grok-2-1212", name: "Grok 2", speed: "Fast", intelligence: "Very High", costTier: "Premium" }
  ],
  gemini: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", speed: "Very Fast", intelligence: "High", costTier: "Cheap", recommended: true },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", speed: "Fast", intelligence: "Maximum", costTier: "Premium" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", speed: "Very Fast", intelligence: "High", costTier: "Cheap" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", speed: "Standard", intelligence: "Very High", costTier: "Premium" },
  ],
};

function selectAiProvider(pId: string) {
  aiProvider.value = pId;
  const currModels = (aiModels as any)[pId];
  const def = currModels.find((m: any) => m.recommended) || currModels[0];
  aiModel.value = def.id;
}
</script>

<template>
  <div class="animate-in fade-in duration-500 min-h-full pb-8">
    
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
      <div>
        <h1 class="text-4xl font-extrabold tracking-tight text-on-surface mb-1">Lead Engine</h1>
        <p class="text-on-surface-variant font-medium">AI-powered freight forwarder lead management</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          v-if="selectedIds.size > 0"
          @click="handleDeleteSelected"
          class="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-500/20"
        >
          <TrashIcon class="w-4 h-4" />
          Delete Selected ({{ selectedIds.size }})
        </button>
        <button 
          @click="emit('import')"
          class="px-5 py-2.5 bg-surface-container-high text-primary font-bold rounded-xl hover:bg-surface-container-highest transition-colors flex items-center gap-2"
        >
          <Globe class="w-4 h-4" />
          Import Leads
        </button>
        <button 
          v-if="!isSelectionMode"
          @click="triggerWipeAll"
          class="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 font-bold rounded-xl hover:bg-red-500/20 transition-all flex items-center gap-2"
        >
          <TrashIcon class="w-4 h-4" />
          Clear All
        </button>
        <button 
          v-else
          @click="toggleSelectionMode"
          class="px-5 py-2.5 bg-on-surface text-surface font-black rounded-xl hover:scale-105 active:scale-95 transition-all"
        >
          Cancel Selection
        </button>
      </div>
    </div>

    <!-- AI Configuration Horizontal Bar -->
    <div class="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-sm p-6 mb-10 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between border border-outline-variant/20">
       <div class="flex-1">
         <div class="flex items-center gap-2 mb-2">
           <div class="w-1.5 h-1.5 rounded-full bg-purple-500"></div> 
           <h3 class="text-[13px] font-black tracking-wide text-on-surface uppercase">Active Intelligence Core</h3>
         </div>
         <p class="text-[12px] font-medium text-outline">Select the language model assigned for evaluating intent and composing proactive outreach templates.</p>
       </div>
       <div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <!-- Tabs -->
          <div class="flex p-1 bg-surface-container-low rounded-xl border border-outline-variant/30 flex-shrink-0">
            <button
              v-for="p in aiProviders" :key="p.id" @click="selectAiProvider(p.id)"
              class="px-4 py-2 text-[12px] font-extrabold rounded-lg flex items-center gap-2 transition-all"
              :class="aiProvider === p.id ? 'bg-white dark:bg-[#1e293b] shadow-sm text-on-surface' : 'text-outline hover:text-on-surface'"
            >
              <span>{{ p.icon }}</span> {{ p.name }}
            </button>
          </div>
          <!-- Model Select Dropdown -->
          <div class="relative w-full sm:w-[260px] flex-shrink-0">
            <select v-model="aiModel" class="w-full appearance-none rounded-xl border border-outline-variant/40 bg-surface hover:border-purple-400 py-3 px-4 pr-10 text-[13px] font-black text-on-surface outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-colors cursor-pointer shadow-sm">
              <option v-for="m in (aiModels as any)[aiProvider]" :key="m.id" :value="m.id">
                 {{ m.name }} ({{ m.speed }})
              </option>
            </select>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
               <svg class="w-4 h-4 text-outline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
       </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <div class="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm">
        <p class="text-sm font-semibold text-on-surface-variant mb-2">Total Leads</p>
        <div class="flex items-end gap-3">
          <span class="text-3xl font-black tracking-tight">{{ stats.total }}</span>
          <span class="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full mb-1">+0%</span>
        </div>
      </div>
      <div class="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm">
        <p class="text-sm font-semibold text-on-surface-variant mb-2">Hot Leads 🔥</p>
        <div class="flex items-end gap-3">
          <span class="text-3xl font-black tracking-tight text-error">{{ stats.hot }}</span>
          <span class="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full mb-1">+0%</span>
        </div>
      </div>
      <div class="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm">
        <p class="text-sm font-semibold text-on-surface-variant mb-2">Contacted 📩</p>
        <div class="flex items-end gap-3">
          <span class="text-3xl font-black tracking-tight">{{ stats.contacted }}</span>
          <span class="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full mb-1">+0%</span>
        </div>
      </div>
      <div class="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm border-l-4 border-primary">
        <p class="text-sm font-semibold text-on-surface-variant mb-2">Conversion Rate 📊</p>
        <div class="flex items-end gap-3">
          <span class="text-3xl font-black tracking-tight">{{ stats.conv }}%</span>
          <span class="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full mb-1">+0.0%</span>
        </div>
      </div>
    </div>

    <!-- Filter & Tabs -->
    <div class="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-sm p-4 mb-6">
      <div class="flex flex-col gap-3">
        <!-- Row 1: Status filters -->
        <div class="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl self-start">
          <button 
            @click="activeFilter = 'All'"
            :class="activeFilter === 'All' ? 'bg-white dark:bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'"
            class="px-4 py-1.5 text-sm font-bold rounded-lg transition-colors"
          >
            All Leads
          </button>
          <button 
            @click="activeFilter = 'Hot Leads'"
            :class="activeFilter === 'Hot Leads' ? 'bg-white dark:bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'"
            class="px-4 py-1.5 text-sm font-bold rounded-lg transition-colors"
          >
            Hot Leads 🔥
          </button>
          <button 
            @click="activeFilter = 'Follow-up'"
            :class="activeFilter === 'Follow-up' ? 'bg-white dark:bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'"
            class="px-4 py-1.5 text-sm font-bold rounded-lg transition-colors"
          >
            Follow-Up Needed ⏳
          </button>
        </div>

        <!-- Row 2: Source filters -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[11px] font-black text-outline uppercase tracking-wider">Source:</span>
          <button
            @click="sourceFilter = 'All'"
            :class="sourceFilter === 'All' ? 'bg-on-surface text-surface' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-all"
          >
            All Sources ({{ sourceCounts.all }})
          </button>
          <button
            @click="sourceFilter = 'google_ads'"
            :class="sourceFilter === 'google_ads' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 hover:bg-amber-100'"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-all"
          >
            <Bot class="w-3 h-3" />
            Google Ads ({{ sourceCounts.google_ads }})
          </button>
          <button
            @click="sourceFilter = 'companies_house'"
            :class="sourceFilter === 'companies_house' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100'"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-all"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M9 21V9l6-6 6 6v12M9 21h6"/></svg>
            UK Companies House ({{ sourceCounts.companies_house }})
          </button>
          <button
            @click="sourceFilter = 'crm'"
            :class="sourceFilter === 'crm' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 hover:bg-purple-100'"
            class="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold transition-all"
          >
            <Database class="w-3 h-3" />
            CRM Leads ({{ sourceCounts.crm }})
          </button>
        </div>
      </div>
    </div>

    <!-- Table Header -->
<div class="grid grid-cols-12 px-4 py-3 bg-surface-container border-b-0 rounded-lg text-xs font-black uppercase tracking-widest text-outline">
      <div class="col-span-1 flex items-center justify-center">
        <div 
          v-if="isSelectionMode"
          @click="toggleSelectAll"
          class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer"
          :class="isAllSelected ? 'bg-primary border-primary' : 'border-outline-variant hover:border-primary'"
        >
          <BadgeCheck v-if="isAllSelected" class="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div class="col-span-3">Company Name</div>
      <div class="col-span-3">Location</div>
      <div class="col-span-1 text-center">Score</div>
      <div class="col-span-1 text-center">Status</div>
      <div class="col-span-1 text-right truncate" title="Last Contacted">Contacted</div>
      <div class="col-span-2 text-right">Actions</div>
    </div>

    <!-- Table Rows -->
    <div class="divide-y divide-transparent overflow-hidden">
      <div
        v-for="lead in filteredLeads"
        :key="lead.id"
        class="relative mt-2 overflow-hidden rounded-xl"
      >
        <!-- Red delete backdrop (revealed on swipe) -->
        <div class="absolute inset-0 bg-gradient-to-l from-red-600 to-red-500 flex items-center justify-end pr-6 rounded-xl z-0 select-none">
          <div class="flex flex-col items-center gap-1 text-white">
            <TrashIcon class="w-6 h-6" />
            <span class="text-[10px] font-black uppercase tracking-widest">Delete</span>
          </div>
        </div>

        <!-- Swipeable foreground card -->
        <div
          class="grid grid-cols-12 px-4 py-5 items-center cursor-pointer relative z-10 bg-surface dark:bg-surface-container rounded-xl select-none group/row"
          :class="[
            selectedLeadId === lead.id ? 'border-l-4 border-primary bg-primary/5' : 'border-l-4 border-transparent hover:bg-surface-container-low',
            selectedIds.has(lead.id) ? 'bg-primary/5' : ''
          ]"
          :style="{
            transform: `translateX(${swipeState[lead.id] ?? 0}px)`,
            transition: swipingId === lead.id ? 'none' : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)'
          }"
          @pointerdown="(e) => onPointerDown(e, lead.id)"
          @pointermove="(e) => onPointerMove(e, lead.id)"
          @pointerup="(e)   => onPointerUp(e, lead.id)"
          @pointercancel="() => cancelSwipe(lead.id)"
          @click="isSelectionMode ? toggleSelect(lead.id) : handleRowClick(lead.id)"
        >
          <div class="col-span-1 flex items-center justify-center">
            <div 
              v-if="isSelectionMode"
              class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-sm"
              :class="selectedIds.has(lead.id) ? 'bg-primary border-primary scale-110' : 'border-outline-variant bg-white dark:bg-surface-container-high'"
            >
              <BadgeCheck v-if="selectedIds.has(lead.id)" class="w-4 h-4 text-white" />
            </div>
          </div>
          <div class="col-span-3 flex items-center gap-3 min-w-0 pr-4">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center font-black flex-shrink-0"
              :class="selectedLeadId === lead.id ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-secondary'"
            >
              {{ lead.initials }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 min-w-0 flex-wrap">
                <p class="font-bold text-on-surface truncate text-sm">{{ lead.company }}</p>
                <!-- Prominent Source badge next to name -->
                <span
                  class="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1 shadow-sm"
                  :class="{
                    'bg-blue-600 text-white':    lead.rawSource === 'google_maps',
                    'bg-amber-500 text-white':   lead.rawSource.toLowerCase().includes('ads'),
                    'bg-emerald-600 text-white': lead.rawSource === 'companies_house',
                    'bg-red-600 text-white':        lead.rawSource === 'yelp',
                    'bg-purple-600 text-white': !['google_maps','companies_house','yelp'].includes(lead.rawSource) && !lead.rawSource.toLowerCase().includes('ads')
                  }"
                >
                  <svg v-if="lead.rawSource === 'google_maps'" class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  <Bot v-else-if="lead.rawSource.toLowerCase().includes('ads') || lead.rawSource.toLowerCase().includes('google ads')" class="w-2.5 h-2.5" />
                  <svg v-else-if="lead.rawSource === 'companies_house'" class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M9 21V9l6-6 6 6v12M9 21h6"/></svg>
                  {{ (lead.rawSource.toLowerCase().includes('ads')) ? 'GOOGLE ADS' : lead.rawSource === 'google_maps' ? 'GOOGLE' : lead.rawSource === 'companies_house' ? 'UK-CH' : lead.rawSource === 'yelp' ? 'YELP' : 'AI' }}
                </span>
                <span v-if="lead.needsAction" class="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0">Action</span>
              </div>
              <div class="flex items-center gap-2 mt-0.5 min-w-0">
                <p class="text-[10px] font-bold text-outline uppercase truncate flex-shrink-0">{{ lead.type }}</p>
                <div v-if="lead.email || lead.phone" class="flex items-center gap-2 border-l border-outline-variant/30 pl-2 min-w-0">
                  <span v-if="lead.phone" class="text-[10px] text-outline truncate flex items-center gap-1 flex-shrink-0"><Phone class="w-3 h-3 flex-shrink-0"/> {{ lead.phone }}</span>
                  <span v-if="lead.email" class="text-[10px] text-outline truncate flex items-center gap-1 min-w-0"><Mail class="w-3 h-3 flex-shrink-0"/> <span class="truncate">{{ lead.email }}</span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-span-3 text-sm font-medium truncate pr-4">{{ lead.location }}</div>

          <div class="col-span-1 flex justify-center">
            <span
              class="px-2 py-1 rounded-full text-[10px] font-black truncate max-w-full text-center"
              :class="lead.aiScore >= 8 ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : lead.aiScore >= 5 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'"
            >
              {{ lead.aiScore }} <span class="hidden xl:inline">{{ lead.status === 'Hot' ? 'HOT' : lead.status === 'Warm' ? 'MED' : '' }}</span>
            </span>
          </div>

          <div class="col-span-1 flex justify-center">
            <span
              class="px-2 py-1 rounded-full text-[10px] font-black uppercase truncate max-w-full text-center"
              :class="[
                lead.label === 'Replied'   ? 'bg-blue-100   text-blue-700   dark:bg-blue-500/20   dark:text-blue-400'   : '',
                lead.label === 'Contacted' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400' : '',
                lead.label === 'Called'    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : '',
                lead.label === 'Appointment'? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-400' : '',
                lead.label === 'New'       ? 'bg-slate-200  text-slate-700  dark:bg-slate-700      dark:text-slate-300'  : ''
              ]"
            >{{ lead.label }}</span>
          </div>

          <div class="col-span-1 text-[11px] font-medium text-outline truncate text-right pr-2">{{ lead.lastContacted }}</div>

          <div class="col-span-2 flex justify-end gap-1">
            <a v-if="lead.phone" :href="`tel:${lead.phone}`" @click.stop class="p-2 hover:bg-white dark:hover:bg-surface-container rounded-lg transition-colors"><Phone class="w-4 h-4 text-secondary" /></a>
            <button v-else @click.stop class="p-2 opacity-30 cursor-not-allowed rounded-lg transition-colors"><Phone class="w-4 h-4 text-secondary" /></button>
            
            <a v-if="lead.email" :href="`mailto:${lead.email}`" @click.stop class="p-2 hover:bg-white dark:hover:bg-surface-container rounded-lg transition-colors"><Mail class="w-4 h-4 text-secondary" /></a>
            <button v-else @click.stop class="p-2 opacity-30 cursor-not-allowed rounded-lg transition-colors"><Mail class="w-4 h-4 text-secondary" /></button>
            
            <button @click.stop="(e) => generateOutreach(lead.id, e)" class="p-2 hover:bg-white dark:hover:bg-surface-container rounded-lg transition-colors relative group/draft">
              <Sparkles class="w-4 h-4 text-primary" :class="isGenerating === lead.id ? 'animate-spin' : ''" />
              <div class="absolute right-0 top-full mt-1 hidden group-hover/draft:block bg-surface-container-high text-xs font-bold py-1 px-2 rounded w-max text-on-surface-variant">Draft Email</div>
            </button>
            <button @click.stop="(e) => { e.stopPropagation(); pendingDeleteId = lead.id; }" class="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
              <TrashIcon class="w-4 h-4 text-red-400 hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="filteredLeads.length === 0" class="py-12 text-center text-outline font-medium">
        No AI leads found matching the criteria.
      </div>
    </div>
    
    <!-- Detail Side Panel -->
    <transition
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <aside v-if="selectedLead" class="fixed right-0 top-16 w-full sm:w-[400px] bg-surface-container-low dark:bg-surface-container border-l border-outline-variant/10 p-6 overflow-y-auto h-[calc(100vh-64px)] z-40 shadow-2xl">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <Info class="w-5 h-5 text-outline" />
            <h3 class="font-black text-lg tracking-tight uppercase">Lead Intelligence</h3>
          </div>
          <button @click="selectedLeadId = null" class="p-1.5 hover:bg-surface-container-high rounded-full transition-colors"><X class="w-5 h-5 text-on-surface-variant" /></button>
        </div>

        <!-- Profile Overview -->
        <div class="bg-white dark:bg-surface-container-lowest p-5 rounded-2xl shadow-sm mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-2xl text-primary flex-shrink-0">
              {{ selectedLead.initials }}
            </div>
            <div class="min-w-0">
              <h4 class="text-xl font-black truncate">{{ selectedLead.company }}</h4>
              <p v-if="selectedLead.contactName" class="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                 <BadgeCheck class="w-3 h-3" /> {{ selectedLead.contactName }}
              </p>
              <p v-if="selectedLead.website" class="text-sm text-outline font-medium flex items-center gap-1 mt-1 truncate">
                <Globe class="w-3.5 h-3.5 flex-shrink-0" />
                {{ selectedLead.website }}
              </p>
              <div class="flex flex-col gap-1 mt-2">
                <div v-if="selectedLead.email" class="flex items-center gap-2 min-w-0">
                  <p class="text-sm text-on-surface-variant font-medium flex items-center gap-2 truncate flex-1">
                    <Mail class="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    <a :href="`mailto:${selectedLead.email}`" class="hover:underline hover:text-primary transition-colors">{{ selectedLead.email }}</a>
                  </p>
                </div>
                <div v-else class="flex flex-col gap-2 mt-1">
                   <div class="flex items-center gap-2 text-outline italic text-xs">
                      <Mail class="w-3 h-3" /> Email missing
                   </div>
                   <button 
                     @click="enrichWithAi(selectedLead.id)"
                     :disabled="isEnriching === selectedLead.id"
                     class="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-primary/5 text-primary text-[11px] font-black uppercase tracking-wider hover:bg-primary/10 transition-all border border-primary/20"
                   >
                     <Sparkles v-if="isEnriching !== selectedLead.id" class="w-3 h-3" />
                     <RefreshCcw v-else class="w-3 h-3 animate-spin" />
                     {{ isEnriching === selectedLead.id ? 'Deep Searching...' : 'Search Email using AI' }}
                   </button>
                </div>

                <p v-if="selectedLead.phone" class="text-sm text-on-surface-variant font-medium flex items-center gap-2 truncate">
                  <Phone class="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                  <a :href="`tel:${selectedLead.phone}`" class="hover:underline hover:text-primary transition-colors">{{ selectedLead.phone }}</a>
                </p>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-surface-container-low dark:bg-surface-container p-3 rounded-xl">
              <p class="text-[10px] font-black text-outline uppercase mb-1">AI Score</p>
              <p class="text-xl font-black" :class="selectedLead.aiScore >= 8 ? 'text-green-500' : selectedLead.aiScore >= 5 ? 'text-orange-500' : 'text-error'">{{ selectedLead.aiScore }} / 10</p>
            </div>
            <div class="bg-surface-container-low dark:bg-surface-container p-3 rounded-xl">
              <p class="text-[10px] font-black text-outline uppercase mb-1">Match Rate</p>
              <p class="text-xl font-black text-primary">{{ selectedLead.matchRate }}%</p>
            </div>
          </div>
        </div>

        <!-- AI Reasoning -->
        <div v-if="selectedLead.reasoning" class="mb-8">
          <div class="flex items-center gap-2 mb-3">
            <Bot class="w-4 h-4 text-primary" />
            <h5 class="text-xs font-black uppercase text-outline tracking-widest">AI Analysis Reasoning</h5>
          </div>
          <div class="space-y-3">
            <div v-for="(reason, i) in selectedLead.reasoning" :key="i" class="flex gap-3">
              <div class="w-1 min-h-[40px] rounded-full" :class="i === 0 ? 'bg-green-400' : 'bg-blue-400'"></div>
              <p class="text-sm font-medium leading-relaxed">{{ reason }}</p>
            </div>
          </div>
        </div>

        <!-- AI Email Preview -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <Sparkles class="text-primary w-4 h-4" />
              <h5 class="text-xs font-black uppercase text-outline tracking-widest">Smart Email Suggestion</h5>
            </div>
            <button @click="generateOutreach(selectedLead.id, $event)" class="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors" :class="{'opacity-50 pointer-events-none': isGenerating === selectedLead.id}">
              {{ isGenerating === selectedLead.id ? 'Generating...' : selectedLead.draftEmailPreview ? 'Regenerate' : 'Generate Now' }}
            </button>
          </div>
          
          <div class="bg-white dark:bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 relative">
            <template v-if="selectedLead.draftEmailPreview">
              <p class="text-xs text-on-surface-variant leading-relaxed mb-4 whitespace-pre-line">{{ selectedLead.draftEmailPreview }}</p>
              <a v-if="selectedLead.email" :href="`mailto:${selectedLead.email}?subject=${encodeURIComponent(selectedLead.draftEmailPreview?.split('\n')[0]?.replace('Subject: ', '') || 'Logistics Inquiry')}&body=${encodeURIComponent(selectedLead.draftEmailPreview || '')}`" class="block w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-md hover:bg-primary/90 transition-colors text-center">
                Use Template & Send
              </a>
              <button v-else class="w-full py-2 bg-surface-container-high text-outline text-xs font-bold rounded-lg cursor-not-allowed text-center">
                No Email Available
              </button>
            </template>
            <div v-else class="flex flex-col items-center justify-center py-6 text-center">
              <Sparkles class="w-10 h-10 text-primary/30 mb-3 animate-[pulse_3s_ease-in-out_infinite]" />
              <p class="text-xs font-black text-outline mb-1">No outreach draft found</p>
              <p class="text-[10px] text-outline/80 mb-4 max-w-[200px]">Click below to deploy the AI agent and instantly draft a tailored message for this prospect.</p>
              <button @click="generateOutreach(selectedLead.id, $event)" :disabled="isGenerating === selectedLead.id" class="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md hover:bg-primary/90 hover:-translate-y-0.5 transition-all">
                {{ isGenerating === selectedLead.id ? 'Deploying...' : 'Deploy AI Agent' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div v-if="selectedLead.timeline">
          <h5 class="text-xs font-black uppercase text-outline tracking-widest mb-4">Journey Timeline</h5>
          <div class="space-y-6 relative ml-2">
            <div class="absolute left-[7px] top-2 bottom-2 w-px bg-outline-variant/30"></div>
            
            <div v-for="(event, i) in selectedLead.timeline" :key="i" class="relative pl-6">
              <div 
                class="absolute left-0 top-1 w-4 h-4 rounded-full"
                :class="{
                  'bg-primary ring-4 ring-primary/10': event.type === 'active',
                  'bg-white dark:bg-surface-container border-2 border-primary': event.type === 'planned',
                  'bg-outline-variant': event.type === 'past'
                }"
              ></div>
              <p class="text-xs font-black" :class="event.type === 'active' ? 'text-on-surface' : 'text-on-surface-variant'">{{ event.title }}</p>
              <p class="text-[10px] text-outline font-medium mt-0.5">{{ event.desc }}</p>
            </div>
            
          </div>
        </div>
      </aside>
    </transition>

    <!-- Floating Action Button (Global Context) -->
    <button class="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50">
      <Sparkles class="w-6 h-6 fill-white" />
    </button>
    
    <!-- Toast -->
    <div
      v-if="toastMessage"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all z-50 flex items-center gap-2"
      style="animation: fade-up 0.5s ease-out;"
    >
      <Sparkles class="w-4 h-4" />
      {{ toastMessage }}
    </div>

    <!-- ═══════════════════════════════════════ -->
    <!-- Confirm Delete Modal                     -->
    <!-- ═══════════════════════════════════════ -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="pendingDeleteId" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div
            class="absolute inset-0 bg-black/50 backdrop-blur-md"
            @click="cancelSwipe(pendingDeleteId!)"
          />

          <!-- Dialog -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-90"
            enter-to-class="opacity-100 scale-100"
          >
            <div
              v-if="pendingDeleteId"
              class="relative bg-surface w-full max-w-[360px] rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.25)] overflow-hidden z-10"
            >
              <!-- Red header strip -->
              <div class="bg-gradient-to-r from-red-500 to-rose-600 h-2 w-full" />

              <div class="p-8 text-center">
                <!-- Icon -->
                <div class="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/15 flex items-center justify-center mx-auto mb-5 ring-8 ring-red-100 dark:ring-red-500/10">
                  <TrashIcon class="w-8 h-8 text-red-500" />
                </div>

                <h3 class="text-xl font-black tracking-tight text-on-surface mb-2">Delete this lead?</h3>
                <p class="text-sm text-on-surface-variant font-medium leading-relaxed mb-7">
                  This will permanently remove the lead from your CRM database.
                  <strong class="text-on-surface">This action cannot be undone.</strong>
                </p>

                <div class="flex gap-3">
                  <button
                    @click="cancelSwipe(pendingDeleteId!)"
                    class="flex-1 py-3.5 rounded-2xl bg-surface-container hover:bg-surface-container-high font-bold text-sm transition-colors"
                  >
                    Keep Lead
                  </button>
                  <button
                    @click="confirmDelete"
                    class="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-extrabold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all hover:-translate-y-0.5"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Wipe All Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showWipeConfirm" class="fixed inset-0 z-[400] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-xl" @click="showWipeConfirm = false" />
        
        <div class="relative bg-surface w-full max-w-[440px] rounded-[32px] shadow-2xl overflow-hidden z-10 p-8 border border-outline-variant/20">
          <div class="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 ring-8 ring-red-500/5">
            <TrashIcon class="w-10 h-10 text-red-500" />
          </div>
          
          <h3 class="text-2xl font-black text-center text-on-surface mb-2">Massive Data Wipe</h3>
          <p class="text-sm text-on-surface-variant text-center font-medium leading-relaxed mb-8">
            This will permanently erase the <strong class="text-red-500">entire Lead Engine database</strong>. 
            Once confirmed, all extracted intelligence and email drafts will be gone forever.
          </p>
          
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="text-[11px] font-black text-outline uppercase tracking-widest pl-1">Type "DELETE ALL" to confirm</p>
              <input 
                v-model="wipeConfirmText"
                type="text" 
                placeholder="Type confirmation here..."
                class="w-full bg-surface-container-low border border-outline-variant/40 rounded-2xl py-4 px-5 text-sm font-bold text-on-surface outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all text-center"
              />
            </div>
            
            <div class="flex gap-4 pt-2">
              <button 
                @click="showWipeConfirm = false"
                class="flex-1 py-4 rounded-2xl bg-surface-container-high font-black text-sm hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button 
                @click="handleWipeAll"
                :disabled="wipeConfirmText !== 'DELETE ALL'"
                class="flex-2 px-8 py-4 rounded-2xl bg-red-500 text-white font-black text-sm shadow-xl shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-30 disabled:grayscale disabled:pointer-events-none"
              >
                Erase Everything
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
