import { AnalyticsPanels } from "./analytics-panels";

type AnalyticsSectionProps = {
  conversionRate: number;
  averageDealValue: number;
  topSourceName?: string;
  timelineData: Array<{ label: string; leads: number; converted: number }>;
  statusData: Array<{ label: string; value: number }>;
  sourceData: Array<{ label: string; value: number }>;
  sourcePerformance: Array<{
    source: string;
    total: number;
    converted: number;
    conversionRate: number;
  }>;
  latestBySource: Record<string, string>;
};

export function AnalyticsSection({
  conversionRate,
  averageDealValue,
  topSourceName,
  timelineData,
  statusData,
  sourceData,
  sourcePerformance,
  latestBySource,
}: AnalyticsSectionProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-card p-5 sm:p-6">
          <p className="soft-pill">Conversion rate</p>
          <p className="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
            {conversionRate}%
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            Share of leads currently marked as converted.
          </p>
        </article>
        <article className="surface-card p-5 sm:p-6">
          <p className="soft-pill">Avg. deal value</p>
          <p className="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(averageDealValue)}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            Average booked value from converted logistics leads.
          </p>
        </article>
        <article className="surface-card p-5 sm:p-6">
          <p className="soft-pill">Best source</p>
          <p className="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
            {topSourceName ?? "N/A"}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            Highest lead volume inside the selected range.
          </p>
        </article>
      </section>

      <AnalyticsPanels
        timelineData={timelineData}
        statusData={statusData}
        sourceData={sourceData}
        variant="full"
      />

      <section className="surface-card overflow-hidden">
        <div className="border-b border-[var(--border-color)] p-5 sm:p-6">
          <p className="soft-pill">Channel leaderboard</p>
          <h2 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
            Source conversion and volume breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.02]">
              <tr className="text-xs uppercase tracking-[0.22em] text-muted">
                <th className="px-5 py-4 font-semibold">Source</th>
                <th className="px-5 py-4 font-semibold">Leads</th>
                <th className="px-5 py-4 font-semibold">Converted</th>
                <th className="px-5 py-4 font-semibold">Rate</th>
                <th className="px-5 py-4 font-semibold">Latest activity</th>
              </tr>
            </thead>
            <tbody>
              {sourcePerformance.map((item) => (
                <tr key={item.source} className="border-b border-[var(--border-color)]">
                  <td className="px-5 py-4 font-semibold text-[var(--text-primary)]">
                    {item.source}
                  </td>
                  <td className="px-5 py-4 text-secondary">{item.total}</td>
                  <td className="px-5 py-4 text-secondary">{item.converted}</td>
                  <td className="px-5 py-4 text-secondary">
                    {item.conversionRate}%
                  </td>
                  <td className="px-5 py-4 text-secondary">
                    {latestBySource[item.source] ?? "No recent lead"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
