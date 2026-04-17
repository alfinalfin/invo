<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  BadgeCheck,
  BellDot,
  CircleAlert,
  Clock3,
  UsersRound,
} from "lucide-vue-next";
import {
  onValue,
  ref as databaseRef,
  update as updateRealtime,
  remove,
} from "firebase/database";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useFirebaseServices } from "~/composables/useFirebaseServices";
import { mapFirestoreLead, mapRealtimeLeads } from "~/lib/firebase-leads";
import {
  buildLeadMetrics,
  buildSourceData,
  buildSourcePerformance,
  buildStatusData,
  buildTimelineData,
  formatCompactDate,
  getLeadsForRange,
  isLeadOpen,
  leadSources,
  sortLeads,
  type DashboardSection as DashboardSectionKey,
  type DateRangeOption,
  type LeadRecord,
  type LeadSource,
  type LeadStatus,
  type SortOption,
} from "~/lib/crm";
import { playLeadNotifications, stopLeadNotification } from "~/lib/notification-sound";

const props = defineProps<{
  section: DashboardSectionKey;
}>();

import CrmPodDrawer from "./CrmPodDrawer.vue";
import ScrapeLeadsModal from "./ScrapeLeadsModal.vue";
import AiLeadsSection from "./AiLeadsSection.vue";
import ImportLeadsModal from "./ImportLeadsModal.vue";

type PatchPayload = {
  leadId: string;
  status: LeadStatus;
  notes: string;
  lastContactedAt?: string;
  estimatedValue?: number;
  podDeliveryDate?: string;
  podDriverName?: string;
  podVehicleReg?: string;
  podPieces?: string;
  podWeight?: string;
  podDimensions?: string;
  podGoodsDescription?: string;
  podNotes?: string;
  podGoodsItems?: string;
};

const summaryIcons = [UsersRound, BellDot, BadgeCheck, Clock3];
const {
  db,
  firebaseLeadDataSource,
  hasRealtimeDatabaseConfig,
  isFirebaseConfigured,
  leadsCollectionName,
  realtimeLeadsPath,
  aiLeadsCollectionName,
  realtimeAiLeadsPath,
  rtdb,
} = useFirebaseServices();

