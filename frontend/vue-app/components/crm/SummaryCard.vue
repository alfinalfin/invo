<script setup lang="ts">
import type { Component } from "vue";
import { ArrowDownRight, ArrowUpRight } from "lucide-vue-next";

defineProps<{
  title: string;
  value: string;
  trend: string;
  subtitle: string;
  direction: "up" | "down";
  icon: Component;
}>();
</script>

<template>
  <article class="surface-card-strong group hover-lift relative overflow-hidden p-5 sm:p-6">
    <div
      class="absolute inset-x-6 top-0 h-32 rounded-full bg-[radial-gradient(circle,_rgba(11,94,215,0.22),_rgba(11,94,215,0))] opacity-50 transition-opacity duration-300 group-hover:opacity-100 dark:bg-[radial-gradient(circle,_rgba(93,155,255,0.18),_rgba(93,155,255,0))]"
    />
    <div class="relative flex items-start justify-between gap-4">
      <div>
        <p class="text-sm font-semibold text-secondary">{{ title }}</p>
        <p class="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
          {{ value }}
        </p>
        <p class="mt-2 text-sm text-muted">{{ subtitle }}</p>
      </div>
      <div class="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)] shadow-[0_0_15px_var(--accent-soft)] transition-shadow duration-300 group-hover:shadow-[0_0_25px_var(--accent-soft)]">
        <component :is="icon" class="h-5 w-5" />
      </div>
    </div>
    <div
      class="relative mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
      :class="
        direction === 'up'
          ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
          : 'bg-amber-500/12 text-amber-700 dark:text-amber-300'
      "
    >
      <ArrowUpRight v-if="direction === 'up'" class="h-3.5 w-3.5" />
      <ArrowDownRight v-else class="h-3.5 w-3.5" />
      {{ trend }}
    </div>
  </article>
</template>
