<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Search, MapPin, X, ChevronDown, Check, 
  Rocket, RefreshCcw, CheckCircle2, Brain, Database, 
  Clock, ArrowRight, Minimize2, Maximize2, Bell
} from "lucide-vue-next";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { push, ref as databaseRef } from "firebase/database";
import { useFirebaseServices } from "~/composables/useFirebaseServices";
import type { LeadRecord } from "~/lib/crm";

const props = defineProps<{
  existingLeads?: LeadRecord[];
}>();

const route = useRoute();
const router = useRouter();

const { db, rtdb, isFirebaseConfigured, hasRealtimeDatabaseConfig, leadsCollectionName, realtimeLeadsPath, aiLeadsCollectionName, realtimeAiLeadsPath } = useFirebaseServices();

const isOpen = computed(() => route.query.scrape === "true");

function closeModal() {
  const query = { ...route.query };
  delete query.scrape;
  router.push({ query });
  
  // Reset state after a short delay to hide the transition
  setTimeout(() => {
    viewState.value = 'setup';
  }, 300);
}

// Global View State
type ViewState = 'setup' | 'progress' | 'success' | 'error';
const viewState = ref<ViewState>('setup');

// ---- Setup State ----
const keywords = ref<string[]>(["freight forwarder London", "customs clearance Heathrow"]);
const keywordInput = ref("");

function addKeyword(e: KeyboardEvent) {
  if (e.key === "Enter" && keywordInput.value.trim() !== "") {
    e.preventDefault();
    const newKw = keywordInput.value.trim();
    if (!keywords.value.includes(newKw)) {
      keywords.value.push(newKw);
    }
    keywordInput.value = "";
  }
}

function removeKeyword(kw: string) {
  keywords.value = keywords.value.filter((k) => k !== kw);
}

const location = ref("United Kingdom - National");
const locationSearch = ref("United Kingdom - National");
const placePredictions = ref<any[]>([]);
const showPredictions = ref(false);
const locationRef = ref<HTMLElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout>;
let autocompleteService: any = null;

watch(locationSearch, (newVal) => {
  if (newVal === location.value) return;
  showPredictions.value = true;
  
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (newVal.trim().length > 0 && autocompleteService) {
      autocompleteService.getPlacePredictions({ input: newVal }, (predictions: any, status: any) => {
        const placesStatus = (window as any).google?.maps?.places?.PlacesServiceStatus?.OK;
        if (status === placesStatus && predictions) {
          placePredictions.value = predictions;
        } else {
          placePredictions.value = [];
        }
      });
    } else {
      placePredictions.value = [];
    }
  }, 300);
});

function selectLocation(place: any) {
  locationSearch.value = place.description;
  location.value = place.description;
  showPredictions.value = false;
}

function handleLocationOutsideClick(event: MouseEvent) {
  if (locationRef.value && !locationRef.value.contains(event.target as Node)) {
    showPredictions.value = false;
  }
}

onMounted(() => {
  if (!document.getElementById("google-maps-places")) {
    const script = document.createElement("script");
    script.id = "google-maps-places";
    script.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyBzXbQ4F2tJNFwQQeOY4mc2zcLzv_6A_1g&libraries=places";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      autocompleteService = new (window as any).google.maps.places.AutocompleteService();
    };
    document.head.appendChild(script);
  } else if ((window as any).google?.maps?.places) {
    autocompleteService = new (window as any).google.maps.places.AutocompleteService();
  }

  document.addEventListener('mousedown', handleLocationOutsideClick);
});

const maxLeads = ref(50);
const sourceMaps = ref(true);
const sourceDirectories = ref(false);
const enableAIFiltering = ref(true);
const skipExisting = ref(false);

// ---- AI Model Configuration ----
const { aiProvider, aiModel } = useAiConfig();

// ---- Progress & Simulation State ----
const currentStep = ref(1);
const processedLeads = ref(0);
const progressPercent = computed(() => maxLeads.value === 0 ? 0 : Math.round((processedLeads.value / maxLeads.value) * 100));
const elapsedTime = ref(0); 
const errorMessage = ref("");
const isMinimized = ref(false);
const showCompletionPopup = ref(false);

const completionSound = typeof Audio !== 'undefined' ? new Audio('/ringtone.mp3') : null;

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

let simInterval: number;

