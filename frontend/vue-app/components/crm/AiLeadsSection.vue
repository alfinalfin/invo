<script setup lang="ts">
import { computed, ref } from "vue";
import { Bot, Mail, Phone, Sparkles, BadgeCheck, X, Globe, Trash2 as TrashIcon, RefreshCcw, Database, ExternalLink } from "lucide-vue-next";
import type { LeadRecord, Employee } from "~/lib/crm";

const config = useRuntimeConfig();
const API_BASE = (config.public.apiBase as string)?.replace(/\/$/, '') || 'https://invo-bgjy.onrender.com';

const props = defineProps<{
  leads?: LeadRecord[];
  userId: string;
}>();

const emit = defineEmits<{
  (e: 'delete-lead', id: string): void;
  (e: 'wipe-all-leads', collectionName: 'ai_leads' | 'leads', ids?: string[]): void;
  (e: 'import'): void;
  (e: 'update-lead', id: string, updates: Partial<LeadRecord>): void;
}>();


interface TimelineEvent {
  title: string;
  desc: string;
  type: "active" | "planned" | "past";
  actionLabel?: string;
  stepIdx?: number;
}

interface Lead {
  id: string;
  company: string;
  initials: string;
  type: string;
  location: string;
  aiScore: number;
  matchRate: number;
  status: "Hot" | "Warm" | "Cold" | "Follow-up" | "Converted" | "Closed";
  label: string;
  lastContacted: string;
  needsAction?: boolean;
  website?: string;
  email: string;
  phone: string;
  contactName?: string;
  contactTitle?: string;
  linkedinUrl?: string;
  reasoning?: string[];
  timeline?: TimelineEvent[];
  draftEmailPreview?: string;
  rawSource: string;
  employees?: Employee[];
  outreachStage: number;
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
  "B2B Lead Engine":   "B2B Lead Engine",
  "Google Ads":    "Google Ads",
  "google_ads":    "Google Ads",
};

function sourceLabel(raw: string | undefined): string {
  if (!raw) return "B2B Lead Engine";
  return SOURCE_LABELS[raw] ?? raw;
}

const localEmailDrafts = ref<Record<string, string>>({});
const localReasoning = ref<Record<string, string>>({});
const localScores = ref<Record<string, number>>({});
const localEmails = ref<Record<string, string>>({});
const localContactNames = ref<Record<string, string>>({});
const localContactTitles = ref<Record<string, string>>({});
const localLinkedinUrls = ref<Record<string, string>>({});
const localEmployees = ref<Record<string, Employee[]>>({});

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
      rawSource: l.source || "B2B Lead Engine",
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
      contactTitle: localContactTitles.value[l.id] || (l as any).contactTitle || "",
      linkedinUrl: localLinkedinUrls.value[l.id] || (l as any).linkedinUrl || "",
      employees: localEmployees.value[l.id] || l.employees || [],
      reasoning: localReasoning.value[l.id] ? localReasoning.value[l.id].split(/[\n.]/).map(s=>s.trim()).filter(r => r.length > 5) : ((l.ai_summary || l.customerNotes) ? (l.ai_summary || l.customerNotes)!.split(/[\n.]/).map(s=>s.trim()).filter(r => r.length > 5) : [
        `${l.company || 'This company'} is a prospective lead located near ${l.pickupAddress || 'their target market'}.`,
        `Identified via ${l.source || 'automated extraction'} and marked for outbound review.`,
        `Click 'Deploy AI Agent' below to generate a deep executive brief and intelligent email draft.`
      ]),
      draftEmailPreview: localEmailDrafts.value[l.id] || ((l.draft_email || l.notes) ? (l.draft_email || l.notes)!.replace(/AI Suggested Email Draft:\n?/i, '') : ""),
      outreachStage: (l as any).outreach_stage || 0,
      timeline: ((): TimelineEvent[] => {
        const stage = (l as any).outreach_stage || 0;
        
        return [
          { stepIdx: 0, title: "Day 0 → Lead Captured", desc: `Sourced via ${sourceLabel(l.source)}`, type: stage > 0 ? "past" : "active", actionLabel: "Start Outreach ➔" } as TimelineEvent,
          { stepIdx: 1, title: "Day 0 → Email Sent", desc: (l.draft_email || l.notes) ? "AI Outreach Delivered" : "Awaiting AI Draft", type: stage === 1 ? "active" : (stage > 1 ? "past" : "planned"), actionLabel: "Mark Opened/Tracked ➔" } as TimelineEvent,
          { stepIdx: 2, title: "Day 1 → Track Open/Click", desc: "Engagement Monitoring", type: stage === 2 ? "active" : (stage > 2 ? "past" : "planned"), actionLabel: "Log Follow-Up #1 ➔" } as TimelineEvent,
          { stepIdx: 3, title: "Day 2 → Follow-up #1", desc: "Sequential outreach", type: stage === 3 ? "active" : (stage > 3 ? "past" : "planned"), actionLabel: "Log Follow-Up #2 ➔" } as TimelineEvent,
          { stepIdx: 4, title: "Day 4 → Follow-up #2", desc: "Nurture sequence", type: stage === 4 ? "active" : (stage > 4 ? "past" : "planned"), actionLabel: "Mark Final/Closed ➔" } as TimelineEvent,
          { stepIdx: 5, title: "Day 6 → Final Attempt / Close", desc: "Pipeline cleanup", type: stage === 5 ? "active" : "planned", actionLabel: "Close Sequence" } as TimelineEvent,
        ];
      })()
    }
  });
});

const activeFilter = ref<"All" | "New" | "Hot Leads" | "Follow-up">("New");
const sourceFilter = ref<"All" | "google_maps" | "google_ads" | "companies_house" | "yelp" | "crm">("All");
const selectedLeadId = ref<string | null>(null);
const panelTab = ref<'overview' | 'enrich' | 'outreach' | 'timeline'>('overview');

