<script setup lang="ts">
useSeoMeta({
  title: "Careers and Driver Opportunities",
  description:
    "Explore courier, driver, and operations opportunities with Invoaura Logistics.",
});
</script>

<template>
  <PublicPageShell
    eyebrow="Careers"
    title="Drive with a dispatch team that values calm under pressure."
    description="We are building a premium logistics operation for drivers, dispatchers, and support teams who care about communication as much as delivery performance."
  >
    <article class="surface-card p-6 sm:p-8">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)]">
        Why join Invoaura?
      </h2>
      <div class="mt-5 grid gap-4 sm:grid-cols-3">
        <div
          v-for="item in [
            'Dedicated business-focused routes and repeat client work.',
            'Operational visibility with a premium service culture.',
            'Growth opportunities across courier and support roles.',
          ]"
          :key="item"
          class="rounded-[1.4rem] border border-[var(--border-color)] bg-black/[0.03] p-4 text-sm leading-7 text-secondary dark:bg-white/[0.03]"
        >
          {{ item }}
        </div>
      </div>
    </article>
  </PublicPageShell>
</template>
