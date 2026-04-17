<script setup lang="ts">
defineProps<{
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
}>();
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-4 md:grid-cols-3">
      <article class="surface-card p-5 sm:p-6">
        <p class="soft-pill">Conversion rate</p>
        <p class="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
          {{ conversionRate }}%
        </p>
        <p class="mt-3 text-sm leading-7 text-muted">
          Share of leads currently marked as converted.
        </p>
      </article>

      <article class="surface-card p-5 sm:p-6">
        <p class="soft-pill">Avg. deal value</p>
        <p class="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
          {{
            new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(averageDealValue)
          }}
        </p>
        <p class="mt-3 text-sm leading-7 text-muted">
          Average booked value from converted logistics leads.
        </p>
      </article>

      <article class="surface-card p-5 sm:p-6">
        <p class="soft-pill">Best source</p>
        <p class="mt-5 text-4xl font-semibold text-[var(--text-primary)]">
          {{ topSourceName ?? "N/A" }}
        </p>
        <p class="mt-3 text-sm leading-7 text-muted">
          Highest lead volume inside the selected range.
        </p>
      </article>
    </section>

    <CrmAnalyticsPanels
      :timeline-data="timelineData"
      :status-data="statusData"
      :source-data="sourceData"
      variant="full"
    />

    <section class="surface-card overflow-hidden">
      <div class="border-b border-[var(--border-color)] p-5 sm:p-6">
        <p class="soft-pill">Channel leaderboard</p>
        <h2 class="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
          Source conversion and volume breakdown
        </h2>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full text-left">
          <thead class="border-b border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.02]">
            <tr class="text-xs uppercase tracking-[0.22em] text-muted">
              <th class="px-5 py-4 font-semibold">Source</th>
              <th class="px-5 py-4 font-semibold">Leads</th>
              <th class="px-5 py-4 font-semibold">Converted</th>
              <th class="px-5 py-4 font-semibold">Rate</th>
              <th class="px-5 py-4 font-semibold">Latest activity</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in sourcePerformance"
              :key="item.source"
              class="border-b border-[var(--border-color)]"
            >
              <td class="px-5 py-4 font-semibold text-[var(--text-primary)]">
                {{ item.source }}
              </td>
              <td class="px-5 py-4 text-secondary">{{ item.total }}</td>
              <td class="px-5 py-4 text-secondary">{{ item.converted }}</td>
              <td class="px-5 py-4 text-secondary">{{ item.conversionRate }}%</td>
              <td class="px-5 py-4 text-secondary">
                {{ latestBySource[item.source] ?? "No recent lead" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