const TABS = [
  { id: 'overview' as const, label: 'Overview',  icon: '🏢' },
  { id: 'enrich'   as const, label: 'AI Enrich', icon: '🔍' },
  { id: 'outreach' as const, label: 'Outreach',  icon: '📧' },
  { id: 'timeline' as const, label: 'Timeline',  icon: '🕐' },
];

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
    leads = leads.filter(lead => lead.status === "Hot" || lead.status === "Converted");
  } else if (activeFilter.value === "Follow-up") {
    leads = leads.filter(lead => lead.outreachStage >= 1 && lead.outreachStage < 5 && lead.status !== 'Converted' && lead.status !== 'Closed');
  } else if (activeFilter.value === "New") {
    leads = leads.filter(lead => lead.outreachStage === 0);
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
  const hot = aiLeads.value.filter(l => l.status === 'Hot' || l.status === 'Converted').length;
  const contacted = aiLeads.value.filter(l => l.outreachStage >= 1 && l.outreachStage < 5).length;
  const conv = total > 0 ? ((contacted / total) * 100).toFixed(1) : "0.0";
  return { total, hot, contacted, conv };
});

const tabCounts = computed(() => {
  return {
    all: aiLeads.value.length,
    new: aiLeads.value.filter(lead => lead.outreachStage === 0).length,
    hot: aiLeads.value.filter(lead => lead.status === "Hot" || lead.status === "Converted").length,
    followup: aiLeads.value.filter(lead => lead.outreachStage >= 1 && lead.outreachStage < 5 && lead.status !== 'Converted' && lead.status !== 'Closed').length
  };
});

const isGenerating = ref<string | null>(null);
const customEmailPrompt = ref("");
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

function advanceTimeline(id: string) {
  const lead = aiLeads.value.find(l => l.id === id);
  if (!lead) return;
  const nextStage = Math.min((lead.outreachStage || 0) + 1, 5);
  
  let newStatus: string = "Contacted";
  if (nextStage === 0) newStatus = "New";
  else if (nextStage === 1) newStatus = "Contacted";
  else if (nextStage === 2) newStatus = "Contacted";
  else if (nextStage === 3) newStatus = "In progress";
  else if (nextStage === 4) newStatus = "Follow-up"; 
  else if (nextStage === 5) newStatus = "Closed";

  emit('update-lead', id, { outreach_stage: nextStage, status: newStatus as any });
  toastMessage.value = `Advanced to Stage ${nextStage}! 🚀`;
  setTimeout(() => toastMessage.value = "", 3000);
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
    const res = await fetch(`${API_BASE}/api/generate-email`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": props.userId
      },
      body: JSON.stringify({
        lead: {
          company: lead.company,
          location: lead.location,
          source: lead.type
        },
        aiProvider: aiProvider.value,
        aiModel: aiModel.value,
        customPrompt: customEmailPrompt.value
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      let hasError = false;
      if (data) {
         if (data.email) localEmailDrafts.value[id] = data.email;
         if (data.reasoning) localReasoning.value[id] = data.reasoning;
         if (data.score) localScores.value[id] = data.score;
         
         emit('update-lead', id, {
           draft_email: data.email || localEmailDrafts.value[id] || '',
           ai_summary: data.reasoning || localReasoning.value[id] || '',
           lead_score: data.score ? Math.round(data.score * 10) : (localScores.value[id] ? Math.round(localScores.value[id] * 10) : 85),
         });
         
         if (data.aiError) {
           toastMessage.value = `API Error: ${data.aiError}`;
           hasError = true;
         } else {
           toastMessage.value = "AI Intelligence Generated! ✨";
         }
      }
      isGenerating.value = null;
      setTimeout(() => toastMessage.value = "", hasError ? 6000 : 3000);
    } else {
      throw new Error(await res.text());
    }
  } catch(e) {
    console.error("Failed to generate outreach email", e);
    toastMessage.value = "Failed to generate email ❌";
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
    const res = await fetch(`${API_BASE}/api/enrich-single-lead-ai`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": props.userId
      },
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
      let hasError = false;
      if (data && data.lead) {
        if (data.lead.email) localEmails.value[id] = data.lead.email;
        if (data.lead.contactName) localContactNames.value[id] = data.lead.contactName;
        if (data.lead.contactTitle) localContactTitles.value[id] = data.lead.contactTitle;
        if (data.lead.linkedinUrl) localLinkedinUrls.value[id] = data.lead.linkedinUrl;
        if (data.lead.employees) localEmployees.value[id] = data.lead.employees;

        emit('update-lead', id, {
          email: data.lead.email || localEmails.value[id] || '',
          contactName: data.lead.contactName || localContactNames.value[id] || '',
          contactTitle: data.lead.contactTitle || localContactTitles.value[id] || '',
          linkedinUrl: data.lead.linkedinUrl || localLinkedinUrls.value[id] || '',
          employees: data.lead.employees || localEmployees.value[id] || [],
        });

        const foundEmail = data.lead.email;
        const foundContact = data.lead.contactName;

        if (data.aiError) {
          toastMessage.value = `AI Warning: ${data.aiError}`;
          hasError = true;
        } else if (!foundEmail && !foundContact) {
          toastMessage.value = 'No email found — try a different model ⚠️';
          hasError = true;
        } else if (!foundEmail) {
          toastMessage.value = `Contact found: ${foundContact} — but no email ⚠️`;
        } else {
          toastMessage.value = 'Lead Enriched! ✨';
        }
      } else if (data.aiError) {
        toastMessage.value = `Enrichment Error: ${data.aiError}`;
        hasError = true;
      } else {
        toastMessage.value = 'No data returned from server ❌';
        hasError = true;
      }
      isEnriching.value = null;
      setTimeout(() => toastMessage.value = "", hasError ? 7000 : 3500);
    } else {
      const errText = await res.text();
      throw new Error(`Server ${res.status}: ${errText}`);
    }
  } catch (e: any) {
    console.error("Enrichment failed", e);
    toastMessage.value = `Enrichment failed: ${e?.message || 'Unknown error'} ❌`;
    isEnriching.value = null;
    setTimeout(() => toastMessage.value = "", 6000);
  }
}

function markAsConverted() {
  if (!selectedLeadId.value) return;
  emit('update-lead', selectedLeadId.value, { status: 'Converted' as any });
  toastMessage.value = 'Lead Marked as Hot/Converted! 🔥';
  setTimeout(() => toastMessage.value = '', 3000);
}

