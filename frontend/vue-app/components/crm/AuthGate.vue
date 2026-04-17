<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { CircleAlert, LockKeyhole, ShieldCheck } from "lucide-vue-next";
import { useFirebaseServices } from "~/composables/useFirebaseServices";

export type SessionState = {
  displayName: string;
  displayEmail: string;
};

const {
  auth,
  allowedAdminEmails,
  isFirebaseConfigured,
} = useFirebaseServices();

const email = ref("");
const password = ref("");
const loginError = ref("");
const authState = ref<
  "loading" | "signed-out" | "denied" | "ready" | "unconfigured"
>("loading");
const deniedUser = ref<User | null>(null);
const session = ref<SessionState | null>(null);

let unsubscribe: (() => void) | null = null;

if (!isFirebaseConfigured.value) {
  authState.value = "unconfigured";
} else if (import.meta.server) {
  authState.value = "signed-out";
}

async function userHasAdminAccess(user: User) {
  const tokenResult = await user.getIdTokenResult();
  const userEmail = user.email?.toLowerCase() ?? "";

  return (
    tokenResult.claims.admin === true ||
    (allowedAdminEmails.value.length > 0 &&
      allowedAdminEmails.value.includes(userEmail))
  );
}

watch(
  auth,
  (authInstance) => {
    unsubscribe?.();
    unsubscribe = null;

    if (!isFirebaseConfigured.value || !authInstance) {
      return;
    }

    unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (!user) {
        authState.value = "signed-out";
        deniedUser.value = null;
        session.value = null;
        return;
      }

      const isAdmin = await userHasAdminAccess(user);

      if (!isAdmin) {
        authState.value = "denied";
        deniedUser.value = user;
        session.value = null;
        return;
      }

      session.value = {
        displayName: user.displayName || "Admin",
        displayEmail: user.email || "admin@invoaura.com",
      };
      deniedUser.value = null;
      authState.value = "ready";
    });
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  unsubscribe?.();
});

async function handleSignIn() {
  loginError.value = "";

  if (!auth.value) {
    return;
  }

  try {
    await signInWithEmailAndPassword(auth.value, email.value, password.value);
  } catch (error) {
    loginError.value =
      error instanceof Error ? error.message : "Unable to sign in.";
  }
}
</script>

<template>
  <slot v-if="authState === 'ready' && session" :session="session" />

  <div v-else-if="authState === 'loading'" class="flex min-h-screen items-center justify-center p-6">
    <div class="surface-card max-w-md rounded-[32px] p-8 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--accent-soft)] text-[var(--accent)]">
        <ShieldCheck class="h-8 w-8" />
      </div>
      <h1 class="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
        Preparing secure workspace
      </h1>
      <p class="mt-3 text-sm leading-7 text-muted">
        Checking your Firebase admin session and warming up the live leads
        environment.
      </p>
    </div>
  </div>

  <div v-else-if="authState === 'unconfigured'" class="flex min-h-screen items-center justify-center p-6">
    <div class="surface-card max-w-lg rounded-[32px] p-8 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-amber-500/12 text-amber-600 dark:text-amber-400">
        <CircleAlert class="h-8 w-8" />
      </div>
      <h1 class="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
        Firebase is not configured
      </h1>
      <p class="mt-3 text-sm leading-7 text-muted">
        This app only shows your live leads. Copy
        <code class="mx-1 rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
          .env.example
        </code>
        to
        <code class="mx-1 rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
          .env.local
        </code>
        and fill every
        <code class="mx-1 rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
          NUXT_PUBLIC_FIREBASE_*
        </code>
        value from the Firebase console, then restart the dev server.
      </p>
    </div>
  </div>

  <div v-else-if="authState === 'denied'" class="flex min-h-screen items-center justify-center p-6">
    <div class="surface-card max-w-lg rounded-[32px] p-8 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-rose-500/12 text-rose-500">
        <LockKeyhole class="h-8 w-8" />
      </div>
      <h1 class="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
        Admin access required
      </h1>
      <p class="mt-3 text-sm leading-7 text-muted">
        This CRM is locked to accounts with the Firebase custom claim
        <code class="mx-1 rounded bg-black/10 px-1.5 py-0.5 dark:bg-white/10">
          admin: true
        </code>
        or an allowed admin email in your environment config.
      </p>
      <button
        type="button"
        class="mt-6 inline-flex items-center justify-center rounded-[22px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
        @click="deniedUser && auth ? signOut(auth) : undefined"
      >
        Sign out
      </button>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center p-6">
    <div class="surface-card-strong grid max-w-5xl gap-0 overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
      <div class="relative overflow-hidden bg-[var(--accent)] p-8 text-white sm:p-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.24),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.12),_transparent_34%)]" />
        <div class="relative">
          <p class="text-sm uppercase tracking-[0.35em] text-white/70">
            Invoaura CRM
          </p>
          <h1 class="mt-6 text-4xl font-semibold leading-tight text-balance">
            Courier ops, lead conversion, and premium client follow-up in one
            admin cockpit.
          </h1>
          <p class="mt-6 max-w-md text-sm leading-8 text-white/80">
            Sign in with your Firebase admin account to manage quotes, watch
            real-time inquiries land, and move hot leads into booked routes.
          </p>
        </div>
      </div>

      <div class="p-8 sm:p-10">
        <p class="soft-pill">Admin sign-in</p>
        <h2 class="mt-5 text-3xl font-semibold text-[var(--text-primary)]">
          Secure dashboard access
        </h2>
        <p class="mt-3 text-sm leading-7 text-muted">
          Use the same Firebase Authentication email and password your ops team
          uses for the admin panel.
        </p>

        <form
          class="mt-8 space-y-5"
          @submit.prevent="handleSignIn"
        >
          <div>
            <label
              for="email"
              class="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
            >
              Email
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="mt-2 w-full rounded-[22px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
              placeholder="ops@invoaura.com"
            />
          </div>

          <div>
            <label
              for="password"
              class="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
            >
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="mt-2 w-full rounded-[22px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
              placeholder="Enter your password"
            />
          </div>

          <div
            v-if="loginError"
            class="rounded-[22px] bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
          >
            {{ loginError }}
          </div>

          <button
            type="submit"
            class="w-full rounded-[22px] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          >
            Enter admin workspace
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
