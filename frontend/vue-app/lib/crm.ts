export const leadStatuses = [
  "New",
  "Called",
  "Contacted",
  "Appointment",
  "In progress",
  "Pending",
  "Converted",
  "Closed",
] as const;

export const leadSources = [
  "Website",
  "WhatsApp",
  "Referral",
  "Google Ads",
  "Companies House",
  "Field Sales",
  "Yelp",
  "B2B Lead Engine",
] as const;

export const leadPriorities = [
  "Urgent",
  "High priority",
  "Warm",
  "Follow-up",
] as const;

export const dateRangeOptions = ["7d", "30d", "90d"] as const;
export const sortOptions = ["newest", "oldest", "status", "value"] as const;
export const dashboardSections = [
  "dashboard",
  "leads",
  "converted_leads",
  "generate_pods",
  "live_tracking",
  "payment_generation",
  "ai_leads",
  "analytics",
  "driver_verification",
  "settings",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];
export type LeadSource = (typeof leadSources)[number];
export type LeadPriority = (typeof leadPriorities)[number];
export type DateRangeOption = (typeof dateRangeOptions)[number];
export type SortOption = (typeof sortOptions)[number];
export type DashboardSection = (typeof dashboardSections)[number];

export type Employee = {
  name: string;
  role: string;
  linkedinUrl?: string | null;
  email?: string | null;
};

export type LeadRecord = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  pickupAddress: string;
  deliveryAddress: string;
  routeLabel: string;
  status: LeadStatus;
  source: LeadSource;
  priority: LeadPriority;
  tags: string[];
  notes: string;
  message: string;
  assignedTo: string;
  estimatedValue: number;
  createdAt: string;
  lastContactedAt?: string;
  goodsDescription?: string;
  weightDimensions?: string;
  collectionTime?: string;
  vehicleType?: string;
  customerNotes?: string;
  podDeliveryDate?: string;
  podDriverName?: string;
  podVehicleReg?: string;
  podPieces?: string;
  podWeight?: string;
  podDimensions?: string;
  podGoodsDescription?: string;
  podNotes?: string;
  podGoodsItems?: string;
  lead_score?: number;
  ai_summary?: string;
  draft_email?: string;
  website?: string;
  discovery_status?: string;
  contactName?: string;
  contactTitle?: string;
  linkedinUrl?: string;
  outreach_stage?: number;
  employees?: Employee[];
};

export type MetricCard = {
  title: string;
  value: string;
  trend: string;
  direction: "up" | "down";
  subtitle: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "numeric",
  minute: "2-digit",
});

const compactDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  const date = new Date(value);
  return `${dateFormatter.format(date)} at ${timeFormatter.format(date)}`;
}

export function formatCompactDate(value: string) {
  return compactDateFormatter.format(new Date(value));
}

export function formatPhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function getRangeDays(range: DateRangeOption) {
  if (range === "7d") {
    return 7;
  }

  if (range === "30d") {
    return 30;
  }

  return 90;
}

export function isLeadOpen(status: LeadStatus) {
  return status !== "Converted" && status !== "Closed";
}

export function getLeadsForRange(leads: LeadRecord[], range: DateRangeOption) {
  const now = Date.now();
  const cutoff = now - getRangeDays(range) * 24 * 60 * 60 * 1000;

  return leads.filter((lead) => new Date(lead.createdAt).getTime() >= cutoff);
}

export function buildTimelineData(leads: LeadRecord[], range: DateRangeOption) {
  const bucketSize = range === "90d" ? 7 : 1;
  const bucketCount = range === "90d" ? 13 : getRangeDays(range);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - bucketSize * (bucketCount - 1));

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start);
    bucketStart.setDate(start.getDate() + index * bucketSize);

    const bucketEnd = new Date(bucketStart);
    bucketEnd.setDate(bucketStart.getDate() + bucketSize);

    const bucketLeads = leads.filter((lead) => {
      const createdAt = new Date(lead.createdAt);
      return createdAt >= bucketStart && createdAt < bucketEnd;
    });

    return {
      label:
        bucketSize === 1
          ? compactDateFormatter.format(bucketStart)
          : `${compactDateFormatter.format(bucketStart)}-${compactDateFormatter.format(
              new Date(bucketEnd.getTime() - 1),
            )}`,
      leads: bucketLeads.length,
      converted: bucketLeads.filter((lead) => lead.status === "Converted")
        .length,
    };
  });
}