function selectLead(id: string) {
  selectedLeadId.value = id;
  panelTab.value = 'overview';
}

// ---- AI Model Configuration ----
const { aiProvider, aiModel } = useAiConfig();

const aiProviders = [
  { id: "openrouter", name: "OpenRouter", icon: "🌐" },
  { id: "groq", name: "Groq", icon: "⚡" },
];

const aiModels = {
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", speed: "Very Fast", intelligence: "High", costTier: "Balanced", recommended: true },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", speed: "Maximum", intelligence: "Standard", costTier: "Cheap" },
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", speed: "Fast", intelligence: "High", costTier: "Balanced" },
    { id: "qwen/qwen3-32b", name: "Qwen 3 32B", speed: "Fast", intelligence: "High", costTier: "Balanced" },
  ],
  openrouter: [
    { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)", speed: "Very Fast", intelligence: "High", costTier: "Free", recommended: true },
    { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (Free)", speed: "Very Fast", intelligence: "High", costTier: "Free" },
    { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 405B (Free)", speed: "Standard", intelligence: "Maximum", costTier: "Free" },
    { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B (Free)", speed: "Maximum", intelligence: "Standard", costTier: "Free" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", speed: "Fast", intelligence: "Maximum", costTier: "Premium" },
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
  ]
};

function selectAiProvider(pId: string) {
  aiProvider.value = pId;
  const currModels = (aiModels as any)[pId];
  const def = currModels.find((m: any) => m.recommended) || currModels[0];
  aiModel.value = def.id;
}

function sanitizeLinkedinUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const cleaned = url.trim().toLowerCase();
  if (['none', 'unknown', 'null', 'n/a', ''].includes(cleaned)) return null;
  
  if (cleaned.startsWith('http')) return url;
  if (cleaned.startsWith('linkedin.com/')) return `https://${url}`;
  if (cleaned.startsWith('www.linkedin.com/')) return `https://${url}`;
  
  // Assume it's a slug
  return `https://linkedin.com/in/${url}`;
}
</script>

