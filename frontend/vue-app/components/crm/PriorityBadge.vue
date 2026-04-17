<script setup lang="ts">
import { computed } from "vue";
import type { LeadPriority } from "~/lib/crm";

const props = defineProps<{
  priority: LeadPriority;
}>();

const styles: Record<LeadPriority, string> = {
  Urgent: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  "High priority": "bg-orange-500/12 text-orange-700 dark:text-orange-300",
  Warm: "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  "Follow-up": "bg-slate-500/12 text-slate-700 dark:text-slate-300",
};

const badgeClass = computed(() => styles[props.priority]);
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
    :class="badgeClass"
  >
    {{ priority }}
  </span>
</template>
