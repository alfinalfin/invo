import { Sparkles, type LucideIcon } from "lucide-react";

import type { LeadRecord, MetricCard } from "@/lib/crm";

import { AnalyticsPanels } from "./analytics-panels";
import { LeadsTable } from "./leads-table";
import { StatusBadge } from "./status-badge";
import { SummaryCard } from "./summary-card";

type DashboardSectionProps = {
  metrics: MetricCard[];
  icons: readonly LucideIcon[];
  timelineData: Array<{ label: string; leads: number; converted: number }>;
  statusData: Array<{ label: string; value: number }>;
  sourceData: Array<{ label: string; value: number }>;
  recentLeads: LeadRecord[];
  urgentLeads: LeadRecord[];
  sourcePerformance: Array<{
    source: string;
    total: number;
    converted: number;
    conversionRate: number;
  }>;
  conversionRate: number;
  topSourceName?: string;
  onLeadOpen: (lead: LeadRecord) => void;
};

export function DashboardSection({
  metrics,
  icons,
  timelineData,
  statusData,
  sourceData,
  recentLeads,
  urgentLeads,
  sourcePerformance,
  conversionRate,
  topSourceName,
  onLeadOpen,
}: DashboardSectionProps) {
  return (
    <div className="space-y-6">
      <section className="surface-card-strong overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="soft-pill">Command dashboard</p>
            <h1 className="section-heading mt-5 text-balance">
              Premium lead operations for a modern logistics sales team.
            </h1>
            <p className="subtle-copy mt-4 max-w-2xl">
              Inspired by polished SaaS dashboards and tuned for courier ops,
              this workspace keeps quote intake, outreach, and conversion
              health in a single high-signal view.
            </p>
          </div>
          <div className="surface-card rounded-[28px] p-5 shadow-none xl:max-w-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              This range
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
              {conversionRate}% conversion
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              {topSourceName
                ? `${topSourceName} is driving the strongest pipeline this cycle.`
                : "Connect more lead sources to surface deeper comparisons."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = icons[index];

          return (
            <SummaryCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              trend={metric.trend}
              subtitle={metric.subtitle}
              direction={metric.direction}
              icon={Icon}
            />
          );
        })}
      </section>

      <AnalyticsPanels
        timelineData={timelineData}
        statusData={statusData}
        sourceData={sourceData}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <LeadsTable leads={recentLeads} onLeadOpen={onLeadOpen} compact />

        <div className="space-y-6">
          <article className="surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="soft-pill">Urgent queue</p>
                <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                  Leads that need a fast human touch
                </h3>
              </div>
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div className="mt-6 space-y-4">
              {urgentLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => onLeadOpen(lead)}
                  className="surface-card flex w-full items-start justify-between rounded-[24px] p-4 text-left shadow-none"
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {lead.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">{lead.routeLabel}</p>
                  </div>
                  <StatusBadge status={lead.status} />
                </button>
              ))}
            </div>
          </article>

          <article className="surface-card p-5 sm:p-6">
            <div>
              <p className="soft-pill">Source performance</p>
              <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                Best-performing channels
              </h3>
            </div>
            <div className="mt-6 space-y-4">
              {sourcePerformance.map((item) => (
                <div
                  key={item.source}
                  className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {item.source}
                    </p>
                    <p className="text-sm text-muted">
                      {item.conversionRate}% conversion
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.max(item.conversionRate, 8)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
