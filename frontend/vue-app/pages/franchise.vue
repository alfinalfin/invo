<script setup lang="ts">
useSeoMeta({
  title: "Franchise Opportunities",
  description:
    "Learn about franchise and network expansion opportunities with Invoaura Logistics.",
});
</script>

<template>
  <PublicPageShell
    eyebrow="Franchise"
    title="Build regional logistics presence with a premium network model."
    description="The franchise vision focuses on high-trust local operators supported by a brand built around visibility, urgency, and disciplined delivery."
  >
    <article class="surface-card p-6 sm:p-8">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)]">
        What the model prioritises
      </h2>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <div
          v-for="item in [
            'Brand systems that feel premium from the first enquiry.',
            'Local market ownership with central design and SEO support.',
            'Operational playbooks for urgent courier and scheduled logistics.',
            'A platform story that can scale beyond commodity transport.',
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