async function startScraping() {
  // Catch dangling keyword input
  if (keywordInput.value.trim() !== "") {
    if (!keywords.value.includes(keywordInput.value.trim())) {
      keywords.value.push(keywordInput.value.trim());
    }
    keywordInput.value = "";
  }

  if (keywords.value.length === 0) {
    viewState.value = 'error';
    errorMessage.value = "At least one target keyword is required to launch the engine.";
    return;
  }

  viewState.value = 'progress';
  currentStep.value = 1;
  processedLeads.value = 0;
  elapsedTime.value = 0; 
  
  simInterval = window.setInterval(() => {
     elapsedTime.value += 1;
  }, 1000);

  try {
    const rawLimit = Number(maxLeads.value) || 10;
    const boundedLimit = Math.max(10, Math.min(rawLimit, 100));

    const payload = {
      keywords: keywords.value,
      region: location.value || "Unknown",
      limit: boundedLimit,
      userId: "local-dev-user-123",
      sources: {
        google: sourceMaps.value,
        directories: sourceDirectories.value,
        linkedin: false
      },
      ai: {
        provider: aiProvider.value || "groq",
        model: aiModel.value || "llama-3.3-70b-versatile"
      }
    };

    currentStep.value = 2;

    /** Fetch from your strict Node backend. No more n8n or local nuanced scrapers. */
    async function fetchLeads(): Promise<any> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 600_000); // 10 minutes timeout for deep AI scraping
      
      const apiEndpoint = process.env.NODE_ENV === "development" 
        ? "http://localhost:5000/api/discover-opportunities" 
        : "https://invo-bgjy.onrender.com/api/discover-opportunities";
        
      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-user-id": "local-dev-user-123"
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        
        clearTimeout(timer);
        
        if (!res.ok) {
           const errText = await res.text();
           let cleanMsg = `Backend Error ${res.status}: ${errText}`;
           try {
             const errJson = JSON.parse(errText);
             if (errJson.details?.fieldErrors) {
                const fields = Object.keys(errJson.details.fieldErrors);
                if (fields.length > 0) {
                   cleanMsg = errJson.details.fieldErrors[fields[0]][0];
                } else if (errJson.message) {
                   cleanMsg = errJson.message;
                }
             } else if (errJson.message) {
                cleanMsg = errJson.message;
             }
           } catch(e) {}
           throw new Error(cleanMsg);
        }
        
        const json = await res.json();
        if (json && (json.status === "success" || Array.isArray(json.leads) || json.status === "partial_success")) return json;
        
        throw new Error("Backend returned success but the data payload format was invalid.");
      } catch (e: any) {
        clearTimeout(timer);
        console.error("[LeadEngine] Backend failure:", e);
        throw new Error(e.message || "Failed to reach the Lead Engine backend.");
      }
    }

    const data = await fetchLeads();
    if (data && data.status === "error") {
      throw new Error(data.message || "Local engine reported an error");
    }
    currentStep.value = 3;

    let ingestedLeads: any[] = [];

    if (data && (data.status === "success" || Array.isArray(data.leads)) && data.leads) {
      const dbInstance = db.value;
      const rtdbInstance = rtdb.value;

      ingestedLeads = Array.isArray(data.leads) ? data.leads : [data.leads];

      if (skipExisting.value && props.existingLeads) {
        ingestedLeads = ingestedLeads.filter(l => !props.existingLeads!.some(existing =>
          existing.company.toLowerCase() === (l.company || "").toLowerCase()
        ));
      }

      for (const lead of ingestedLeads) {
        processedLeads.value += 1;

        const newLeadPayload = {
          name:            lead.company      || "Unknown Lead",
          company:         lead.company      || "Unknown Company",
          phone:           lead.phone        || "",
          email:           lead.email        || "",
          website:         lead.website      || "",
          pickupAddress:   lead.location     || "Pending",
          deliveryAddress: "Pending",
          source:          lead.source       || "Lead Engine",
          status:          "New",
          priority:        (lead.lead_score ?? 0) >= 75 ? "Hot" : (lead.lead_score ?? 0) >= 50 ? "Warm" : "Cold",
          estimatedValue:  0,
          leadScore:       lead.lead_score   ?? 0,
          customerNotes:   lead.ai_summary   || "",
          notes:           lead.draft_email  ? `AI Suggested Email Draft:\n${lead.draft_email}` : "",
          createdAt:       new Date().toISOString()
        };

        if (rtdbInstance && hasRealtimeDatabaseConfig.value) {
          push(databaseRef(rtdbInstance, realtimeAiLeadsPath.value), newLeadPayload);
        } else if (dbInstance && isFirebaseConfigured.value) {
          await addDoc(collection(dbInstance, aiLeadsCollectionName.value), {
            ...newLeadPayload,
            createdAt: serverTimestamp()
          });
        }
      }
    }

    const extrasSkipped = data?.leads ? data.leads.length - ingestedLeads.length : 0;

    clearInterval(simInterval);
    currentStep.value = 4;
    
    // Trigger notification when successful
    sendCompletionNotification(processedLeads.value);

    setTimeout(() => {
      viewState.value = 'success';
      if (processedLeads.value === 0 && extrasSkipped > 0) {
        console.info(`[LeadEngine] Skipped ${extrasSkipped} duplicate leads already in your CRM.`);
      }
      
      // Automatic Redirection to the CRM 1.5 seconds after success
      setTimeout(() => {
         if (!isMinimized.value) viewLeads();
      }, 1500);
    }, 800);

  } catch (err: any) {
    console.error("[LeadEngine] Fatal error:", err);
    errorMessage.value = err?.message || "An unexpected error occurred in the Lead Engine pipeline.";
    clearInterval(simInterval);
    viewState.value = 'error';
    // If error occurs while minimized, restore to show error
    isMinimized.value = false;
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    await Notification.requestPermission();
  }
}

