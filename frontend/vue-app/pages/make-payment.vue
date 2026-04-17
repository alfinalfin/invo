<script setup lang="ts">
useSeoMeta({
  title: "Make a Payment",
  description:
    "Secure payment route placeholder for Invoaura customer invoices and service settlements.",
});
</script>

<template>
  <PublicPageShell
    eyebrow="Payments"
    title="A payment destination that feels as polished as the dispatch flow."
    description="This route is ready to be connected to Stripe, a hosted invoice portal, or your preferred payment provider."
  >
    <article class="surface-card p-6 sm:p-8">
      <h2 class="text-2xl font-semibold text-[var(--text-primary)]">
        Next integration step
      </h2>
      <p class="mt-4 text-sm leading-8 text-secondary">
        Wire this page to your payment provider, invoice system, or customer
        account area. The navigation, metadata, and sitemap support are already
        in place.
      </p>
    </article>
  </PublicPageShell>
</template>
