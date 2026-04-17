<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description: string;
}>();

const links = [
  { href: "/faq", label: "FAQ" },
  { href: "/careers", label: "Careers" },
  { href: "/franchise", label: "Franchise" },
  { href: "/make-payment", label: "Payments" },
];
</script>

<template>
  <main class="min-h-screen py-10 sm:py-14">
    <div class="public-shell space-y-8">
      <header class="surface-card flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-muted">Invoaura</p>
          <h1 class="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            Logistics CRM and admin desk
          </h1>
        </div>

        <nav class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="link in links"
            :key="link.href"
            :to="link.href"
            class="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)]"
          >
            {{ link.label }}
          </NuxtLink>
          <NuxtLink
            to="/"
            class="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          >
            Open dashboard
          </NuxtLink>
        </nav>
      </header>

      <section class="public-panel">
        <div class="absolute left-0 top-6 h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(93,155,255,0.45),_transparent_64%)] blur-3xl" />
        <div class="absolute right-0 top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(255,95,46,0.18),_transparent_62%)] blur-3xl" />
        <div class="relative max-w-3xl">
          <div class="soft-pill bg-white/10 text-white">{{ eyebrow }}</div>
          <h2 class="mt-5 text-balance text-4xl font-semibold text-white sm:text-5xl">
            {{ title }}
          </h2>
          <p class="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
            {{ description }}
          </p>
          <NuxtLink
            to="/"
            class="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-cobalt/30 hover:bg-white/[0.08]"
          >
            Return to CRM
          </NuxtLink>
        </div>
      </section>

      <section class="grid gap-6">
        <slot />
      </section>
    </div>
  </main>
</template>
