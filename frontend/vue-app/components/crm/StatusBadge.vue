<script setup lang="ts">
import { computed } from "vue";
import type { LeadStatus } from "~/lib/crm";

const props = defineProps<{
  status: LeadStatus;
}>();

const styles: Record<LeadStatus, string> = {
  New: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  Contacted: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  "In progress": "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  Pending: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  Converted: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  Closed: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

const badgeClass = computed(() => styles[props.status]);
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
    :class="badgeClass"
  >
    <span class="h-2 w-2 rounded-full bg-current/70" />
    {{ status }}
  </span>
</template>
