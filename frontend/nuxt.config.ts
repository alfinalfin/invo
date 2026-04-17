import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Ensure .env / .env.local are applied before runtimeConfig reads process.env.
 * Fixes "Firebase is not configured" when vars exist on disk but were not loaded yet.
 */
function mergeProjectEnvFiles() {
  const merged: Record<string, string> = {};
  for (const name of [".env", ".env.local"] as const) {
    const filePath = resolve(process.cwd(), name);
    if (!existsSync(filePath)) continue;
    let text = readFileSync(filePath, "utf8");
    if (text.charCodeAt(0) === 0xfeff) {
      text = text.slice(1);
    }
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      merged[key] = val;
    }
  }
  for (const [key, val] of Object.entries(merged)) {
    if (val !== "" && (process.env[key] === undefined || process.env[key] === "")) {
      process.env[key] = val;
    }
  }
}

mergeProjectEnvFiles();

export default defineNuxtConfig({
  compatibilityDate: "2026-04-04",
  srcDir: "vue-app/",
  serverDir: "server/",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: false },
  app: {
    head: {
      titleTemplate: "%s | Invoaura CRM",
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@400;500;600;700;800&display=swap",
        },
      ],
    },
  },
  runtimeConfig: {
    public: {
      siteUrl:
        process.env.NUXT_PUBLIC_SITE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://dashboard.invoaura.com",
      firebaseApiKey:
        process.env.NUXT_PUBLIC_FIREBASE_API_KEY ||
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        "",
      firebaseAuthDomain:
        process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
        "",
      firebaseDatabaseUrl:
        process.env.NUXT_PUBLIC_FIREBASE_DATABASE_URL ||
        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
        "",
      firebaseProjectId:
        process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
        "",
      firebaseStorageBucket:
        process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        "",
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
        "",
      firebaseAppId:
        process.env.NUXT_PUBLIC_FIREBASE_APP_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
        "",
      allowedAdminEmails:
        process.env.NUXT_PUBLIC_ALLOWED_ADMIN_EMAILS ||
        process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS ||
        "",
      leadsCollection:
        process.env.NUXT_PUBLIC_LEADS_COLLECTION ||
        process.env.NEXT_PUBLIC_LEADS_COLLECTION ||
        "quotes",
      rtdbLeadsPath:
        process.env.NUXT_PUBLIC_RTDB_LEADS_PATH ||
        process.env.NEXT_PUBLIC_RTDB_LEADS_PATH ||
        "quoteRequests",
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ||
        process.env.NEXT_PUBLIC_API_BASE ||
        "http://129.154.254.139",
    },
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  nitro: {
    compressPublicAssets: true,
  },
  typescript: {
    strict: true,
    shim: false,
  },
});
