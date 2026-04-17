"use client";

import {
  BadgeCheck,
  BellDot,
  CircleAlert,
  Clock3,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import {
  onValue,
  ref as databaseRef,
  update as updateRealtime,
} from "firebase/database";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

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
} from "../../lib/crm";
import { mapFirestoreLead, mapRealtimeLeads } from "../../lib/firebase-leads";
import { playLeadNotifications } from "../../lib/notification-sound";
import {
  db,
  firebaseLeadDataSource,
  hasRealtimeDatabaseConfig,
  isFirebaseConfigured,
  leadsCollectionName,
  realtimeLeadsPath,
  rtdb,
} from "../../lib/firebase";

import { AnalyticsSection } from "./analytics-section";
import { AuthGate } from "./auth-gate";
import { DashboardSection } from "./dashboard-section";
import { LeadDetailSheet } from "./lead-detail-sheet";
import { LeadsSection } from "./leads-section";
import { WorkspaceLoadingState } from "./loading-state";
import { SettingsSection } from "./settings-section";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ScrapeLeadsModal } from "./scrape-leads-modal";
import { AILeadDashboard } from "./AILeadDashboard";
import { PodDrawer } from "./pod-drawer";

type CRMWorkspaceProps = {
  section: DashboardSectionKey;
};

type PatchPayload = {
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

const summaryIcons = [UsersRound, BellDot, BadgeCheck, Clock3] as const;

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

const realtimeDatabaseRulesPreview = `{
  "rules": {
    "quotes": {
      ".read": "auth != null && auth.token.admin === true",
      ".write": "auth != null && auth.token.admin === true"
    }
  }
}`;

export function CRMWorkspace({ section }: CRMWorkspaceProps) {
  return (
    <AuthGate>
      {(session) => <WorkspaceSurface section={section} session={session} />}
    </AuthGate>
  );
}

function WorkspaceSurface({
  section,
  session,
}: CRMWorkspaceProps & {
  session: { displayName: string; displayEmail: string };
}) {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">(
    section === "converted_leads" ? "Converted" : "All"
  );
  const [sourceFilter, setSourceFilter] = useState<LeadSource | "All">("All");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [dateRange, setDateRange] = useState<DateRangeOption>("30d");
  const [page, setPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedPodLeadId, setSelectedPodLeadId] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const deferredSearch = useDeferredValue(searchValue.trim().toLowerCase());

  useEffect(() => {
    setIsDarkMode(document.documentElement.dataset.theme === "dark");
  }, []);

  useEffect(() => {
    if (rtdb && hasRealtimeDatabaseConfig) {
      let isReady = false;
      let previousIds = new Set<string>();
      const leadsRef = databaseRef(rtdb, realtimeLeadsPath);

      return onValue(
        leadsRef,
        (snapshot) => {
          const nextLeads = sortLeads(mapRealtimeLeads(snapshot.val()), "newest");
          const nextIds = new Set(nextLeads.map((lead) => lead.id));
          setLeads(nextLeads);
          setIsLoading(false);
          setError(null);

          if (isReady) {
            const additions = nextLeads.filter(
              (lead) => !previousIds.has(lead.id),
            ).length;

            if (additions > 0) {
              setNotificationCount((count) => count + additions);
              playLeadNotifications(additions);
            }
          } else {
            isReady = true;
          }

          previousIds = nextIds;
        },
        (snapshotError) => {
          setError(snapshotError.message);
          setIsLoading(false);
        },
      );
    }

    if (db && isFirebaseConfigured && !hasRealtimeDatabaseConfig) {
      let isReady = false;
      const leadsQuery = query(
        collection(db, leadsCollectionName),
        orderBy("createdAt", "desc"),
      );

      return onSnapshot(
        leadsQuery,
        (snapshot) => {
          const nextLeads = snapshot.docs.map(mapFirestoreLead);
          setLeads(nextLeads);
          setIsLoading(false);
          setError(null);

          if (isReady) {
            const additions = snapshot.docChanges().filter(
              (change) => change.type === "added",
            ).length;
            if (additions > 0) {
              setNotificationCount((count) => count + additions);
              playLeadNotifications(additions);
            }
          } else {
            isReady = true;
          }
        },
        (snapshotError) => {
          setError(snapshotError.message);
          setIsLoading(false);
        },
      );
    }

    setLeads([]);
    setIsLoading(false);
    setError(
      "Firebase is not configured or no datastore client is available. Check your environment variables.",
    );
  }, []);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, statusFilter, sourceFilter, sortOption, dateRange]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || null;
  const selectedPodLead = leads.find((l) => l.id === selectedPodLeadId) || null;

  const leadsInRange = getLeadsForRange(leads, dateRange);
  const filteredLeads = sortLeads(
    leadsInRange.filter((lead) => {
      const matchesSearch =
        deferredSearch.length === 0 ||
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
          .includes(deferredSearch);
      const matchesStatus =
        statusFilter === "All" ? true : lead.status === statusFilter;
      const matchesSource =
        sourceFilter === "All" ? true : lead.source === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    }),
    sortOption,
  );

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedLeads = filteredLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const metrics = buildLeadMetrics(leads);
  const timelineData = buildTimelineData(leadsInRange, dateRange);
  const statusData = buildStatusData(leadsInRange);
  const sourceData = buildSourceData(leadsInRange);
  const sourcePerformance = buildSourcePerformance(leadsInRange)
    .filter((item) => item.total > 0)
    .sort((left, right) => right.total - left.total);
  const recentLeads = sortLeads(leads, "newest").slice(0, 5);
  const urgentLeads = sortLeads(
    leads.filter((lead) => lead.priority === "Urgent" || lead.status === "New"),
    "newest",
  ).slice(0, 4);
  const todayCount = leads.filter((lead) => {
    const date = new Date(lead.createdAt);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return date >= startOfToday;
  }).length;
  const openLeadCount = leads.filter((lead) => isLeadOpen(lead.status)).length;
  const convertedLeads = leads.filter((lead) => lead.status === "Converted");
  const averageDealValue =
    convertedLeads.length > 0
      ? Math.round(
          convertedLeads.reduce((total, lead) => total + lead.estimatedValue, 0) /
            convertedLeads.length,
        )
      : 0;
  const topSource = sourcePerformance[0];
  const conversionRate =
    leads.length > 0
      ? Math.round((convertedLeads.length / leads.length) * 100)
      : 0;

  async function handleSaveLead(leadId: string, patch: PatchPayload) {
    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: patch.status,
              notes: patch.notes,
              lastContactedAt: patch.lastContactedAt,
              estimatedValue: patch.estimatedValue ?? lead.estimatedValue,
              podDeliveryDate: patch.podDeliveryDate ?? lead.podDeliveryDate,
              podDriverName: patch.podDriverName ?? lead.podDriverName,
              podVehicleReg: patch.podVehicleReg ?? lead.podVehicleReg,
              podPieces: patch.podPieces ?? lead.podPieces,
              podWeight: patch.podWeight ?? lead.podWeight,
              podDimensions: patch.podDimensions ?? lead.podDimensions,
              podGoodsDescription: patch.podGoodsDescription ?? lead.podGoodsDescription,
              podNotes: patch.podNotes ?? lead.podNotes,
              podGoodsItems: patch.podGoodsItems ?? lead.podGoodsItems,
            }
          : lead,
      ),
    );

    if (rtdb && hasRealtimeDatabaseConfig) {
      try {
        await updateRealtime(
          databaseRef(
            rtdb,
            leadId === "root" ? realtimeLeadsPath : `${realtimeLeadsPath}/${leadId}`,
          ),
          {
            status: patch.status,
            notes: patch.notes,
            lastContactedAt: patch.lastContactedAt ?? null,
            updatedAt: new Date().toISOString(),
            ...(patch.estimatedValue !== undefined ? { estimatedValue: patch.estimatedValue } : {}),
            ...(patch.podDeliveryDate !== undefined ? { podDeliveryDate: patch.podDeliveryDate } : {}),
            ...(patch.podDriverName !== undefined ? { podDriverName: patch.podDriverName } : {}),
            ...(patch.podVehicleReg !== undefined ? { podVehicleReg: patch.podVehicleReg } : {}),
            ...(patch.podPieces !== undefined ? { podPieces: patch.podPieces } : {}),
            ...(patch.podWeight !== undefined ? { podWeight: patch.podWeight } : {}),
            ...(patch.podDimensions !== undefined ? { podDimensions: patch.podDimensions } : {}),
            ...(patch.podGoodsDescription !== undefined ? { podGoodsDescription: patch.podGoodsDescription } : {}),
            ...(patch.podNotes !== undefined ? { podNotes: patch.podNotes } : {}),
            ...(patch.podGoodsItems !== undefined ? { podGoodsItems: patch.podGoodsItems } : {}),
          },
        );
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "Unable to sync this lead update back to Realtime Database.",
        );
      }

      return;
    }

    if (!db || !isFirebaseConfigured) {
      return;
    }

    try {
      await updateDoc(doc(db, leadsCollectionName, leadId), {
        status: patch.status,
        notes: patch.notes,
        lastContactedAt: patch.lastContactedAt ?? null,
        updatedAt: serverTimestamp(),
        ...(patch.estimatedValue !== undefined ? { estimatedValue: patch.estimatedValue } : {}),
        ...(patch.podDeliveryDate !== undefined ? { podDeliveryDate: patch.podDeliveryDate } : {}),
        ...(patch.podDriverName !== undefined ? { podDriverName: patch.podDriverName } : {}),
        ...(patch.podVehicleReg !== undefined ? { podVehicleReg: patch.podVehicleReg } : {}),
        ...(patch.podPieces !== undefined ? { podPieces: patch.podPieces } : {}),
        ...(patch.podWeight !== undefined ? { podWeight: patch.podWeight } : {}),
        ...(patch.podDimensions !== undefined ? { podDimensions: patch.podDimensions } : {}),
        ...(patch.podGoodsDescription !== undefined ? { podGoodsDescription: patch.podGoodsDescription } : {}),
        ...(patch.podNotes !== undefined ? { podNotes: patch.podNotes } : {}),
        ...(patch.podGoodsItems !== undefined ? { podGoodsItems: patch.podGoodsItems } : {}),
      });
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to sync this lead update back to Firestore.",
      );
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
    const rows = filteredLeads.map((lead) => [
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

  const latestBySource = Object.fromEntries(
    leadSources.map((source) => {
      const latestLead = recentLeads.find((lead) => lead.source === source);
      return [source, latestLead ? formatCompactDate(latestLead.createdAt) : "No recent lead"];
    }),
  );

  const content = isLoading ? (
    <WorkspaceLoadingState />
  ) : (
    <>
      {section === "dashboard" ? (
        <DashboardSection
          metrics={metrics}
          icons={summaryIcons}
          timelineData={timelineData}
          statusData={statusData}
          sourceData={sourceData}
          recentLeads={recentLeads}
          urgentLeads={urgentLeads}
          sourcePerformance={sourcePerformance}
          conversionRate={conversionRate}
          topSourceName={topSource?.source}
          onLeadOpen={(lead) => setSelectedLeadId(lead.id)}
        />
      ) : null}

      {section === "leads" || section === "converted_leads" ? (
        <LeadsSection
          filteredCount={filteredLeads.length}
          averageDealValue={averageDealValue}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          sortOption={sortOption}
          setSortOption={setSortOption}
          pagedLeads={pagedLeads}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onLeadOpen={(lead) => setSelectedLeadId(lead.id)}
          onExport={exportCsv}
        />
      ) : null}

      {section === "generate_pods" ? (
        <div className="w-full h-full pb-8">
          <PodDrawer
            lead={{ id: "", status: "New", notes: "" }}
            open={true}
            onClose={() => {}}
            onSave={handleSaveLead}
          />
        </div>
      ) : null}

      {section === "ai_leads" ? <AILeadDashboard /> : null}

      {section === "analytics" ? (
        <AnalyticsSection
          conversionRate={conversionRate}
          averageDealValue={averageDealValue}
          topSourceName={topSource?.source}
          timelineData={timelineData}
          statusData={statusData}
          sourceData={sourceData}
          sourcePerformance={sourcePerformance}
          latestBySource={latestBySource}
        />
      ) : null}

      {section === "settings" ? (
        <SettingsSection
          sessionEmail={session.displayEmail}
          dataSourceLabel={firebaseLeadDataSource}
          leadDataPathLabel={
            hasRealtimeDatabaseConfig ? realtimeLeadsPath : leadsCollectionName
          }
          rulesPreview={
            hasRealtimeDatabaseConfig
              ? realtimeDatabaseRulesPreview
              : firestoreRulesPreview
          }
        />
      ) : null}
    </>
  );

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex selection:bg-primary-fixed">
      <Sidebar
        activeSection={section}
        notificationCount={notificationCount}
        openLeadCount={openLeadCount}
        todayCount={todayCount}
      />

      <Topbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        notificationCount={notificationCount}
        onNotificationClick={() => setNotificationCount(0)}
        isDarkMode={isDarkMode}
        onThemeToggle={() => {
          const nextMode = !isDarkMode;
          setIsDarkMode(nextMode);
          document.documentElement.dataset.theme = nextMode ? "dark" : "light";
          localStorage.setItem(
            "invoaura-theme",
            nextMode ? "dark" : "light",
          );
        }}
        displayName={session.displayName}
        displayEmail={session.displayEmail}
      />

      <main className="pl-0 lg:pl-64 pt-16 flex-1 flex min-h-screen relative overflow-hidden">
        <div className="flex-1 p-4 lg:p-8 bg-surface overflow-y-auto no-scrollbar w-full">
          <div className="space-y-4">
            <nav className="surface-card flex items-center gap-2 overflow-x-auto p-2 lg:hidden">
              {[
                { href: "/", label: "Dashboard", key: "dashboard" },
                { href: "/leads", label: "Leads", key: "leads" },
                { href: "/analytics", label: "Analytics", key: "analytics" },
                { href: "/settings", label: "Settings", key: "settings" },
              ].map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                    section === item.key
                      ? "bg-[var(--accent)] text-white"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {error ? (
              <div className="surface-card flex items-start gap-3 rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4">
                <CircleAlert className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Firebase sync warning
                  </p>
                  <p className="mt-1 text-sm leading-7 text-amber-700/80 dark:text-amber-200">
                    {error}
                  </p>
                </div>
              </div>
            ) : null}

            {content}
          </div>
        </div>
      </main>

      <LeadDetailSheet
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLeadId(null)}
        onSave={handleSaveLead}
      />

      <PodDrawer
        lead={selectedPodLead}
        open={Boolean(selectedPodLead)}
        onClose={() => setSelectedPodLeadId(null)}
        onSave={handleSaveLead}
      />

      <ScrapeLeadsModal />
    </div>
  );
}
