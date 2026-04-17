<script setup lang="ts">
import { CalendarRange, DatabaseZap, ShieldCheck } from "lucide-vue-next";

defineProps<{
  sessionEmail: string;
  dataSourceLabel: string;
  leadDataPathLabel: string;
  rulesPreview: string;
}>();

const envKeys = [
  "NUXT_PUBLIC_FIREBASE_API_KEY",
  "NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NUXT_PUBLIC_FIREBASE_DATABASE_URL",
  "NUXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NUXT_PUBLIC_FIREBASE_APP_ID",
  "NUXT_PUBLIC_ALLOWED_ADMIN_EMAILS",
  "NUXT_PUBLIC_LEADS_COLLECTION",
  "NUXT_PUBLIC_RTDB_LEADS_PATH",
];
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <article class="surface-card-strong p-6 sm:p-8">
        <p class="soft-pill">Security and data</p>
        <h1 class="section-heading mt-5">
          Firebase-ready admin controls for the Invoaura CRM.
        </h1>
        <p class="subtle-copy mt-4">
          Leads sync from Firebase Authentication plus Firestore or Realtime
          Database using the paths shown below.
        </p>

        <div class="mt-8 grid gap-4 md:grid-cols-2">
          <div class="rounded-[26px] bg-black/[0.03] p-5 dark:bg-white/[0.03]">
            <div class="flex items-center gap-3">
              <ShieldCheck class="h-5 w-5 text-[var(--accent)]" />
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                Authentication
              </p>
            </div>
            <p class="mt-3 text-sm leading-7 text-muted">
              Email/password admin sign-in with optional allowlist and custom
              <code class="mx-1 rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
                admin: true
              </code>
              Firebase claim support.
            </p>
          </div>

          <div class="rounded-[26px] bg-black/[0.03] p-5 dark:bg-white/[0.03]">
            <div class="flex items-center gap-3">
              <DatabaseZap class="h-5 w-5 text-[var(--accent)]" />
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                Live data sync
              </p>
            </div>
            <p class="mt-3 text-sm leading-7 text-muted">
              {{ dataSourceLabel }} listeners update the inbox instantly and
              raise a live notification badge for newly added leads.
            </p>
          </div>
        </div>
      </article>

      <article class="surface-card p-6 sm:p-8">
        <p class="soft-pill">Connection status</p>
        <div class="mt-6 space-y-4">
          <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
            <p class="text-xs uppercase tracking-[0.24em] text-muted">
              Workspace mode
            </p>
            <p class="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              Live Firebase
            </p>
          </div>
          <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
            <p class="text-xs uppercase tracking-[0.24em] text-muted">
              Data source
            </p>
            <p class="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              {{ dataSourceLabel }}
            </p>
          </div>
          <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
            <p class="text-xs uppercase tracking-[0.24em] text-muted">
              Lead path
            </p>
            <p class="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              {{ leadDataPathLabel }}
            </p>
            <NuxtLink
              v-if="dataSourceLabel === 'Realtime Database'"
              to="/firebase-data"
              class="mt-3 inline-block text-sm font-semibold text-[var(--accent)]"
            >
              View raw JSON at this path
            </NuxtLink>
          </div>
          <div class="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
            <p class="text-xs uppercase tracking-[0.24em] text-muted">
              Admin user
            </p>
            <p class="mt-2 text-xl font-semibold text-[var(--text-primary)]">
              {{ sessionEmail }}
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article class="surface-card p-6 sm:p-8">
        <div class="flex items-center gap-3">
          <CalendarRange class="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p class="text-sm font-semibold text-[var(--text-primary)]">
              Environment checklist
            </p>
            <p class="text-sm text-muted">
              Add these keys in <code>.env.local</code> before deploying.
            </p>
          </div>
        </div>
        <ul class="mt-6 space-y-3 text-sm text-secondary">
          <li v-for="key in envKeys" :key="key">
            <code>{{ key }}</code>
          </li>
        </ul>
      </article>

      <article class="surface-card p-6 sm:p-8">
        <div class="flex items-center gap-3">
          <ShieldCheck class="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p class="text-sm font-semibold text-[var(--text-primary)]">
              Firebase rule baseline
            </p>
            <p class="text-sm text-muted">
              Use admin-only rules for whichever Firebase datastore you are
              connecting to.
            </p>
          </div>
        </div>
        <pre class="mt-6 overflow-x-auto rounded-[28px] bg-slate-950 p-5 text-xs leading-7 text-slate-100"><code>{{ rulesPreview }}</code></pre>
      </article>
    </section>
  </div>
</template>
