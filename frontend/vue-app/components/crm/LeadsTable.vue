<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MessageCircleMore,
  PhoneCall,
  FileUp,
} from "lucide-vue-next";
import type { LeadRecord } from "~/lib/crm";
import {
  formatCompactDate,
  formatCurrency,
  formatPhoneForWhatsApp,
} from "~/lib/crm";

defineProps<{
  leads: LeadRecord[];
  compact?: boolean;
  page?: number;
  totalPages?: number;
  emptyStateTitle?: string;
  emptyStateCopy?: string;
}>();

const emit = defineEmits<{
  open: [lead: LeadRecord];
  "page-change": [page: number];
  export: [];
  import: [];
}>();
</script>

<template>
  <div v-if="leads.length === 0" class="surface-card flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--accent-soft)] text-[var(--accent)]">
      <MessageCircleMore class="h-7 w-7" />
    </div>
    <h3 class="mt-6 text-2xl font-semibold text-[var(--text-primary)]">
      {{ emptyStateTitle ?? "No leads match this view" }}
    </h3>
    <p class="mt-3 max-w-md text-sm leading-7 text-muted">
      {{
        emptyStateCopy ??
        "Try a broader search, switch the date range, or reconnect your Firebase data source."
      }}
    </p>
  </div>

  <div v-else class="surface-card overflow-hidden">
    <div
      v-if="!compact"
      class="flex flex-col gap-3 border-b border-[var(--border-color)] p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-sm font-semibold text-[var(--text-primary)]">
          Leads inbox
        </p>
        <p class="mt-1 text-sm text-muted">
          Click a row to open the full lead drawer and update the record.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl bg-surface-container-high border border-outline-variant/30 px-4 py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:shadow-md hover:bg-surface-container-highest"
          @click="emit('import')"
        >
          <FileUp class="h-4 w-4" />
          Import
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-[var(--accent-strong)]"
          @click="emit('export')"
        >
          <Download class="h-4 w-4" />
          Export CSV
        </button>
      </div>
    </div>

    <div class="hidden overflow-x-auto md:block">
      <table class="min-w-full text-left">
        <thead class="border-b border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.02]">
          <tr class="text-xs uppercase tracking-[0.22em] text-muted">
            <th class="px-5 py-4 font-semibold">Name</th>
            <th class="px-5 py-4 font-semibold">Phone</th>
            <th class="px-5 py-4 font-semibold">Email</th>
            <th class="px-5 py-4 font-semibold">Pickup &amp; Delivery</th>
            <th class="px-5 py-4 font-semibold">Status</th>
            <th class="px-5 py-4 font-semibold">Created</th>
            <th v-if="!compact" class="px-5 py-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="lead in leads"
            :key="lead.id"
            class="group cursor-pointer border-b border-[var(--border-color)] transition-all hover:bg-[var(--surface-accent)] dark:hover:bg-white/[0.04]"
            @click="emit('open', lead)"
          >
            <td class="px-5 py-4">
              <div>
                <p class="font-semibold text-[var(--text-primary)]">
                  {{ lead.name }}
                </p>
                <p class="mt-1 text-sm text-muted">{{ lead.company }}</p>
              </div>
            </td>
            <td class="px-5 py-4 text-sm text-secondary">{{ lead.phone }}</td>
            <td class="px-5 py-4 text-sm text-secondary">{{ lead.email }}</td>
            <td class="px-5 py-4">
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                {{ lead.routeLabel }}
              </p>
              <p class="mt-1 text-sm text-muted">
                {{ lead.pickupAddress }} to {{ lead.deliveryAddress }}
              </p>
              <p
                v-if="lead.tags.length > 0"
                class="mt-2 text-xs uppercase tracking-[0.2em] text-muted"
              >
                {{ lead.tags.slice(0, 2).join(" • ") }}
              </p>
            </td>
            <td class="px-5 py-4">
              <div class="flex flex-col gap-2">
                <CrmStatusBadge :status="lead.status" />
                <CrmPriorityBadge :priority="lead.priority" />
              </div>
            </td>
            <td class="px-5 py-4">
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                {{ formatCompactDate(lead.createdAt) }}
              </p>
              <p class="mt-1 text-xs text-muted">
                {{ formatCurrency(lead.estimatedValue) }}
              </p>
            </td>
            <td v-if="!compact" class="px-5 py-4">
              <div class="flex items-center gap-2" @click.stop>
                <a
                  :href="`tel:${formatPhoneForWhatsApp(lead.phone)}`"
                  class="rounded-2xl border border-[var(--border-color)] p-2 text-[var(--text-primary)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] hover:shadow-lg"
                  :aria-label="`Call ${lead.name}`"
                >
                  <PhoneCall class="h-4 w-4" />
                </a>
                <a
                  :href="`https://wa.me/${formatPhoneForWhatsApp(lead.phone)}`"
                  target="_blank"
                  rel="noreferrer"
                  class="rounded-2xl border border-[var(--border-color)] p-2 text-[var(--text-primary)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] hover:shadow-lg"
                  :aria-label="`Open WhatsApp for ${lead.name}`"
                >
                  <MessageCircleMore class="h-4 w-4" />
                </a>
                <a
                  :href="`mailto:${lead.email}`"
                  class="rounded-2xl border border-[var(--border-color)] p-2 text-[var(--text-primary)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] hover:shadow-lg"
                  :aria-label="`Email ${lead.name}`"
                >
                  <Mail class="h-4 w-4" />
                </a>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="space-y-4 p-4 md:hidden">
      <button
        v-for="lead in leads"
        :key="lead.id"
        type="button"
        class="surface-card group hover-lift w-full rounded-[24px] p-4 text-left shadow-none transition-colors hover:border-[var(--accent-strong)] dark:hover:bg-white/[0.02]"
        @click="emit('open', lead)"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-base font-semibold text-[var(--text-primary)]">
              {{ lead.name }}
            </p>
            <p class="mt-1 text-sm text-muted">{{ lead.company }}</p>
          </div>
          <CrmStatusBadge :status="lead.status" />
        </div>
        <p class="mt-4 text-sm text-secondary">{{ lead.routeLabel }}</p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <CrmPriorityBadge :priority="lead.priority" />
          <span
            v-for="tag in lead.tags.slice(0, 2)"
            :key="tag"
            class="muted-pill"
          >
            {{ tag }}
          </span>
        </div>
      </button>
    </div>

    <div
      v-if="!compact && (totalPages ?? 1) > 1"
      class="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-4"
    >
      <p class="text-sm text-muted">
        Page {{ page ?? 1 }} of {{ totalPages ?? 1 }}
      </p>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="(page ?? 1) === 1"
          @click="emit('page-change', (page ?? 1) - 1)"
        >
          <ChevronLeft class="h-4 w-4" />
          Previous
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="(page ?? 1) === (totalPages ?? 1)"
          @click="emit('page-change', (page ?? 1) + 1)"
        >
          Next
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
