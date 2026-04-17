<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { onValue, ref as databaseRef } from "firebase/database";
import { ArrowLeft } from "lucide-vue-next";
import { useFirebaseServices } from "~/composables/useFirebaseServices";

useSeoMeta({
  title: "Realtime Database",
});

const {
  hasRealtimeDatabaseConfig,
  isFirebaseConfigured,
  realtimeLeadsPath,
  rtdb,
} = useFirebaseServices();

const rawJson = ref<string>("");
const loadError = ref<string | null>(null);
const loading = ref(true);

let detach: (() => void) | null = null;

watch(
  [rtdb, realtimeLeadsPath],
  () => {
    detach?.();
    detach = null;

    if (import.meta.server) {
      return;
    }

    if (!hasRealtimeDatabaseConfig.value) {
      loading.value = false;
      loadError.value =
        "Realtime Database is not configured. Set NUXT_PUBLIC_FIREBASE_DATABASE_URL in your environment.";
      return;
    }

    const db = rtdb.value;
    if (!db) {
      loading.value = true;
      loadError.value = null;
      return;
    }

    const nodeRef = databaseRef(db, realtimeLeadsPath.value);
    detach = onValue(
      nodeRef,
      (snap) => {
        const val = snap.val();
        rawJson.value =
          val === undefined || val === null
            ? "(empty — no value at this path)"
            : JSON.stringify(val, null, 2);
        loadError.value = null;
        loading.value = false;
      },
      (err) => {
        loadError.value = err.message;
        loading.value = false;
      },
    );
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  detach?.();
});
</script>

<template>
  <CrmAuthGate v-slot="slotProps">
    <main class="min-h-screen p-4 sm:p-6">
      <div class="mx-auto max-w-4xl space-y-4">
        <NuxtLink
          to="/settings"
          class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
        >
          <ArrowLeft class="h-4 w-4" />
          Back to settings
        </NuxtLink>

        <div class="surface-card-strong rounded-[28px] p-6 sm:p-8">
          <p class="soft-pill">Firebase Realtime Database</p>
          <h1 class="section-heading mt-4 text-balance">
            Raw JSON at your lead path
          </h1>
          <p class="subtle-copy mt-3">
            Live snapshot of
            <code class="rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
              {{ realtimeLeadsPath }}
            </code>
            (from
            <code class="rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
              NUXT_PUBLIC_RTDB_LEADS_PATH
            </code>
            ). Dashboard and Leads map this into tables; use this page to verify
            structure and permissions.
          </p>
          <p
            v-if="!isFirebaseConfigured"
            class="mt-4 rounded-[20px] bg-amber-500/15 px-4 py-3 text-sm text-amber-800 dark:text-amber-200"
          >
            Firebase env vars are missing — add
            <code class="mx-1 rounded bg-black/10 px-1 py-0.5 dark:bg-white/10">
              NUXT_PUBLIC_FIREBASE_*
            </code>
            to <code class="mx-1 rounded bg-black/10 px-1 py-0.5 dark:bg-white/10">.env.local</code>
            and restart the dev server.
          </p>
        </div>

        <div
          v-if="loadError"
          class="rounded-[24px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200"
        >
          {{ loadError }}
        </div>

        <div
          v-else-if="loading"
          class="surface-card rounded-[24px] p-8 text-center text-sm text-muted"
        >
          Loading…
        </div>

        <pre
          v-else
          class="surface-card overflow-x-auto rounded-[24px] p-5 text-left text-xs leading-relaxed text-[var(--text-primary)]"
        ><code>{{ rawJson }}</code></pre>
      </div>
    </main>
  </CrmAuthGate>
</template>
