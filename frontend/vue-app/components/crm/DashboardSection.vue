<script setup lang="ts">
import { Sparkles } from "lucide-vue-next";
import type { Component } from "vue";
import type { LeadRecord, MetricCard } from "~/lib/crm";

defineProps<{
  metrics: MetricCard[];
  icons: Component[];
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
}>();

const emit = defineEmits<{
  "open-lead": [lead: LeadRecord];
}>();
</script>

<template>
  <div class="space-y-6">
    <section class="surface-card-strong overflow-hidden p-6 sm:p-8">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div class="max-w-2xl">
          <p class="soft-pill">Command dashboard</p>
          <h1 class="section-heading mt-5 text-balance text-gradient-primary">
            Premium lead operations for a modern logistics sales team.
          </h1>
          <p class="subtle-copy mt-4 max-w-2xl">
            Inspired by polished SaaS dashboards and tuned for courier ops, this
            workspace keeps quote intake, outreach, and conversion health in a
            single high-signal view.
          </p>
        </div>
        <div class="relative overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-accent)] p-6 shadow-[0_8px_30px_rgba(11,94,215,0.08)] backdrop-blur-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] xl:max-w-sm">
          <div class="absolute -right-4 -top-12 h-32 w-32 rounded-full bg-[var(--accent)] opacity-20 blur-3xl pointer-events-none" />
          <div class="relative">
            <p class="text-xs uppercase tracking-[0.24em] font-semibold text-[var(--accent)]">This range</p>
            <p class="mt-3 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {{ conversionRate }}% conversion
            </p>
            <p class="mt-2 text-sm leading-6 text-muted">
              {{
                topSourceName
                  ? `${topSourceName} is driving the strongest pipeline this cycle.`
                  : "Connect more lead sources to surface deeper comparisons."
              }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CrmSummaryCard
        v-for="(metric, index) in metrics"
        :key="metric.title"
        :title="metric.title"
        :value="metric.value"
        :trend="metric.trend"
        :subtitle="metric.subtitle"
        :direction="metric.direction"
        :icon="icons[index]"
      />
    </section>

    <CrmAnalyticsPanels
      :timeline-data="timelineData"
      :status-data="statusData"
      :source-data="sourceData"
    />

    <div class="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
      <CrmLeadsTable
        :leads="recentLeads"
        compact
        @open="emit('open-lead', $event)"
      />

      <div class="space-y-6">
        <article class="surface-card p-5 sm:p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="soft-pill">Urgent queue</p>
              <h3 class="mt-4 text-xl font-semibold text-[var(--text-primary)]">
                Leads that need a fast human touch
              </h3>
            </div>
            <Sparkles class="h-5 w-5 text-[var(--accent)]" />
          </div>
          <div class="mt-6 space-y-4">
            <button
              v-for="lead in urgentLeads"
              :key="lead.id"
              type="button"
              class="surface-card group hover-lift flex w-full items-start justify-between rounded-[24px] p-4 text-left shadow-none transition-colors hover:border-[var(--accent-strong)] dark:hover:bg-white/[0.02]"
              @click="emit('open-lead', lead)"
            >
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                  {{ lead.name }}
                </p>
                <p class="mt-1 text-sm text-muted">{{ lead.routeLabel }}</p>
              </div>
              <div class="transition-transform group-hover:scale-105">
                <CrmStatusBadge :status="lead.status" />
              </div>
            </button>
          </div>
        </article>

        <article class="surface-card p-5 sm:p-6">
          <p class="soft-pill">Source performance</p>
          <h3 class="mt-4 text-xl font-semibold text-[var(--text-primary)]">
            Best-performing channels
          </h3>
          <div class="mt-6 space-y-4">
            <div
              v-for="item in sourcePerformance"
              :key="item.source"
              class="group rounded-[24px] bg-black/[0.03] p-4 transition-all hover:-translate-y-1 hover:bg-black/[0.05] hover:shadow-md dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
            >
              <div class="flex items-center justify-between gap-4">
                <p class="text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]">
                  {{ item.source }}
                </p>
                <p class="text-sm text-muted">
                  {{ item.conversionRate }}% conversion
                </p>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] transition-all duration-1000 ease-out"
                  :style="{ width: `${Math.max(item.conversionRate, 8)}%` }"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
