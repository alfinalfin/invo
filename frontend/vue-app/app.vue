<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { resolveSiteUrl, siteConfig } from "~/lib/site";

const runtimeConfig = useRuntimeConfig();
const siteUrl = resolveSiteUrl(runtimeConfig.public.siteUrl);

const themeInitializer = `
  try {
    const stored = localStorage.getItem("invoaura-theme");
    const preferredDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (preferredDark ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.classList.remove("dark");
  }
`;

useHead({
  htmlAttrs: {
    lang: "en",
  },
  bodyAttrs: {
    class:
      "min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)] antialiased",
  },
  script: [
    {
      id: "theme-init",
      innerHTML: themeInitializer,
      tagPosition: "head",
    },
  ],
});

useSeoMeta({
  title: siteConfig.name,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  ogTitle: siteConfig.name,
  ogDescription: siteConfig.description,
  ogUrl: siteUrl,
  ogSiteName: siteConfig.name,
  twitterCard: "summary_large_image",
  twitterTitle: siteConfig.name,
  twitterDescription: siteConfig.description,
});
</script>