<template>
  <div class="animate-in fade-in duration-500 min-h-full pb-8">
    
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
      <div>
        <h1 class="section-heading mb-2">B2B Lead Engine</h1>
        <p class="subtle-copy">AI-powered logistics and freight lead intelligence</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          v-if="selectedIds.size > 0"
          @click="handleDeleteSelected"
          class="px-5 py-2.5 bg-[var(--danger)] text-white font-bold rounded-2xl hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-[var(--danger)]/30 hover-lift"
        >
          <TrashIcon class="w-4 h-4" />
          Delete Selected ({{ selectedIds.size }})
        </button>
        <button 
          @click="emit('import')"
          class="px-5 py-2.5 glass-panel text-[var(--text-primary)] border border-[var(--border-strong)] font-bold rounded-2xl hover:bg-[var(--surface-secondary)] transition-all flex items-center gap-2 hover-lift"
        >
          <Globe class="w-4 h-4 text-[var(--accent)]" />
          Import
        </button>
        <button 
          v-if="!isSelectionMode"
          @click="triggerWipeAll"
          class="px-5 py-2.5 bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 font-bold rounded-2xl hover:bg-[var(--danger)]/20 transition-all flex items-center gap-2"
        >
          <TrashIcon class="w-4 h-4" />
          Clear
        </button>
        <button 
          v-else
          @click="toggleSelectionMode"
          class="px-5 py-2.5 bg-[var(--surface-contrast)] text-[var(--page-bg)] font-black rounded-2xl hover-lift"
        >
          Cancel
        </button>
      </div>
    </div>



    <!-- Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
      <div class="glass-panel p-6 rounded-3xl relative overflow-hidden group hover-lift">
        <div class="absolute inset-0 bg-gradient-to-br from-[var(--accent-soft)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <p class="text-[11px] font-extrabold tracking-widest text-[var(--text-muted)] uppercase mb-2 relative z-10">Total Leads</p>
        <div class="flex items-end gap-3 relative z-10">
          <span class="text-4xl font-black tracking-tighter text-[var(--text-primary)]">{{ stats.total }}</span>
          <span class="text-[10px] font-bold text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-md mb-1">+0%</span>
        </div>
      </div>
      <div class="glass-panel glow-border p-6 rounded-3xl relative overflow-hidden group hover-lift">
        <div class="absolute inset-0 bg-gradient-to-br from-[var(--danger)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <p class="text-[11px] font-extrabold tracking-widest text-[var(--text-muted)] uppercase mb-2 relative z-10 flex items-center gap-1">Hot Leads 🔥</p>
        <div class="flex items-end gap-3 relative z-10">
          <span class="text-4xl font-black tracking-tighter text-[var(--danger)] drop-shadow-md">{{ stats.hot }}</span>
          <span class="text-[10px] font-bold text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded-md mb-1">+0%</span>
        </div>
      </div>
      <div class="glass-panel p-6 rounded-3xl relative overflow-hidden group hover-lift">
        <div class="absolute inset-0 bg-gradient-to-br from-[var(--accent-soft)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <p class="text-[11px] font-extrabold tracking-widest text-[var(--text-muted)] uppercase mb-2 relative z-10">Contacted 📩</p>
        <div class="flex items-end gap-3 relative z-10">
          <span class="text-4xl font-black tracking-tighter text-[var(--text-primary)]">{{ stats.contacted }}</span>
        </div>
      </div>
      <div class="glass-panel p-6 rounded-3xl bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-secondary)] border-b-4 border-[var(--accent)] relative overflow-hidden group hover-lift">
        <p class="text-[11px] font-extrabold tracking-widest text-[var(--text-muted)] uppercase mb-2 relative z-10">Conversion Rate 📊</p>
        <div class="flex items-end gap-3 relative z-10">
          <span class="text-4xl font-black tracking-tighter text-gradient-accent">{{ stats.conv }}%</span>
        </div>
      </div>
    </div>

    <!-- Filter & Tabs -->
    <div class="glass-panel p-5 mb-6 rounded-3xl">
      <div class="flex flex-col gap-4">
        <!-- Row 1: Status filters -->
        <div class="flex items-center gap-2 p-1.5 bg-[var(--sidebar-surface)] rounded-2xl self-start backdrop-blur-md border border-[var(--border-color)]">
          <button 
            @click="activeFilter = 'All'"
            :class="activeFilter === 'All' ? 'bg-[var(--surface-primary)] shadow-sm text-[var(--accent-strong)] glow-border' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
            class="px-5 py-2 text-xs font-black tracking-wide rounded-xl transition-all flex items-center gap-2"
          >
            All Leads <span class="bg-[var(--surface-container)] text-[9px] px-1.5 py-0.5 rounded-md">{{ tabCounts.all }}</span>
          </button>
          <button 
            @click="activeFilter = 'New'"
            :class="activeFilter === 'New' ? 'bg-[var(--surface-primary)] shadow-sm text-[var(--accent-strong)] glow-border' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
            class="px-5 py-2 text-xs font-black tracking-wide rounded-xl transition-all flex items-center gap-2"
          >
            New Leads 🌟 <span class="bg-[var(--surface-container)] text-[9px] px-1.5 py-0.5 rounded-md">{{ tabCounts.new }}</span>
          </button>
          <button 
            @click="activeFilter = 'Follow-up'"
            :class="activeFilter === 'Follow-up' ? 'bg-[var(--surface-primary)] shadow-sm text-[var(--warning)] glow-border' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
            class="px-5 py-2 text-xs font-black tracking-wide rounded-xl transition-all flex items-center gap-2"
          >
            Follow-Up Needed ⏳ <span class="bg-[var(--surface-container)] text-[9px] px-1.5 py-0.5 rounded-md">{{ tabCounts.followup }}</span>
          </button>
          <button 
            @click="activeFilter = 'Hot Leads'"
            :class="activeFilter === 'Hot Leads' ? 'bg-[var(--surface-primary)] shadow-sm text-[var(--danger)] glow-border' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
            class="px-5 py-2 text-xs font-black tracking-wide rounded-xl transition-all flex items-center gap-2"
          >
            Hot Leads 🔥 <span class="bg-[var(--surface-container)] text-[9px] px-1.5 py-0.5 rounded-md">{{ tabCounts.hot }}</span>
          </button>
        </div>

        <!-- Row 2: Source filters -->
        <div class="flex items-center gap-2.5 flex-wrap">
          <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mr-2">Source Protocol:</span>
          <button
            @click="sourceFilter = 'All'"
            :class="sourceFilter === 'All' ? 'bg-[var(--surface-contrast)] text-[var(--page-bg)]' : 'bg-[var(--surface-accent)] text-[var(--accent)] border border-[var(--border-strong)] hover:bg-[var(--sidebar-surface)]'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all hover-lift"
          >
            All Sources <span class="opacity-70 font-bold ml-1">[{{ sourceCounts.all }}]</span>
          </button>
          <button
            @click="sourceFilter = 'google_ads'"
            :class="sourceFilter === 'google_ads' ? 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/30' : 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 hover:bg-[#f59e0b]/20'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all hover-lift"
          >
            <Bot class="w-3.5 h-3.5" />
            Google Ads <span class="opacity-70 font-bold ml-1">[{{ sourceCounts.google_ads }}]</span>
          </button>
          <button
            @click="sourceFilter = 'companies_house'"
            :class="sourceFilter === 'companies_house' ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/30' : 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 hover:bg-[#10b981]/20'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all hover-lift"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M9 21V9l6-6 6 6v12M9 21h6"/></svg>
            UK Companies House <span class="opacity-70 font-bold ml-1">[{{ sourceCounts.companies_house }}]</span>
          </button>
          <button
            @click="sourceFilter = 'crm'"
            :class="sourceFilter === 'crm' ? 'bg-gradient-primary text-white shadow-lg shadow-[var(--accent-strong)]/30' : 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)] hover:bg-[var(--accent)]/20'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all hover-lift"
          >
            <Database class="w-3.5 h-3.5" />
            CRM Imports <span class="opacity-70 font-bold ml-1">[{{ sourceCounts.crm }}]</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Header -->
    <div class="grid grid-cols-12 px-4 py-4 mb-2 bg-[var(--surface-primary)] border border-[var(--border-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] shadow-sm backdrop-blur-xl">
      <div class="col-span-1 flex items-center justify-center">
        <div 
          v-if="isSelectionMode"
          @click="toggleSelectAll"
          class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer"
          :class="isAllSelected ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-strong)] hover:border-[var(--accent)]'"
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
        <div 
          class="absolute inset-0 bg-gradient-to-l from-red-600 to-[var(--danger)] flex items-center justify-end pr-6 rounded-2xl z-0 select-none transition-opacity duration-300"
          :class="(swipeState[lead.id] || 0) < 0 ? 'opacity-100' : 'opacity-0'"
        >
          <div class="flex flex-col items-center gap-1 text-white">
            <TrashIcon class="w-6 h-6" />
            <span class="text-[10px] font-black uppercase tracking-widest text-red-100">Delete</span>
          </div>
        </div>

        <!-- Swipeable foreground card -->
        <div
          class="grid grid-cols-12 px-4 py-5 items-center cursor-pointer relative z-10 glass-panel border-[var(--border-color)] rounded-2xl select-none group/row transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[var(--shadow-soft)] mb-2.5"
          :class="[
            selectedLeadId === lead.id ? 'border-l-4 border-l-[var(--accent)] bg-[var(--surface-secondary)]' : 'border-l-4 border-l-transparent hover:bg-[var(--surface-secondary)]',
            selectedIds.has(lead.id) ? 'bg-[var(--accent-soft)]' : ''
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
              :class="selectedIds.has(lead.id) ? 'bg-[var(--accent)] border-[var(--accent)] scale-110' : 'border-[var(--border-strong)] bg-[var(--surface-primary)]'"
            >
              <BadgeCheck v-if="selectedIds.has(lead.id)" class="w-4 h-4 text-white" />
            </div>
          </div>
          <div class="col-span-3 flex items-center gap-3 min-w-0 pr-4">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0"
              :class="selectedLeadId === lead.id ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' : 'bg-[var(--sidebar-surface)] text-[var(--text-secondary)] border border-[var(--border-color)]'"
            >
              {{ lead.initials }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 min-w-0 flex-wrap">
                <p class="font-bold text-on-surface truncate text-sm">{{ lead.company }}</p>
                <!-- Prominent Source badge next to name -->
                <span
                  class="text-[9px] font-black px-2 py-0.5 rounded-md flex-shrink-0 flex items-center gap-1 shadow-sm uppercase tracking-wide border"
                  :class="{
                    'bg-[#2563eb]/20 text-[#3b82f6] border-[#3b82f6]/30': lead.rawSource === 'google_maps',
                    'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30': lead.rawSource.toLowerCase().includes('ads'),
                    'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30': lead.rawSource === 'companies_house',
                    'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30': lead.rawSource === 'yelp',
                    'bg-[var(--accent)]/20 text-[var(--accent)] border-[var(--accent)]/30': !['google_maps','companies_house','yelp'].includes(lead.rawSource) && !lead.rawSource.toLowerCase().includes('ads')
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
                <p v-if="lead.type && lead.type.toLowerCase() !== lead.rawSource.toLowerCase()" class="text-[10px] font-bold text-[var(--text-muted)] uppercase truncate flex-shrink-0">{{ lead.type }}</p>
                <div v-if="lead.email || lead.phone" class="flex items-center gap-2 border-l border-[var(--border-strong)] pl-2 min-w-0">
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
        No B2B Lead Engine leads found matching the criteria.
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
      <aside v-if="selectedLead" class="fixed right-0 top-16 w-full sm:w-[440px] bg-white/60 dark:bg-[#0b0e14]/60 backdrop-blur-3xl border-l border-white/40 dark:border-white/5 flex flex-col h-[calc(100vh-64px)] z-40 shadow-[0_0_80px_-15px_rgba(0,0,0,0.3)]">
        
        <!-- ── Panel Header ──────────────────────────── -->
        <div class="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
               <Sparkles class="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 class="font-black text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 leading-none">Lead Intelligence</h3>
              <p class="text-[10px] font-bold text-outline mt-0.5 truncate max-w-[220px]">{{ selectedLead.company }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="selectedLead.status !== 'Converted'" @click="markAsConverted()" class="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-md shadow-orange-500/20 flex items-center gap-1 hover-lift">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg> Mark Success
            </button>
            <button @click="selectedLeadId = null" class="p-2 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all border border-black/5 dark:border-white/10 shadow-sm"><X class="w-4 h-4 text-on-surface" /></button>
          </div>
        </div>

        <!-- ── Tab Bar ──────────────────────────────── -->
        <div class="flex gap-1 px-4 pb-3 flex-shrink-0">
          <button
            v-for="tab in TABS"
            :key="tab.id"
            @click="panelTab = tab.id"
            class="flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            :class="panelTab === tab.id
              ? 'bg-gradient-to-b from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
              : 'text-outline hover:text-on-surface hover:bg-white/40 dark:hover:bg-white/5'"
          >
            <span class="text-base leading-none">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>
        <div class="h-px bg-black/5 dark:bg-white/5 mx-4 flex-shrink-0"></div>

        <!-- ── Tab Content (scrollable) ─────────────── -->
        <div class="flex-1 overflow-y-auto px-5 pt-4 pb-6">

          <!-- ═══ OVERVIEW TAB ══════════════════════ -->
          <template v-if="panelTab === 'overview'">
            <!-- Company Card -->
            <div class="bg-white/80 dark:bg-surface-container-lowest/80 backdrop-blur-xl p-5 rounded-2xl shadow-xl shadow-black/5 border border-white/50 dark:border-white/5 mb-4 relative overflow-hidden group">
              <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
              <div class="flex items-start gap-4 mb-4 relative z-10">
                <div class="w-14 h-14 bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-2xl flex items-center justify-center font-black text-xl text-indigo-700 dark:text-indigo-300 flex-shrink-0 border border-indigo-200/50 dark:border-indigo-700/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {{ selectedLead.initials }}
                </div>
                <div class="min-w-0 flex-1 pt-1">
                  <h4 class="text-lg font-black truncate text-on-surface">{{ selectedLead.company }}</h4>
                  <p v-if="selectedLead.website" class="text-[11px] text-outline font-medium flex items-center gap-1 mt-1 truncate hover:text-primary cursor-pointer transition-colors">
                    <Globe class="w-3 h-3 flex-shrink-0" /> {{ selectedLead.website.replace(/^https?:\/\//, '') }}
                  </p>
                  <span class="inline-block text-[10px] font-black px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant uppercase tracking-wider mt-1">{{ selectedLead.type }}</span>
                </div>
              </div>

              <!-- Contact rows -->
              <div class="space-y-2 relative z-10 mb-4">
                <div class="flex items-center gap-3 bg-surface-container-low/50 dark:bg-surface-container/50 p-2.5 rounded-xl border border-white/20 dark:border-white/5">
                  <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0"><Mail class="w-4 h-4 text-indigo-500" /></div>
                  <div v-if="selectedLead.email" class="min-w-0 flex-1">
                    <p class="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Email</p>
                    <a :href="`mailto:${selectedLead.email}`" class="text-sm font-bold text-on-surface truncate hover:text-indigo-500 transition-colors block">{{ selectedLead.email }}</a>
                  </div>
                  <div v-else class="min-w-0 flex-1">
                    <p class="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Email</p>
                    <button @click="panelTab = 'enrich'" class="text-[11px] font-black text-indigo-500 hover:text-indigo-700 transition-colors flex items-center gap-1">
                      <Sparkles class="w-3 h-3" /> Find with AI →
                    </button>
                  </div>
                </div>
                <div v-if="selectedLead.phone" class="flex items-center gap-3 bg-surface-container-low/50 dark:bg-surface-container/50 p-2.5 rounded-xl border border-white/20 dark:border-white/5">
                  <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><Phone class="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">Direct Line</p>
                    <a :href="`tel:${selectedLead.phone}`" class="text-sm font-bold text-on-surface truncate hover:text-emerald-600 transition-colors block">{{ selectedLead.phone }}</a>
                  </div>
                </div>
              </div>

              <!-- Score tiles -->
              <div class="grid grid-cols-2 gap-3 relative z-10">
                <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 p-3 rounded-xl border border-green-100 dark:border-green-500/20 text-center">
                  <p class="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest mb-1">AI Score</p>
                  <p class="text-2xl font-black" :class="selectedLead.aiScore >= 8 ? 'text-green-600 dark:text-green-400' : selectedLead.aiScore >= 5 ? 'text-orange-500' : 'text-error'">{{ selectedLead.aiScore }}<span class="text-xs font-bold opacity-50">/10</span></p>
                </div>
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20 text-center">
                  <p class="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Match Rate</p>
                  <p class="text-2xl font-black text-blue-600 dark:text-blue-400">{{ selectedLead.matchRate }}%</p>
                </div>
              </div>
            </div>

            <!-- Contact Intelligence Section -->
            <div v-if="(selectedLead.employees && selectedLead.employees.length > 0) || selectedLead.contactName || selectedLead.contactTitle" class="space-y-4">
              <!-- Primary Director Card -->
              <div v-if="selectedLead.employees && selectedLead.employees.length > 0">
                <h4 class="text-[10px] font-black text-indigo-900/40 dark:text-indigo-300/40 uppercase tracking-[0.2em] px-1 mb-2">Primary Director</h4>
                <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] rounded-2xl shadow-lg shadow-indigo-500/10 active:scale-[0.98] transition-all">
                  <div class="bg-white/95 dark:bg-surface-container-lowest/95 backdrop-blur-xl p-5 rounded-[15px] flex items-center gap-4">
                    <div class="w-14 h-14 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-2xl flex items-center justify-center font-black text-xl text-indigo-600 dark:text-indigo-300 flex-shrink-0 relative border border-indigo-500/10 shadow-inner">
                      {{ selectedLead.employees[0].name.substring(0, 2).toUpperCase() }}
                      <div v-if="sanitizeLinkedinUrl(selectedLead.employees[0].linkedinUrl)" class="absolute -bottom-1 -right-1 bg-white dark:bg-surface-container-high rounded-full p-1 shadow-md border border-black/5">
                        <svg class="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <BadgeCheck class="w-4 h-4 text-indigo-500 flex-shrink-0 shadow-sm" />
                        <h4 class="font-black text-base truncate text-on-surface">{{ selectedLead.employees[0].name }}</h4>
                      </div>
                      <p class="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mt-1 tracking-wider">{{ selectedLead.employees[0].role }}</p>
                      <div class="flex items-center gap-3 mt-3">
                        <a v-if="sanitizeLinkedinUrl(selectedLead.employees[0].linkedinUrl)" :href="sanitizeLinkedinUrl(selectedLead.employees[0].linkedinUrl)!" target="_blank" class="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] rounded-lg text-[10px] font-black transition-all">
                          <ExternalLink class="w-3.5 h-3.5" /> LinkedIn Profile
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3 More Persons Section -->
                <div v-if="selectedLead.employees.length > 1" class="mt-6">
                  <h4 class="text-[10px] font-black text-indigo-900/40 dark:text-indigo-300/40 uppercase tracking-[0.2em] px-1 mb-3">Additional Key Executives</h4>
                  <div class="grid grid-cols-1 gap-2">
                    <div v-for="emp in selectedLead.employees.slice(1, 4)" :key="emp.name" class="bg-white/40 dark:bg-surface-container-lowest/40 backdrop-blur-md p-3 rounded-xl border border-white/40 dark:border-white/5 flex items-center justify-between group hover:bg-white/60 dark:hover:bg-surface-container-lowest/60 transition-all">
                       <div class="flex items-center gap-3 min-w-0">
                         <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-500 flex-shrink-0">
                           {{ emp.name.substring(0, 2).toUpperCase() }}
                         </div>
                         <div class="min-w-0">
                           <p class="text-[11px] font-black text-on-surface truncate">{{ emp.name }}</p>
                           <p class="text-[9px] font-bold text-outline uppercase truncate">{{ emp.role }}</p>
                         </div>
                       </div>
                       <a v-if="sanitizeLinkedinUrl(emp.linkedinUrl)" :href="sanitizeLinkedinUrl(emp.linkedinUrl)!" target="_blank" class="p-2 text-[#0A66C2] hover:bg-[#0A66C2]/10 rounded-lg transition-all" title="View LinkedIn">
                         <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                       </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Fallback for legacy single contact -->
              <div v-else-if="selectedLead.contactName || selectedLead.contactTitle">
                <h4 class="text-[10px] font-black text-indigo-900/40 dark:text-indigo-300/40 uppercase tracking-[0.2em] px-1 mb-2">Primary Director</h4>
                <div class="bg-white/80 dark:bg-surface-container-lowest/80 backdrop-blur-xl p-4 rounded-xl border border-white/50 dark:border-white/5 shadow-md shadow-black/5 flex items-center gap-3">
                  <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center font-black text-lg text-white flex-shrink-0 relative shadow-inner">
                    {{ selectedLead.contactName ? selectedLead.contactName.substring(0, 2).toUpperCase() : 'EX' }}
                    <div v-if="sanitizeLinkedinUrl(selectedLead.linkedinUrl)" class="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-black/5">
                      <svg class="w-3.5 h-3.5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <BadgeCheck class="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <h4 class="font-black text-sm truncate text-on-surface">{{ selectedLead.contactName || 'Executive Profile' }}</h4>
                    </div>
                    <p class="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mt-0.5 truncate">{{ selectedLead.contactTitle || 'Key Decision Maker' }}</p>
                    <a v-if="sanitizeLinkedinUrl(selectedLead.linkedinUrl)" :href="sanitizeLinkedinUrl(selectedLead.linkedinUrl)!" target="_blank" class="inline-flex items-center gap-1 mt-1.5 text-[10px] font-black text-[#0A66C2] hover:underline">
                      <ExternalLink class="w-3 h-3" /> LinkedIn Profile
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick actions -->
            <div class="mt-4 grid grid-cols-2 gap-2">
              <button @click="panelTab = 'enrich'" class="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-indigo-500/25 hover:-translate-y-0.5 transition-all">
                <Sparkles class="w-3.5 h-3.5" /> AI Enrich
              </button>
              <button @click="panelTab = 'outreach'" class="flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md shadow-pink-500/25 hover:-translate-y-0.5 transition-all">
                <Mail class="w-3.5 h-3.5" /> Generate Email
              </button>
            </div>
          </template>

          <!-- ═══ AI ENRICH TAB ══════════════════════ -->
          <template v-else-if="panelTab === 'enrich'">
            <!-- AI Core Module -->
            <div class="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-2xl p-4 mb-4 border border-indigo-500/20 dark:border-indigo-400/20">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <h3 class="text-[11px] font-black tracking-widest text-indigo-900 dark:text-indigo-300 uppercase">AI Core Module</h3>
                </div>
                <div class="flex bg-white/50 dark:bg-black/20 rounded-lg p-0.5 border border-black/5 dark:border-white/5">
                  <button v-for="p in aiProviders" :key="p.id" @click="selectAiProvider(p.id)"
                    class="px-2.5 py-1 text-[10px] font-black rounded-md transition-all"
                    :class="aiProvider === p.id ? 'bg-white dark:bg-surface text-primary shadow-sm' : 'text-outline hover:text-on-surface'"
                  >{{ p.name }}</button>
                </div>
              </div>
              <div class="relative">
                <select v-model="aiModel" class="w-full appearance-none rounded-xl border border-indigo-500/20 dark:border-indigo-400/20 bg-white/70 dark:bg-surface-container/60 backdrop-blur-md hover:border-indigo-500 focus:border-indigo-500 py-2.5 px-3 pr-8 text-xs font-bold text-on-surface outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-sm">
                  <option v-for="m in (aiModels as any)[aiProvider]" :key="m.id" :value="m.id">{{ m.name }} ({{ m.speed }})</option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <!-- Enrich action -->
            <div class="bg-white/80 dark:bg-surface-container-lowest/80 backdrop-blur-xl p-5 rounded-2xl border border-white/50 dark:border-white/5 shadow-md mb-4">
              <h4 class="text-[11px] font-black uppercase text-on-surface tracking-widest mb-1">Find Email & Contact</h4>
              <p class="text-xs text-outline font-medium mb-4 leading-relaxed">The AI will search for a verified business email, key decision-maker name, role, and LinkedIn profile for this company.</p>
              <button
                @click="enrichWithAi(selectedLead.id)"
                :disabled="isEnriching === selectedLead.id"
                class="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none disabled:shadow-none"
              >
                <Sparkles v-if="isEnriching !== selectedLead.id" class="w-4 h-4" />
                <RefreshCcw v-else class="w-4 h-4 animate-spin" />
                {{ isEnriching === selectedLead.id ? 'Deep Searching...' : 'Search Email using AI' }}
              </button>
            </div>

            <!-- Results (if already enriched) -->
            <div v-if="selectedLead.email || (selectedLead.employees && selectedLead.employees.length > 0) || selectedLead.contactName" class="space-y-3">
              <h5 class="text-[10px] font-black uppercase text-outline tracking-widest mb-2">Enriched Data</h5>
              
              <!-- Company/Verified Email -->
              <div v-if="selectedLead.email" class="flex items-center gap-3 bg-green-50 dark:bg-green-500/10 p-3 rounded-xl border border-green-200/50 dark:border-green-500/20">
                <Mail class="w-4 h-4 text-green-600 flex-shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-tighter">Verified Business Email</p>
                  <a :href="`mailto:${selectedLead.email}`" class="text-xs font-black text-on-surface hover:text-green-600 transition-colors truncate block">{{ selectedLead.email }}</a>
                </div>
              </div>

              <!-- Personnel List -->
              <div v-if="selectedLead.employees && selectedLead.employees.length > 0" v-for="(emp, idx) in selectedLead.employees.slice(0, 4)" :key="idx" class="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20 group hover:shadow-md transition-all">
                <div class="w-8 h-8 rounded-lg bg-white dark:bg-surface-container flex items-center justify-center font-black text-[10px] text-indigo-600 shadow-sm">
                  {{ emp.name.substring(0, 2).toUpperCase() }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <p class="text-xs font-black text-on-surface truncate">{{ emp.name }}</p>
                    <BadgeCheck class="w-3 h-3 text-indigo-500" />
                  </div>
                  <p class="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase truncate">{{ emp.role }}</p>
                </div>
                <a v-if="sanitizeLinkedinUrl(emp.linkedinUrl)" :href="sanitizeLinkedinUrl(emp.linkedinUrl)!" target="_blank" class="p-2 text-[#0A66C2] hover:bg-[#0A66C2]/10 rounded-lg transition-all" title="LinkedIn">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>

              <!-- Fallback for generic contact (no employees list) -->
              <div v-else-if="selectedLead.contactName" class="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-200/50 dark:border-indigo-500/20">
                <BadgeCheck class="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-tighter">Primary Contact</p>
                  <p class="text-xs font-black text-on-surface truncate">{{ selectedLead.contactName }}</p>
                  <p v-if="selectedLead.contactTitle" class="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold uppercase truncate">{{ selectedLead.contactTitle }}</p>
                </div>
                <a v-if="sanitizeLinkedinUrl(selectedLead.linkedinUrl)" :href="sanitizeLinkedinUrl(selectedLead.linkedinUrl)!" target="_blank" class="p-2 text-[#0A66C2] hover:bg-white/50 rounded-lg transition-all">
                  <ExternalLink class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <!-- AI Reasoning -->
            <div v-if="selectedLead.reasoning" class="mt-4 p-4 bg-white/50 dark:bg-surface-container-lowest/50 rounded-2xl border border-white/30 dark:border-white/5">
              <div class="flex items-center gap-2 mb-3">
                <Bot class="w-3.5 h-3.5 text-blue-500" />
                <h5 class="text-[10px] font-black uppercase text-on-surface tracking-widest">AI Reasoning</h5>
              </div>
              <div class="space-y-2">
                <div v-for="(reason, i) in selectedLead.reasoning" :key="i" class="flex gap-2 items-start">
                  <div class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" :class="i === 0 ? 'bg-green-400' : 'bg-blue-400'"></div>
                  <p class="text-xs font-medium leading-relaxed text-on-surface-variant">{{ reason }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- ═══ OUTREACH TAB ═══════════════════════ -->
          <template v-else-if="panelTab === 'outreach'">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 shadow-sm"><Sparkles class="text-white w-3 h-3" /></div>
                <h5 class="text-[11px] font-black uppercase text-on-surface tracking-widest">Smart Email</h5>
              </div>
              <button @click="generateOutreach(selectedLead.id, $event)" class="text-[10px] font-black text-pink-600 dark:text-pink-400 px-3 py-1.5 bg-pink-50 dark:bg-pink-500/10 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-500/20 transition-all active:scale-95" :class="{'opacity-50 pointer-events-none': isGenerating === selectedLead.id}">
                {{ isGenerating === selectedLead.id ? 'Generating...' : selectedLead.draftEmailPreview ? 'Regenerate ↻' : 'Generate Now ✨' }}
              </button>
            </div>

            <div class="mb-4">
              <label class="block text-[10px] font-black uppercase text-outline tracking-widest mb-2">Custom Instructions (Optional)</label>
              <textarea 
                v-model="customEmailPrompt" 
                placeholder="E.g., Keep it under 50 words, sound casual, or mention our new London warehouse..."
                class="w-full bg-surface-container/50 border border-outline-variant/30 text-xs font-medium text-on-surface p-3 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 outline-none resize-none transition-all placeholder:text-outline/50"
                rows="2"
              ></textarea>
            </div>

            <div class="bg-gradient-to-b from-white/80 to-surface-container-lowest/80 dark:from-surface-container-lowest/80 dark:to-surface/50 backdrop-blur-xl p-5 rounded-2xl border border-white/50 dark:border-white/5 shadow-md relative overflow-hidden">
              <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/10 to-transparent pointer-events-none rounded-bl-full"></div>
              <template v-if="selectedLead.draftEmailPreview">
                <div class="bg-surface-container-low/50 dark:bg-black/20 p-4 rounded-xl border border-white/20 dark:border-white/5 mb-4 relative z-10">
                  <p class="text-xs font-medium text-on-surface-variant leading-relaxed whitespace-pre-line">{{ selectedLead.draftEmailPreview }}</p>
                </div>
                <a v-if="selectedLead.email" :href="`mailto:${selectedLead.email}?subject=${encodeURIComponent(selectedLead.draftEmailPreview?.split('\n')[0]?.replace('Subject: ', '') || 'Logistics Inquiry')}&body=${encodeURIComponent(selectedLead.draftEmailPreview || '')}`" class="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all hover:-translate-y-0.5 text-center relative z-10">
                  <Mail class="w-4 h-4" /> Use Template & Send
                </a>
                <button v-else @click="panelTab = 'enrich'" class="w-full py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest rounded-xl text-center relative z-10 border border-indigo-300/30 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                  <Sparkles class="w-3.5 h-3.5" /> Find Email First →
                </button>
              </template>
              <div v-else class="flex flex-col items-center justify-center py-8 text-center relative z-10">
                <div class="w-16 h-16 rounded-full bg-pink-50 dark:bg-pink-500/10 flex items-center justify-center mb-4">
                  <Sparkles class="w-8 h-8 text-pink-500 animate-[pulse_3s_ease-in-out_infinite]" />
                </div>
                <p class="text-sm font-black text-on-surface mb-1">No draft yet</p>
                <p class="text-[11px] text-outline/80 mb-5 max-w-[240px] leading-relaxed">Deploy the AI agent to generate a hyper-personalized outreach email for this prospect.</p>
                <button @click="generateOutreach(selectedLead.id, $event)" :disabled="isGenerating === selectedLead.id" class="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-0.5 transition-all w-full flex items-center justify-center gap-2 disabled:opacity-75 disabled:transform-none disabled:shadow-none">
                  <RefreshCcw v-if="isGenerating === selectedLead.id" class="w-4 h-4 animate-spin" />
                  <Bot v-else class="w-4 h-4" />
                  {{ isGenerating === selectedLead.id ? 'Deploying...' : 'Deploy AI Agent' }}
                </button>
              </div>
            </div>
          </template>

          <!-- ═══ TIMELINE TAB ════════════════════════ -->
          <template v-else-if="panelTab === 'timeline'">
            <div v-if="selectedLead.timeline" class="space-y-5 relative ml-3 mt-2">
              <div class="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/50 to-outline-variant/30"></div>
              <div v-for="(event, i) in selectedLead.timeline" :key="i" class="relative pl-6 pb-2">
                <div class="absolute left-0 top-1 w-4 h-4 rounded-full"
                  :class="{
                    'bg-indigo-500 ring-4 ring-indigo-500/20': event.type === 'active',
                    'bg-white dark:bg-surface-container border-2 border-indigo-500': event.type === 'planned',
                    'bg-outline-variant': event.type === 'past'
                  }"
                ></div>
                <p class="text-[11px] font-black uppercase tracking-wider" :class="event.type === 'active' ? 'text-indigo-600 dark:text-indigo-400' : 'text-on-surface-variant'">{{ event.title }}</p>
                <p class="text-[10px] text-outline font-medium mt-0.5">{{ event.desc }}</p>
                
                <div v-if="event.type === 'active' && event.stepIdx !== undefined && event.stepIdx < 5" class="mt-3">
                  <button @click="advanceTimeline(selectedLead.id)" class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 active:scale-95 border border-indigo-400/30 w-full sm:w-auto">
                    {{ event.actionLabel }}
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-12 text-center">
              <p class="text-sm font-bold text-outline">No timeline events yet</p>
            </div>
          </template>

        </div>
      </aside>
    </transition>


    
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
                  This will permanently remove the lead from your B2B Lead Engine database.
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
            This will permanently erase the <strong class="text-red-500">entire B2B Lead Engine database</strong>. 
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