function sendCompletionNotification(count: number) {
  // 1. Play Completion Sound
  if (completionSound) {
    completionSound.volume = 0.5;
    completionSound.play().catch(e => console.warn("[LeadEngine] Could not play notification sound:", e));
  }

  // 2. Browser notification
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Extraction Complete 🚀", {
      body: `${count} high-intent leads successfully injected into your CRM.`,
      icon: "/favicon.ico" 
    });
  }

  // 3. Beautiful In-App Popup
  showCompletionPopup.value = true;
  // Auto-hide after 8 seconds
  setTimeout(() => {
    showCompletionPopup.value = false;
  }, 8000);
}

onMounted(() => {
  requestNotificationPermission();
  // ... existing code
});

function cancelScraping() {
   clearInterval(simInterval);
   viewState.value = 'setup';
   processedLeads.value = 0;
}

onUnmounted(() => {
  if (simInterval) clearInterval(simInterval);
  document.removeEventListener('mousedown', handleLocationOutsideClick);
});

// View Leads action
function viewLeads() {
  closeModal();
  router.push('/ai-leads');
}
</script>

<template>
  <div v-if="isOpen" 
    class="z-[100] font-body transition-all duration-500"
    :class="isMinimized ? 'fixed bottom-0 right-0 p-0 pointer-events-none' : 'fixed inset-0 flex items-center justify-center p-4 sm:p-6 sm:mt-0'"
  >
    <!-- Overlay -->
    <div 
      v-if="!isMinimized"
      class="absolute inset-0 bg-surface-contrast/20 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300" 
      @click="viewState === 'setup' || viewState === 'success' ? closeModal() : null" 
    />
    
    <!-- Modal Panel -->
    <div
      class="bg-surface relative w-full overflow-hidden rounded-[24px] shadow-[0_36px_100px_rgba(11,94,215,0.1)] border border-outline-variant/20 dark:border-white/5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      :class="[
        isMinimized ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto',
        viewState === 'setup'    ? 'max-w-[660px] max-h-[90vh] flex flex-col' : '',
        viewState === 'progress' ? 'max-w-[620px]' : '',
        viewState === 'success'  ? 'max-w-md' : '',
        viewState === 'error'    ? 'max-w-md' : ''
      ]"
      style="animation: modal-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1);"
    >
      
      <!-- ==================== -->
      <!-- SETUP (INITIAL VIEW) -->
      <!-- ==================== -->
      <template v-if="viewState === 'setup'">
        <!-- Header -->
        <div class="px-8 pt-8 pb-5 flex-none border-b border-outline-variant/15 relative overflow-hidden bg-surface dark:bg-surface-container-lowest">
          <div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          <div class="flex items-start justify-between relative z-10">
            <div>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Search class="h-5 w-5" stroke-width="2.5" />
                </div>
                <h2 class="text-2xl font-black tracking-tight text-on-surface">Scrape Engine</h2>
              </div>
              <p class="text-[13px] text-outline mt-2 font-semibold">
                Configure intent signals and extraction targets.
              </p>
            </div>
            <div class="flex items-center gap-2">

              <button
                @click="closeModal"
                class="rounded-full p-2 text-outline hover:bg-surface-variant hover:text-on-surface transition-colors"
              >
                <X class="h-5 w-5" stroke-width="2.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Narrow Form Body -->
        <div class="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8 bg-surface-container-lowest dark:bg-[#080d16]">
            
            <!-- SECTION: Target Acquisition -->
            <div class="space-y-6">
              
              <!-- Keywords -->
              <div class="space-y-2">
                 <label class="text-[13px] font-black text-on-surface tracking-wide flex items-center gap-2">Target Keywords</label>
                 <div class="flex flex-wrap items-center gap-2 rounded-[14px] border border-outline-variant/40 bg-surface p-3 min-h-[56px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                   <template v-for="kw in keywords" :key="kw">
                     <span class="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-bold text-primary border border-primary/20">
                       {{ kw }}
                       <button @click="removeKeyword(kw)" class="hover:text-primary transition-colors hover:bg-primary/20 rounded-full p-0.5">
                         <X class="h-3 w-3" stroke-width="3" />
                       </button>
                     </span>
                   </template>
                   <input
                     v-model="keywordInput"
                     @keydown="addKeyword"
                     placeholder="e.g. freight forwarder..."
                     class="min-w-[150px] flex-1 bg-transparent px-2 py-1 text-[13px] font-semibold text-on-surface placeholder:text-outline outline-none border-none focus:ring-0"
                   />
                 </div>
              </div>

              <!-- Location -->
              <div class="space-y-2">
                 <label class="text-[13px] font-black text-on-surface tracking-wide flex items-center gap-2">Geographic Region</label>
                 <div class="relative group" ref="locationRef">
                   <MapPin class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline transition-colors" stroke-width="2.5" />
                   <input
                     v-model="locationSearch"
                     @focus="showPredictions = true"
                     placeholder="e.g. London, United Kingdom"
                     class="w-full appearance-none rounded-[14px] border border-outline-variant/40 bg-surface py-3.5 px-11 text-[13px] font-semibold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                   />
                   <div v-if="showPredictions && placePredictions.length > 0" class="absolute z-50 left-0 right-0 top-[calc(100%+6px)] max-h-52 overflow-y-auto rounded-[14px] border border-outline-variant/30 bg-surface shadow-xl py-2 no-scrollbar">
                     <button
                       v-for="place in placePredictions"
                       :key="place.place_id"
                       @click.prevent="selectLocation(place)"
                       class="w-full text-left px-5 py-2.5 text-[13px] font-bold text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                     >
                       <MapPin class="h-4 w-4 shrink-0 text-outline" />
                       <span class="truncate">{{ place.description }}</span>
                     </button>
                   </div>
                 </div>
              </div>

              <!-- Volume Slider -->
              <div class="space-y-4 pt-2">
                 <div class="flex items-center justify-between">
                   <label class="text-[13px] font-black text-on-surface tracking-wide">Extraction Volume</label>
                   <div class="text-[12px] font-black bg-surface-variant text-on-surface px-3 py-1 rounded-lg border border-outline-variant/40">
                     {{ maxLeads }} <span class="opacity-60 font-semibold ml-0.5">Leads</span>
                   </div>
                 </div>
                 <div class="relative w-full px-1">
                   <input
                     type="range"
                     v-model="maxLeads"
                     min="10"
                     max="100"
                     step="10"
                     class="custom-slider w-full h-1.5 appearance-none rounded-full bg-outline-variant/40 outline-none"
                   />
                   <div class="flex justify-between items-center mt-3 text-[10px] font-bold text-outline">
                     <span>10</span>
                     <span>50</span>
                     <span>100</span>
                   </div>
                 </div>
              </div>
            </div>

            <hr class="border-outline-variant/20" />

            <!-- SECTION: Pipeline Configuration -->
            <div class="space-y-4">
              <label class="text-[13px] font-black text-on-surface tracking-wide">Intelligence Pipelines</label>
              
              <!-- Source Toggles (Compact List) -->
              <div class="flex flex-col gap-2 rounded-[16px] border border-outline-variant/30 bg-surface p-2 shadow-sm">
                
                <!-- Maps -->
                <label class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-variant/50 cursor-pointer transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="text-blue-500 bg-blue-500/10 p-2 rounded-lg"><MapPin class="w-4 h-4" /></div>
                    <div>
                      <div class="text-[13px] font-extrabold text-on-surface">Google Maps Core</div>
                      <div class="text-[11px] font-medium text-outline">Extract verified business listings</div>
                    </div>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center pr-1">
                    <div class="h-5 w-9 rounded-full transition-colors duration-300" :class="sourceMaps ? 'bg-primary' : 'bg-outline-variant/40'"></div>
                    <div class="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300" :class="sourceMaps ? 'translate-x-4' : ''"></div>
                    <input type="checkbox" v-model="sourceMaps" class="hidden" />
                  </label>
                </label>

                <!-- UK Company Directories -->
                <label class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-variant/50 cursor-pointer transition-colors border-t border-outline-variant/10">
                  <div class="flex items-center gap-3">
                    <div class="text-emerald-600 bg-emerald-500/10 p-2 rounded-lg">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18M9 21V9l6-6 6 6v12M9 21h6M12 9v4m0 0v4m0-4h4m-4 0H8"/></svg>
                    </div>
                    <div>
                      <div class="text-[13px] font-extrabold text-on-surface">UK Company Directories</div>
                      <div class="text-[11px] font-medium text-outline">Companies House · registered businesses</div>
                    </div>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center pr-1">
                    <div class="h-5 w-9 rounded-full transition-colors duration-300" :class="sourceDirectories ? 'bg-emerald-600' : 'bg-outline-variant/40'"></div>
                    <div class="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300" :class="sourceDirectories ? 'translate-x-4' : ''"></div>
                    <input type="checkbox" v-model="sourceDirectories" class="hidden" />
                  </label>
                </label>

                <!-- System AI Filter -->
                <label class="flex items-center justify-between p-3 rounded-xl hover:bg-surface-variant/50 cursor-pointer transition-colors border-t border-outline-variant/10">
                  <div class="flex items-center gap-3">
                    <div class="text-purple-500 bg-purple-500/10 p-2 rounded-lg"><Rocket class="w-4 h-4" /></div>
                    <div>
                      <div class="text-[13px] font-extrabold text-on-surface">AI Filtering Layer</div>
                      <div class="text-[11px] font-medium text-outline">Discard poor-fit prospects instantly</div>
                    </div>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center pr-1">
                    <div class="h-5 w-9 rounded-full transition-colors duration-300" :class="enableAIFiltering ? 'bg-primary' : 'bg-outline-variant/40'"></div>
                    <div class="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300" :class="enableAIFiltering ? 'translate-x-4' : ''"></div>
                    <input type="checkbox" v-model="enableAIFiltering" class="hidden" />
                  </label>
                </label>

              </div>
            </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex-none flex items-center justify-between py-5 px-8 bg-surface border-t border-outline-variant/15 relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <div class="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center gap-2">
             <span class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></span>
             Engine Ready
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="closeModal"
              class="px-5 py-2.5 text-[13px] font-bold text-outline hover:text-on-surface rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              @click="startScraping"
              class="group flex items-center justify-center gap-2 rounded-xl bg-on-surface px-6 py-2.5 text-[13px] font-bold text-surface shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span>Launch</span>
              <Rocket class="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" stroke-width="2.5" />
            </button>
          </div>
        </div>
      </template>

      <!-- ======================== -->
      <!-- PROGRESS (SCRAPING VIEW) -->
      <template v-else-if="viewState === 'progress'">
        <div 
          class="relative w-full overflow-hidden" 
          :class="isMinimized ? 'opacity-0 scale-95 pointer-events-none absolute' : 'opacity-100 scale-100'"
          style="background: radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 100%, rgba(14,165,233,0.05) 0%, transparent 55%), #ffffff; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);"
        >

          <!-- Header Controls -->
          <div class="absolute right-5 top-5 flex items-center gap-2 z-20">
            <button @click="toggleMinimize" class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Minimize">
              <Minimize2 class="w-4 h-4" />
            </button>
            <button @click="cancelScraping" class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all" title="Abort">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- === CENTRAL VISUALIZATION === -->
          <div class="flex flex-col items-center pt-10 pb-6 relative z-10">

            <!-- Radar Ring Stack -->
            <div class="relative flex items-center justify-center mb-8" style="width:160px;height:160px;">
              <!-- Outer pulse ring -->
              <div class="absolute inset-0 rounded-full animate-ping opacity-10" style="background: radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%);"></div>
              
              <!-- SVG spinning arcs -->
              <svg class="absolute inset-0 w-full h-full" style="animation: spin 6s linear infinite;" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(99,102,241,0.12)" stroke-width="1.5"/>
                <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(99,102,241,0.7)" stroke-width="1.5" stroke-dasharray="60 392" stroke-linecap="round"/>
                <circle cx="80" cy="80" r="72" fill="none" stroke="rgba(99,102,241,0.35)" stroke-width="1.5" stroke-dasharray="20 432" stroke-dashoffset="200" stroke-linecap="round"/>
              </svg>
              <svg class="absolute inset-0 w-full h-full" style="animation: spin 4s linear infinite reverse;" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(14,165,233,0.07)" stroke-width="1"/>
                <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(14,165,233,0.5)" stroke-width="1" stroke-dasharray="40 324" stroke-linecap="round"/>
              </svg>
              <svg class="absolute inset-0 w-full h-full" style="animation: spin 10s linear infinite;" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="44" fill="none" stroke="rgba(139,92,246,0.15)" stroke-width="1"/>
                <circle cx="80" cy="80" r="44" fill="none" stroke="rgba(139,92,246,0.4)" stroke-width="1" stroke-dasharray="25 251" stroke-dashoffset="80" stroke-linecap="round"/>
              </svg>
              
              <!-- Core icon -->
              <div class="relative z-10 flex items-center justify-center w-20 h-20 rounded-[22px]" style="background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(14,165,233,0.15) 100%); border: 1px solid rgba(99,102,241,0.2); box-shadow: 0 0 40px rgba(99,102,241,0.15), 0 4px 20px rgba(99,102,241,0.1);">
                <Rocket v-if="currentStep <= 1" class="w-8 h-8 text-indigo-500" stroke-width="1.5" style="animation: pulse 2s ease-in-out infinite;" />
                <Brain v-else-if="currentStep === 2" class="w-8 h-8 text-violet-500" stroke-width="1.5" style="animation: pulse 1.5s ease-in-out infinite;" />
                <Database v-else-if="currentStep === 3" class="w-8 h-8 text-sky-500" stroke-width="1.5" style="animation: pulse 1.5s ease-in-out infinite;" />
                <CheckCircle2 v-else class="w-8 h-8 text-emerald-500" stroke-width="1.5" />
              </div>
            </div>

            <!-- Live status label -->
            <div class="flex items-center gap-2 mb-1">
              <span class="flex h-1.5 w-1.5 rounded-full bg-indigo-500" style="box-shadow: 0 0 6px rgba(99,102,241,0.8); animation: pulse 1s infinite;"></span>
              <span class="text-[11px] font-black tracking-[0.15em] text-indigo-500 uppercase">Live Extraction</span>
            </div>
            <h3 class="text-[18px] font-black text-slate-800 tracking-tight">
              {{ currentStep === 1 ? 'Indexing Directories' : currentStep === 2 ? 'AI Intent Scoring' : currentStep === 3 ? 'Populating CRM' : 'Finalizing...' }}
            </h3>
            <p class="text-[12px] text-slate-400 mt-1 font-medium">
              {{ currentStep === 1 ? 'Crawling Google Maps & business registries...' : currentStep === 2 ? 'Filtering high-intent prospects via LLM...' : 'Writing records to your CRM database...' }}
            </p>
          </div>

          <!-- === STEP TIMELINE === -->
          <div class="flex items-center justify-center gap-0 px-10 mb-6 relative z-10">
            
            <!-- Step 1 -->
            <div class="flex flex-col items-center" style="min-width:100px;">
              <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500"
                :style="currentStep === 1 ? 'background:rgba(99,102,241,0.15);box-shadow:0 0 16px rgba(99,102,241,0.25);border:1.5px solid rgba(99,102,241,0.4)' : currentStep > 1 ? 'background:rgba(16,185,129,0.1);border:1.5px solid rgba(16,185,129,0.4)' : 'background:rgba(0,0,0,0.04);border:1.5px solid rgba(0,0,0,0.1)'">
                <RefreshCcw v-if="currentStep === 1" class="w-3.5 h-3.5 text-indigo-500 animate-spin" stroke-width="2.5"/>
                <CheckCircle2 v-else-if="currentStep > 1" class="w-3.5 h-3.5 text-emerald-500" stroke-width="2.5"/>
                <span v-else class="text-[11px] font-black text-slate-300">1</span>
              </div>
              <span class="text-[10px] font-bold transition-colors" :class="currentStep === 1 ? 'text-indigo-500' : currentStep > 1 ? 'text-slate-400' : 'text-slate-300'">Index</span>
            </div>

            <!-- Connector 1 -->
            <div class="h-px flex-1 mb-6 transition-all duration-1000" :style="currentStep > 1 ? 'background: linear-gradient(90deg, rgba(16,185,129,0.5), rgba(139,92,246,0.5))' : 'background: rgba(0,0,0,0.08)'"></div>

            <!-- Step 2 -->
            <div class="flex flex-col items-center" style="min-width:100px;">
              <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500"
                :style="currentStep === 2 ? 'background:rgba(139,92,246,0.15);box-shadow:0 0 16px rgba(139,92,246,0.25);border:1.5px solid rgba(139,92,246,0.4)' : currentStep > 2 ? 'background:rgba(16,185,129,0.1);border:1.5px solid rgba(16,185,129,0.4)' : 'background:rgba(0,0,0,0.04);border:1.5px solid rgba(0,0,0,0.1)'">
                <Brain v-if="currentStep === 2" class="w-3.5 h-3.5 text-violet-500 animate-pulse" stroke-width="2.5"/>
                <CheckCircle2 v-else-if="currentStep > 2" class="w-3.5 h-3.5 text-emerald-500" stroke-width="2.5"/>
                <span v-else class="text-[11px] font-black text-slate-300">2</span>
              </div>
              <span class="text-[10px] font-bold transition-colors" :class="currentStep === 2 ? 'text-violet-500' : currentStep > 2 ? 'text-slate-400' : 'text-slate-300'">AI Score</span>
            </div>

            <!-- Connector 2 -->
            <div class="h-px flex-1 mb-6 transition-all duration-1000" :style="currentStep > 2 ? 'background: linear-gradient(90deg, rgba(139,92,246,0.5), rgba(14,165,233,0.5))' : 'background: rgba(0,0,0,0.08)'"></div>

            <!-- Step 3 -->
            <div class="flex flex-col items-center" style="min-width:100px;">
              <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500"
                :style="currentStep === 3 ? 'background:rgba(14,165,233,0.15);box-shadow:0 0 16px rgba(14,165,233,0.25);border:1.5px solid rgba(14,165,233,0.4)' : currentStep > 3 ? 'background:rgba(16,185,129,0.1);border:1.5px solid rgba(16,185,129,0.4)' : 'background:rgba(0,0,0,0.04);border:1.5px solid rgba(0,0,0,0.1)'">
                <Database v-if="currentStep === 3" class="w-3.5 h-3.5 text-sky-500 animate-pulse" stroke-width="2.5"/>
                <CheckCircle2 v-else-if="currentStep > 3" class="w-3.5 h-3.5 text-emerald-500" stroke-width="2.5"/>
                <span v-else class="text-[11px] font-black text-slate-300">3</span>
              </div>
              <span class="text-[10px] font-bold transition-colors" :class="currentStep === 3 ? 'text-sky-500' : currentStep > 3 ? 'text-slate-400' : 'text-slate-300'">CRM Sync</span>
            </div>
          </div>

          <!-- === STATS FOOTER === -->
          <div class="mx-6 mb-8 rounded-[14px] relative z-10" style="background:rgba(248,250,252,1);border:1px solid rgba(0,0,0,0.07);">
            <div class="flex items-center divide-x divide-slate-100">
              <div class="flex-1 flex flex-col items-center py-4">
                <span class="text-[20px] font-black text-slate-800 tracking-tight">{{ elapsedTime }}<span class="text-[12px] text-slate-400 font-semibold ml-0.5">s</span></span>
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Elapsed</span>
              </div>
              <div class="flex-1 flex flex-col items-center py-4">
                <span class="text-[20px] font-black tracking-tight" :class="processedLeads > 0 ? 'text-emerald-500' : 'text-slate-200'">{{ processedLeads }}</span>
                <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Captured</span>
              </div>
              <div class="flex-1 flex flex-col items-center py-4">
                <button @click="cancelScraping" class="text-[11px] font-black text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider">Abort</button>
                <span class="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mt-0.5">Mission</span>
              </div>
            </div>
          </div>

        </div>
      </template>

            <!-- ======================= -->
      <!-- SUCCESS (COMPLETED) VIEW -->
      <!-- ======================= -->
      <template v-else-if="viewState === 'success'">
        <div class="p-12 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-green-50/50 to-surface dark:from-green-900/10 dark:to-surface h-[520px] justify-center">
          
          <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMzQsIDE5NywgOTQsIDAuMDUpIi8+PC9zdmc+')] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)] pointer-events-none"></div>

          <!-- Green Success Radar -->
          <div class="relative w-[120px] h-[120px] flex items-center justify-center mb-8">
             <div class="absolute inset-[-30%] rounded-full bg-green-500/10 animate-[ping_2s_ease-out_infinite]"></div>
             
             <div class="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(34,197,94,0.4)] relative z-10 border-4 border-white dark:border-[#0c1322]">
               <Check class="w-10 h-10 transform -translate-y-0.5" stroke-width="3" />
             </div>
             
             <svg class="absolute inset-0 w-full h-full animate-[spin_6s_linear_infinite]" viewBox="0 0 100 100">
               <circle cx="50" cy="50" r="48" fill="none" class="stroke-green-500/20" stroke-width="2" />
               <circle cx="50" cy="50" r="48" fill="none" class="stroke-green-500/80" stroke-dasharray="60 200" stroke-width="2" stroke-linecap="round" />
             </svg>
          </div>
          
          <h2 class="text-3xl font-black tracking-tight text-on-surface mb-3 font-display drop-shadow-sm">
            {{ processedLeads > 0 ? 'Extraction Complete' : 'Discovery Finished' }}
          </h2>
          <p class="text-[14px] text-outline font-semibold mb-10 tracking-wide">
            <template v-if="processedLeads > 0">
              {{ processedLeads }} high-intent leads successfully injected.<br>They are ready for review in your CRM.
            </template>
            <template v-else>
              The engine finished its run but no new leads were identified.<br>Try expanding your keywords or region.
            </template>
          </p>
          
          <!-- Unified Action Block -->
          <div class="w-full max-w-[320px] space-y-4 relative z-10">
            <button @click="viewLeads" class="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-extrabold text-[15px] py-4 rounded-2xl shadow-[0_8px_20px_rgba(34,197,94,0.25)] hover:shadow-[0_12px_25px_rgba(34,197,94,0.35)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group">
              View CRM Pipeline
              <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" stroke-width="2.5" />
            </button>
            <button @click="closeModal" class="w-full bg-surface-container hover:bg-surface-container-high text-[13px] font-extrabold text-on-surface py-3.5 rounded-2xl transition-all">
              Return to Engine
            </button>
          </div>

        </div>
      </template>

      <!-- =================== -->
      <!-- ERROR VIEW           -->
      <!-- =================== -->
      <template v-else-if="viewState === 'error'">
        <div class="p-12 flex flex-col items-center text-center bg-gradient-to-b from-red-50/50 to-surface dark:from-red-900/10 dark:to-surface h-[440px] justify-center">
          <div class="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-6">
            <svg class="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 class="text-2xl font-black tracking-tight mb-3">Engine Error</h2>
          <p class="text-sm text-outline font-medium mb-4 max-w-xs">{{ errorMessage }}</p>
          <p class="text-xs text-outline/60 font-medium mb-8 max-w-xs">Check your network connection, API keys, and Firebase permissions, then try again.</p>
          <div class="w-full max-w-[280px] space-y-3">
            <button
              @click="() => { viewState = 'setup'; processedLeads = 0; }"
              class="w-full bg-primary text-white font-extrabold text-[14px] py-3.5 rounded-2xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Try Again
            </button>
            <button @click="closeModal" class="w-full bg-surface-container text-sm font-bold text-on-surface-variant py-3 rounded-2xl transition-all hover:bg-surface-container-high">
              Close
            </button>
          </div>
        </div>
      </template>

    </div>

    <!-- Floating Minimized Indicator -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        enter-from-class="translate-y-20 opacity-0 scale-90"
        enter-to-class="translate-y-0 opacity-100 scale-100"
        leave-active-class="transition duration-300 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-90"
      >
        <div 
          v-if="viewState === 'progress' && isMinimized"
          @click="toggleMinimize"
          class="fixed bottom-8 right-8 z-[200] group cursor-pointer"
        >
          <!-- Progress Ring Background -->
          <div class="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(79,70,229,0.3)] border border-indigo-500/20 flex items-center justify-center overflow-hidden">
            <!-- Animated Gradient Background -->
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-sky-500/10 animate-pulse"></div>
            
            <!-- SVGs for progress -->
            <svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="3" class="text-slate-100 dark:text-slate-800" />
              <circle 
                cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="3" 
                class="text-indigo-600 transition-all duration-1000 ease-out"
                stroke-dasharray="175.9"
                :stroke-dashoffset="175.9 * (1 - progressPercent / 100)"
                stroke-linecap="round"
              />
            </svg>

            <!-- Icon -->
            <div class="relative z-10">
              <Rocket v-if="currentStep <= 1" class="w-6 h-6 text-indigo-500 animate-pulse" />
              <Brain v-else-if="currentStep === 2" class="w-6 h-6 text-violet-500 animate-pulse" />
              <Database v-else-if="currentStep === 3" class="w-6 h-6 text-sky-500 animate-pulse" />
              <CheckCircle2 v-else class="w-6 h-6 text-emerald-500" />
            </div>

            <!-- Tooltip -->
            <div class="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900 text-white text-[11px] font-black rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none shadow-xl">
              <div class="flex flex-col gap-0.5">
                <span class="text-indigo-300 uppercase tracking-widest text-[9px]">{{ currentStep === 1 ? 'INDEXING' : currentStep === 2 ? 'SCORING' : 'SYNCING' }}</span>
                <span>{{ processedLeads }} Leads Captured ({{ progressPercent }}%)</span>
              </div>
            </div>
          </div>
          
          <!-- Pulse ring -->
          <div class="absolute inset-0 rounded-2xl border-2 border-indigo-500/50 animate-[ping_2s_infinite] pointer-events-none"></div>
        </div>
      </Transition>
    </Teleport>

    <!-- Beautiful In-App Completion Popup -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        enter-from-class="-translate-y-24 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-500 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-24 opacity-0"
      >
        <div 
          v-if="showCompletionPopup"
          class="fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-lg"
        >
          <div class="relative overflow-hidden group">
            <!-- Glassmorphism Container -->
            <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl shadow-[0_25px_60px_-15px_rgba(79,70,229,0.3)] p-4 pr-12">
              
              <!-- Subtle animated background gradient -->
              <div class="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
              
              <div class="flex items-center gap-4">
                <!-- Iconic Success Visual -->
                <div class="relative flex-shrink-0">
                  <div class="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse rounded-full"></div>
                  <div class="relative w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Check class="w-7 h-7 text-white stroke-[3px]" />
                  </div>
                </div>

                <!-- Text Content -->
                <div class="flex-grow">
                  <h4 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-0.5">Extraction Complete</h4>
                  <p class="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                    <span class="text-indigo-600 dark:text-indigo-400 font-bold">{{ processedLeads }} high-intent leads</span> have been injected into your CRM.
                  </p>
                </div>

                <!-- Action button -->
                <button 
                  @click="showCompletionPopup = false; isMinimized = false;"
                  class="flex-shrink-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-tight hover:scale-105 active:scale-95 transition-all shadow-md group-hover:shadow-indigo-500/20"
                >
                  View Leads
                </button>
              </div>

              <!-- Close button -->
              <button 
                @click="showCompletionPopup = false"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Dismiss"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Auto-hide progress indicator -->
            <div class="absolute bottom-0 left-0 h-0.5 bg-indigo-500/50 animate-[shrink_8s_linear_forwards]" style="width: 100%;"></div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}

@keyframes ping {
  0% { transform: scale(1); opacity: 0.5; }
  70%, 100% { transform: scale(1.6); opacity: 0; }
}
</style>

<style>
/* Custom Slider Appearance */
.custom-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 0 0 4px rgba(70, 72, 212, 0.1);
  transition: box-shadow 0.2s ease-in-out, transform 0.1s;
}

.custom-slider::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 6px rgba(70, 72, 212, 0.2);
  transform: scale(1.15);
}

.custom-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  cursor: pointer;
  box-shadow: 0 0 0 4px rgba(70, 72, 212, 0.1);
  transition: box-shadow 0.2s ease-in-out, transform 0.1s;
}

.custom-slider::-moz-range-thumb:hover {
  box-shadow: 0 0 0 6px rgba(70, 72, 212, 0.2);
  transform: scale(1.15);
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(24px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
