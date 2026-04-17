<script setup lang="ts">
import { faqItems } from "~/data/site-content";

useSeoMeta({
  title: "Logistics FAQ",
  description:
    "Answers to common courier, vehicle, pricing, urgency, and business logistics questions for Invoaura Logistics.",
});
</script>

<template>
  <PublicPageShell
    eyebrow="Support"
    title="Frequently asked logistics questions."
    description="A premium courier experience still needs straightforward answers. Here are the key questions businesses ask before they book."
  >
    <div class="public-panel">
      <PublicFaqAccordion :items="faqItems" />
    </div>
  </PublicPageShell>
</template>