export function buildStatusData(leads: LeadRecord[]) {
  return [
    { label: "New", value: leads.filter((lead) => lead.status === "New").length },
    {
      label: "Contacted",
      value: leads.filter((lead) => lead.status === "Contacted").length,
    },
    {
      label: "In progress",
      value: leads.filter((lead) => lead.status === "In progress").length,
    },
    {
      label: "Pending",
      value: leads.filter((lead) => lead.status === "Pending").length,
    },
    {
      label: "Converted",
      value: leads.filter((lead) => lead.status === "Converted").length,
    },
  ];
}

export function buildSourceData(leads: LeadRecord[]) {
  return leadSources.map((source) => ({
    label: source,
    value: leads.filter((lead) => lead.source === source).length,
  }));
}

export function buildSourcePerformance(leads: LeadRecord[]) {
  return leadSources.map((source) => {
    const sourceLeads = leads.filter((lead) => lead.source === source);
    const converted = sourceLeads.filter(
      (lead) => lead.status === "Converted",
    ).length;

    return {
      source,
      total: sourceLeads.length,
      converted,
      conversionRate:
        sourceLeads.length === 0
          ? 0
          : Math.round((converted / sourceLeads.length) * 100),
    };
  });
}

export function buildLeadMetrics(leads: LeadRecord[]): MetricCard[] {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfToday.getDate() - 1);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const totalRecent = leads.filter(
    (lead) => new Date(lead.createdAt) >= thirtyDaysAgo,
  ).length;
  const totalPrevious = leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt);
    return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
  }).length;

  const newToday = leads.filter(
    (lead) => new Date(lead.createdAt) >= startOfToday,
  ).length;
  const newYesterday = leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt);
    return createdAt >= startOfYesterday && createdAt < startOfToday;
  }).length;

  const convertedRecent = leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt);
    return lead.status === "Converted" && createdAt >= thirtyDaysAgo;
  }).length;
  const convertedPrevious = leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt);
    return (
      lead.status === "Converted" &&
      createdAt >= sixtyDaysAgo &&
      createdAt < thirtyDaysAgo
    );
  }).length;

  const openLeads = leads.filter((lead) => isLeadOpen(lead.status)).length;
  const staleOpenLeads = leads.filter((lead) => {
    const createdAt = new Date(lead.createdAt);
    const staleCutoff = new Date(now);
    staleCutoff.setDate(now.getDate() - 3);
    return isLeadOpen(lead.status) && createdAt < staleCutoff;
  }).length;

  const formatTrend = (current: number, previous: number) => {
    if (previous === 0) {
      return current === 0 ? "0%" : "+100%";
    }

    const difference = ((current - previous) / previous) * 100;
    const prefix = difference >= 0 ? "+" : "";
    return `${prefix}${Math.round(difference)}%`;
  };

  return [
    {
      title: "Total leads",
      value: leads.length.toString(),
      trend: formatTrend(totalRecent, totalPrevious),
      direction: totalRecent >= totalPrevious ? "up" : "down",
      subtitle: "all active pipeline records",
    },
    {
      title: "New leads today",
      value: newToday.toString(),
      trend: formatTrend(newToday, newYesterday),
      direction: newToday >= newYesterday ? "up" : "down",
      subtitle: "captured across all channels",
    },
    {
      title: "Converted leads",
      value: leads.filter((lead) => lead.status === "Converted").length.toString(),
      trend: formatTrend(convertedRecent, convertedPrevious),
      direction: convertedRecent >= convertedPrevious ? "up" : "down",
      subtitle: "moved into booked runs",
    },
    {
      title: "Pending leads",
      value: openLeads.toString(),
      trend: staleOpenLeads > 0 ? `${staleOpenLeads} stale` : "Fresh queue",
      direction: staleOpenLeads > 0 ? "down" : "up",
      subtitle: "awaiting action or confirmation",
    },
  ];
}

export function sortLeads(leads: LeadRecord[], sortOption: SortOption) {
  const sorted = [...leads];

  sorted.sort((left, right) => {
    if (sortOption === "newest") {
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    }

    if (sortOption === "oldest") {
      return (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );
    }

    if (sortOption === "value") {
      return right.estimatedValue - left.estimatedValue;
    }

    return left.status.localeCompare(right.status);
  });

  return sorted;
}
