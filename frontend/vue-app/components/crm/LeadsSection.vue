<script setup lang="ts">
import { Filter } from "lucide-vue-next";
import {
  dateRangeOptions,
  formatCurrency,
  leadSources,
  leadStatuses,
  sortOptions,
  type DateRangeOption,
  type LeadRecord,
  type LeadSource,
  type LeadStatus,
  type SortOption,
} from "~/lib/crm";

defineProps<{
  filteredCount: number;
  averageDealValue: number;
  statusFilter: LeadStatus | "All";
  sourceFilter: LeadSource | "All";
  dateRange: DateRangeOption;
  sortOption: SortOption;
  pagedLeads: LeadRecord[];
  currentPage: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  "update:statusFilter": [value: LeadStatus | "All"];
  "update:sourceFilter": [value: LeadSource | "All"];
  "update:dateRange": [value: DateRangeOption];
  "update:sortOption": [value: SortOption];
  "page-change": [value: number];
  "open-lead": [lead: LeadRecord];
  export: [];
  import: [];
}>();
</script>

<template>
  <div class="space-y-6">
    <section class="surface-card-strong p-6 sm:p-8">
      <div class="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p class="soft-pill">Lead management</p>
          <h1 class="section-heading mt-5 text-balance text-gradient-primary">Work the full pipeline</h1>
          <p class="subtle-copy mt-4 max-w-2xl">
            Search, filter, sort, and action every inquiry from one clean
            operational table built for high-volume logistics teams.
          </p>
        </div>
        <div class="relative overflow-hidden rounded-[28px] border border-[var(--border-strong)] bg-gradient-to-br from-[var(--surface-primary)] to-[var(--surface-accent)] p-6 shadow-[0_8px_30px_rgba(11,94,215,0.08)] backdrop-blur-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] xl:max-w-sm">
          <div class="absolute -right-4 -top-12 h-32 w-32 rounded-full bg-[var(--accent)] opacity-20 blur-3xl pointer-events-none" />
          <div class="relative">
            <p class="text-xs uppercase tracking-[0.24em] font-semibold text-[var(--accent)]">
              Filtered records
            </p>
            <p class="mt-3 text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {{ filteredCount }}
            </p>
            <p class="mt-2 text-sm text-muted">
              {{ formatCurrency(averageDealValue) }} average converted value
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="surface-card p-5 sm:p-6">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Status
          </span>
          <select
            :value="statusFilter"
            class="w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
            @change="emit('update:statusFilter', ($event.target as HTMLSelectElement).value as LeadStatus | 'All')"
          >
            <option value="All">All statuses</option>
            <option v-for="status in leadStatuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Source
          </span>
          <select
            :value="sourceFilter"
            class="w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
            @change="emit('update:sourceFilter', ($event.target as HTMLSelectElement).value as LeadSource | 'All')"
          >
            <option value="All">All sources</option>
            <option v-for="source in leadSources" :key="source" :value="source">
              {{ source }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Date range
          </span>
          <select
            :value="dateRange"
            class="w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
            @change="emit('update:dateRange', ($event.target as HTMLSelectElement).value as DateRangeOption)"
          >
            <option v-for="range in dateRangeOptions" :key="range" :value="range">
              Last {{ range.replace('d', '') }} days
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
            Sort by
          </span>
          <select
            :value="sortOption"
            class="w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all hover:border-[var(--accent)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
            @change="emit('update:sortOption', ($event.target as HTMLSelectElement).value as SortOption)"
          >
            <option v-for="option in sortOptions" :key="option" :value="option">
              {{ option.charAt(0).toUpperCase() + option.slice(1) }}
            </option>
          </select>
        </label>

        <div class="relative overflow-hidden group rounded-[24px] bg-[var(--accent-soft)] p-4 transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_var(--accent-soft)]">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-0 transition-opacity duration-500 blur-xl group-hover:opacity-10 pointer-events-none" />
          <div class="relative flex items-center gap-3">
            <Filter class="h-5 w-5 text-[var(--accent)]" />
            <div>
              <p class="text-sm font-semibold text-[var(--accent)]">
                Active filters
              </p>
              <p class="text-sm text-secondary">{{ filteredCount }} visible leads</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <CrmLeadsTable
      :leads="pagedLeads"
      :page="currentPage"
      :total-pages="totalPages"
      @page-change="emit('page-change', $event)"
      @open="emit('open-lead', $event)"
      @export="emit('export')"
      @import="emit('import')"
    />
  </div>
</template>