const firestoreRulesPreview = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    match /quotes/{quoteId} {
      allow read, list, update, delete: if isAdmin();
      allow create: if isAdmin();
    }
  }
}`;

const realtimeDatabaseRulesPreview = computed(
  () => `{
  "rules": {
    "${realtimeLeadsPath.value}": {
      ".read": "auth != null && auth.token.admin === true",
      ".write": "auth != null && auth.token.admin === true"
    }
  }
}`,
);

const sectionLinks = [
  { href: "/", label: "Dashboard", key: "dashboard" },
  { href: "/leads", label: "Leads", key: "leads" },
  { href: "/analytics", label: "Analytics", key: "analytics" },
  { href: "/settings", label: "Settings", key: "settings" },
] as const;

const searchValue = ref("");
const statusFilter = ref<LeadStatus | "All">(
  props.section === "converted_leads" ? "Converted" : "All"
);
const sourceFilter = ref<LeadSource | "All">("All");
const sortOption = ref<SortOption>("newest");
const dateRange = ref<DateRangeOption>("30d");
const page = ref(1);
const selectedLeadId = ref<string | null>(null);
const selectedPodLeadId = ref<string | null>(null);
const notificationCount = ref(0);
const isDarkMode = ref(false);
const isLoading = ref(true);
const isSavingLead = ref(false);
const error = ref<string | null>(null);
const leads = ref<LeadRecord[]>([]);
const aiLeads = ref<LeadRecord[]>([]);

let cleanupListener: (() => void) | null = null;
let aiCleanupListener: (() => void) | null = null;

const deferredSearch = computed(() => searchValue.value.trim().toLowerCase());
const showImportModal = ref(false);

const selectedPodLead = computed(() => {
  if (!selectedPodLeadId.value) return null;
  return leads.value.find((l) => l.id === selectedPodLeadId.value) || null;
});

function clearWorkspaceListener() {
  cleanupListener?.();
  cleanupListener = null;
  aiCleanupListener?.();
  aiCleanupListener = null;
}

function syncWorkspaceDataSource() {
  if (import.meta.server) {
    return;
  }

  clearWorkspaceListener();

  const rtdbInstance = rtdb.value;
  const dbInstance = db.value;

  if (rtdbInstance && hasRealtimeDatabaseConfig.value) {
    let ready = false;
    let previousIds = new Set<string>();
    const leadsRef = databaseRef(rtdbInstance, realtimeLeadsPath.value);

    cleanupListener = onValue(
      leadsRef,
      (snapshot) => {
        const nextLeads = sortLeads(mapRealtimeLeads(snapshot.val()), "newest");
        const nextIds = new Set(nextLeads.map((lead) => lead.id));

        leads.value = nextLeads;
        isLoading.value = false;
        error.value = null;

        if (ready) {
          const additions = nextLeads.filter((lead) => !previousIds.has(lead.id)).length;
          if (additions > 0) {
            notificationCount.value += additions;
            playLeadNotifications(additions);
          }
        } else {
          ready = true;
        }

        previousIds = nextIds;
      },
      (snapshotError) => {
        error.value = snapshotError.message;
        isLoading.value = false;
      },
    );

    // AI Leads Listener
    aiCleanupListener = onValue(
      databaseRef(rtdbInstance, realtimeAiLeadsPath.value),
      (snapshot) => {
        aiLeads.value = sortLeads(mapRealtimeLeads(snapshot.val()), "newest");
      }
    );

    return;
  }

  if (dbInstance && isFirebaseConfigured.value && !hasRealtimeDatabaseConfig.value) {
    let ready = false;
    const leadsQuery = query(
      collection(dbInstance, leadsCollectionName.value),
      orderBy("createdAt", "desc"),
    );

    cleanupListener = onSnapshot(
      leadsQuery,
      (snapshot) => {
        leads.value = snapshot.docs.map(mapFirestoreLead);
        isLoading.value = false;
        error.value = null;

        if (ready) {
          const additions = snapshot.docChanges().filter(
            (change) => change.type === "added",
          ).length;
          if (additions > 0) {
            notificationCount.value += additions;
            playLeadNotifications(additions);
          }
        } else {
          ready = true;
        }
      },
      (snapshotError) => {
        error.value = snapshotError.message;
        isLoading.value = false;
      },
    );

    // AI Leads Firestore Listener
    aiCleanupListener = onSnapshot(
      query(collection(dbInstance, aiLeadsCollectionName.value), orderBy("createdAt", "desc")),
      (snapshot) => {
        aiLeads.value = snapshot.docs.map(mapFirestoreLead);
      }
    );

    return;
  }

  if (isFirebaseConfigured.value) {
    return;
  }

  leads.value = [];
  isLoading.value = false;
  error.value =
    "Firebase is not configured. Add your NUXT_PUBLIC_FIREBASE_* keys to .env.local and restart.";
}

watch([rtdb, db], syncWorkspaceDataSource, { immediate: true });

onMounted(() => {
  isDarkMode.value = document.documentElement.dataset.theme === "dark";
});

onBeforeUnmount(() => {
  clearWorkspaceListener();
});

watch(
  [deferredSearch, statusFilter, sourceFilter, sortOption, dateRange],
  () => {
    page.value = 1;
  },
);

const leadsInRange = computed(() => getLeadsForRange(leads.value, dateRange.value));

const filteredLeads = computed(() =>
  sortLeads(
    leadsInRange.value.filter((lead) => {
      const matchesSearch =
        deferredSearch.value.length === 0 ||
        [
          lead.name,
          lead.company,
          lead.email,
          lead.phone,
          lead.pickupAddress,
          lead.deliveryAddress,
          lead.routeLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(deferredSearch.value);

      const matchesStatus =
        statusFilter.value === "All" ? true : lead.status === statusFilter.value;
      const matchesSource =
        sourceFilter.value === "All" ? lead.source !== "Lead Engine" : lead.source === sourceFilter.value;

      return matchesSearch && matchesStatus && matchesSource;
    }),
    sortOption.value,
  ),
);

const pageSize = 8;
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredLeads.value.length / pageSize)),
);
const currentPage = computed(() => Math.min(page.value, totalPages.value));
const pagedLeads = computed(() =>
  filteredLeads.value.slice(
    (currentPage.value - 1) * pageSize,
    currentPage.value * pageSize,
  ),
);
const selectedLead = computed(
  () => leads.value.find((lead) => lead.id === selectedLeadId.value) ?? null,
);
const metrics = computed(() => buildLeadMetrics(leads.value));
const timelineData = computed(() => buildTimelineData(leadsInRange.value, dateRange.value));
const statusData = computed(() => buildStatusData(leadsInRange.value));
const sourceData = computed(() => buildSourceData(leadsInRange.value));
const sourcePerformance = computed(() =>
  buildSourcePerformance(leadsInRange.value)
    .filter((item) => item.total > 0)
    .sort((left, right) => right.total - left.total),
);
const recentLeads = computed(() => sortLeads(leads.value, "newest").slice(0, 5));
const urgentLeads = computed(() =>
  sortLeads(
    leads.value.filter(
      (lead) => lead.priority === "Urgent" || lead.status === "New",
    ),
    "newest",
  ).slice(0, 4),
);
const todayCount = computed(() => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return leads.value.filter((lead) => new Date(lead.createdAt) >= startOfToday).length;
});
const openLeadCount = computed(() =>
  leads.value.filter((lead) => isLeadOpen(lead.status)).length,
);
const convertedLeads = computed(() =>
  leads.value.filter((lead) => lead.status === "Converted"),
);
const averageDealValue = computed(() =>
  convertedLeads.value.length > 0
    ? Math.round(
        convertedLeads.value.reduce(
          (total, lead) => total + lead.estimatedValue,
          0,
        ) / convertedLeads.value.length,
      )
    : 0,
);
const topSource = computed(() => sourcePerformance.value[0]);
const conversionRate = computed(() =>
  leads.value.length > 0
    ? Math.round((convertedLeads.value.length / leads.value.length) * 100)
    : 0,
);
const latestBySource = computed(() =>
  Object.fromEntries(
    leadSources.map((source) => {
      const latestLead = recentLeads.value.find((lead) => lead.source === source);
      return [source, latestLead ? formatCompactDate(latestLead.createdAt) : "No recent lead"];
    }),
  ),
);

async function handleSaveLead(payload: PatchPayload) {
  isSavingLead.value = true;

  leads.value = leads.value.map((lead) =>
    lead.id === payload.leadId
      ? {
          ...lead,
          status: payload.status,
          notes: payload.notes,
          lastContactedAt: payload.lastContactedAt,
          estimatedValue: payload.estimatedValue ?? lead.estimatedValue,
          podDeliveryDate: payload.podDeliveryDate ?? lead.podDeliveryDate,
          podDriverName: payload.podDriverName ?? lead.podDriverName,
          podVehicleReg: payload.podVehicleReg ?? lead.podVehicleReg,
          podPieces: payload.podPieces ?? lead.podPieces,
          podWeight: payload.podWeight ?? lead.podWeight,
          podDimensions: payload.podDimensions ?? lead.podDimensions,
          podGoodsDescription: payload.podGoodsDescription ?? lead.podGoodsDescription,
          podNotes: payload.podNotes ?? lead.podNotes,
          podGoodsItems: payload.podGoodsItems ?? (lead as any).podGoodsItems,
        }
      : lead,
  );

  try {
    const rtdbInstance = rtdb.value;
    if (rtdbInstance && hasRealtimeDatabaseConfig.value) {
      const path =
        payload.leadId === "root"
          ? realtimeLeadsPath.value
          : `${realtimeLeadsPath.value}/${payload.leadId}`;
      await updateRealtime(databaseRef(rtdbInstance, path), {
        status: payload.status,
        notes: payload.notes,
        lastContactedAt: payload.lastContactedAt ?? null,
        updatedAt: new Date().toISOString(),
        ...(payload.estimatedValue !== undefined ? { estimatedValue: payload.estimatedValue } : {}),
        ...(payload.podDeliveryDate !== undefined ? { podDeliveryDate: payload.podDeliveryDate } : {}),
        ...(payload.podDriverName !== undefined ? { podDriverName: payload.podDriverName } : {}),
        ...(payload.podVehicleReg !== undefined ? { podVehicleReg: payload.podVehicleReg } : {}),
        ...(payload.podPieces !== undefined ? { podPieces: payload.podPieces } : {}),
        ...(payload.podWeight !== undefined ? { podWeight: payload.podWeight } : {}),
        ...(payload.podDimensions !== undefined ? { podDimensions: payload.podDimensions } : {}),
        ...(payload.podGoodsDescription !== undefined ? { podGoodsDescription: payload.podGoodsDescription } : {}),
        ...(payload.podNotes !== undefined ? { podNotes: payload.podNotes } : {}),
        ...(payload.podGoodsItems !== undefined ? { podGoodsItems: payload.podGoodsItems } : {}),
      });

      return;
    }

    const dbInstance = db.value;
    if (dbInstance && isFirebaseConfigured.value) {
      await updateDoc(doc(dbInstance, leadsCollectionName.value, payload.leadId), {
        status: payload.status,
        notes: payload.notes,
        lastContactedAt: payload.lastContactedAt ?? null,
        updatedAt: serverTimestamp(),
        ...(payload.estimatedValue !== undefined ? { estimatedValue: payload.estimatedValue } : {}),
        ...(payload.podDeliveryDate !== undefined ? { podDeliveryDate: payload.podDeliveryDate } : {}),
        ...(payload.podDriverName !== undefined ? { podDriverName: payload.podDriverName } : {}),
        ...(payload.podVehicleReg !== undefined ? { podVehicleReg: payload.podVehicleReg } : {}),
        ...(payload.podPieces !== undefined ? { podPieces: payload.podPieces } : {}),
        ...(payload.podWeight !== undefined ? { podWeight: payload.podWeight } : {}),
        ...(payload.podDimensions !== undefined ? { podDimensions: payload.podDimensions } : {}),
        ...(payload.podGoodsDescription !== undefined ? { podGoodsDescription: payload.podGoodsDescription } : {}),
        ...(payload.podNotes !== undefined ? { podNotes: payload.podNotes } : {}),
        ...(payload.podGoodsItems !== undefined ? { podGoodsItems: payload.podGoodsItems } : {}),
      });
    }
  } catch (updateError) {
    error.value =
      updateError instanceof Error
        ? updateError.message
        : "Unable to sync this lead update back to Firebase.";
  } finally {
    isSavingLead.value = false;
  }
}

async function handleDeleteLead(leadId: string, isAiLead: boolean = false) {
  try {
    const rtdbInstance = rtdb.value;
    if (rtdbInstance && hasRealtimeDatabaseConfig.value) {
      const path = isAiLead ? realtimeAiLeadsPath.value : realtimeLeadsPath.value;
      await remove(databaseRef(rtdbInstance, `${path}/${leadId}`));
      return;
    }

    const dbInstance = db.value;
    if (dbInstance && isFirebaseConfigured.value) {
      const collectionName = isAiLead ? aiLeadsCollectionName.value : leadsCollectionName.value;
      await deleteDoc(doc(dbInstance, collectionName, leadId));
    }
  } catch (err) {
    error.value = "Unable to delete this lead from Firebase.";
  }
}

async function handleWipeAllLeads(collectionName: 'ai_leads' | 'leads', ids?: string[]) {
  try {
    const apiEndpoint = process.env.NODE_ENV === "development" 
      ? "http://localhost:5000/api/wipe-leads" 
      : "https://invo-bgjy.onrender.com/api/wipe-leads";

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': 'local-dev-user-123' 
      },
      body: JSON.stringify({ collectionName, ids: ids || [] })
    });

    if (!response.ok) throw new Error("Wipe failed");
    
    // Refresh UI or trigger re-fetch if needed. 
    // For now, we manually clear the local refs if it's a full wipe or filter them out if partial.
    if (!ids || ids.length === 0) {
      if (collectionName === 'ai_leads') aiLeads.value = [];
      else leads.value = [];
    } else {
      if (collectionName === 'ai_leads') {
        aiLeads.value = aiLeads.value.filter(l => !ids.includes(l.id));
      } else {
        leads.value = leads.value.filter(l => !ids.includes(l.id));
      }
    }

  } catch (err) {
    error.value = "Failed to wipe database.";
  }
}

function exportCsv() {
  const header = [
    "Name",
    "Company",
    "Phone",
    "Email",
    "Pickup",
    "Delivery",
    "Status",
    "Source",
    "Priority",
    "Created At",
    "Estimated Value",
  ];

  const rows = filteredLeads.value.map((lead) => [
    lead.name,
    lead.company,
    lead.phone,
    lead.email,
    lead.pickupAddress,
    lead.deliveryAddress,
    lead.status,
    lead.source,
    lead.priority,
    lead.createdAt,
    lead.estimatedValue.toString(),
  ]);

  const content = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "invoaura-leads.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function toggleTheme() {
  const nextMode = !isDarkMode.value;
  isDarkMode.value = nextMode;
  document.documentElement.dataset.theme = nextMode ? "dark" : "light";
  localStorage.setItem("invoaura-theme", nextMode ? "dark" : "light");
}
</script>

<template>
  <CrmAuthGate v-slot="slotProps">
    <div class="bg-surface text-on-surface antialiased min-h-screen flex selection:bg-primary-fixed">
      <CrmSidebarNav
        :active-section="section"
        :notification-count="notificationCount"
        :open-lead-count="openLeadCount"
        :today-count="todayCount"
      />

      <CrmTopBar
        :search-value="searchValue"
        :notification-count="notificationCount"
        :is-dark-mode="isDarkMode"
        :display-name="slotProps?.session?.displayName || 'Admin'"
        :display-email="slotProps?.session?.displayEmail || 'admin@invoaura.com'"
        @update:search-value="searchValue = $event"
        @notification-click="notificationCount = 0; stopLeadNotification()"
        @theme-toggle="toggleTheme"
      />

      <main class="pl-0 lg:pl-64 pt-16 flex-1 flex min-h-screen relative overflow-hidden">
        <div class="flex-1 p-4 lg:p-8 bg-surface overflow-y-auto no-scrollbar w-full">
          <div class="space-y-4">
            <nav class="surface-card flex items-center gap-2 overflow-x-auto p-2 lg:hidden">
              <NuxtLink
                v-for="item in sectionLinks"
                :key="item.key"
                :to="item.href"
                class="rounded-2xl px-4 py-2 text-sm font-semibold"
                :class="
                  section === item.key
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-primary)]'
                "
              >
                {{ item.label }}
              </NuxtLink>
            </nav>

            <div
              v-if="error"
              class="surface-card flex items-start gap-3 rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4"
            >
              <CircleAlert class="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
              <div>
                <p class="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  Firebase sync warning
                </p>
                <p class="mt-1 text-sm leading-7 text-amber-700/80 dark:text-amber-200">
                  {{ error }}
                </p>
              </div>
            </div>

            <CrmLoadingState v-if="isLoading" />

            <CrmDashboardSection
              v-else-if="section === 'dashboard'"
              :metrics="metrics"
              :icons="summaryIcons"
              :timeline-data="timelineData"
              :status-data="statusData"
              :source-data="sourceData"
              :recent-leads="recentLeads"
              :urgent-leads="urgentLeads"
              :source-performance="sourcePerformance"
              :conversion-rate="conversionRate"
              :top-source-name="topSource?.source"
              @open-lead="selectedLeadId = $event.id; stopLeadNotification()"
            />

            <CrmLeadsSection
              v-else-if="section === 'leads' || section === 'converted_leads'"
              :filtered-count="filteredLeads.length"
              :average-deal-value="averageDealValue"
              :status-filter="statusFilter"
              :source-filter="sourceFilter"
              :date-range="dateRange"
              :sort-option="sortOption"
              :paged-leads="pagedLeads"
              :current-page="currentPage"
              :total-pages="totalPages"
              @update:status-filter="statusFilter = $event"
              @update:source-filter="sourceFilter = $event"
              @update:date-range="dateRange = $event"
              @update:sort-option="sortOption = $event"
              @page-change="page = $event"
              @open-lead="selectedLeadId = $event.id; stopLeadNotification()"
              @export="exportCsv"
              @import="showImportModal = true"
            />

            <div v-else-if="section === 'generate_pods'" class="w-full h-full pb-8">
              <CrmPodDrawer
                :lead="null"
                :open="true"
                :saving="false"
                @close="section = 'leads'"
                @save="() => {}"
              />
            </div>

            <AiLeadsSection 
              v-else-if="section === 'ai_leads'" 
              :leads="aiLeads" 
              @delete-lead="(id) => handleDeleteLead(id, true)" 
              @wipe-all-leads="handleWipeAllLeads"
              @import="showImportModal = true"
            />

            <CrmAnalyticsSection
              v-else-if="section === 'analytics'"
              :conversion-rate="conversionRate"
              :average-deal-value="averageDealValue"
              :top-source-name="topSource?.source"
              :timeline-data="timelineData"
              :status-data="statusData"
              :source-data="sourceData"
              :source-performance="sourcePerformance"
              :latest-by-source="latestBySource"
            />

            <CrmSettingsSection
              v-else
              :session-email="slotProps?.session?.displayEmail ?? ''"
              :data-source-label="firebaseLeadDataSource"
              :lead-data-path-label="
                hasRealtimeDatabaseConfig ? realtimeLeadsPath : leadsCollectionName
              "
              :rules-preview="
                hasRealtimeDatabaseConfig
                  ? realtimeDatabaseRulesPreview
                  : firestoreRulesPreview
              "
            />
          </div>
        </div>
      </main>
    </div>

      <CrmLeadDetailDrawer
        :lead="selectedLead"
        :open="Boolean(selectedLead)"
        :saving="isSavingLead"
        @close="selectedLeadId = null"
        @save="handleSaveLead"
      />

      <CrmPodDrawer
        :lead="selectedPodLead"
        :open="Boolean(selectedPodLead)"
        :saving="isSavingLead"
        @close="selectedPodLeadId = null"
        @save="handleSaveLead"
      />

      <ScrapeLeadsModal :existing-leads="aiLeads" />
      <ImportLeadsModal v-model="showImportModal" />
    </CrmAuthGate>
</template>
