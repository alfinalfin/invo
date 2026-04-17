import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getFirestore, type Firestore } from "firebase/firestore";
import { computed, onMounted, shallowRef, type ComputedRef, type ShallowRef } from "vue";
import { useRuntimeConfig } from "#imports";

type FirebaseServices = {
  auth: ShallowRef<Auth | null>;
  db: ShallowRef<Firestore | null>;
  rtdb: ShallowRef<Database | null>;
  allowedAdminEmails: ComputedRef<string[]>;
  leadsCollectionName: ComputedRef<string>;
  realtimeLeadsPath: ComputedRef<string>;
  aiLeadsCollectionName: ComputedRef<string>;
  realtimeAiLeadsPath: ComputedRef<string>;
  isFirebaseConfigured: ComputedRef<boolean>;
  hasRealtimeDatabaseConfig: ComputedRef<boolean>;
  firebaseLeadDataSource: ComputedRef<"Realtime Database" | "Firestore">;
};

export function useFirebaseServices(): FirebaseServices {
  const runtimeConfig = useRuntimeConfig();

  const isFirebaseConfigured = computed(() => {
    const p = runtimeConfig.public;
    return [
      p.firebaseApiKey,
      p.firebaseAuthDomain,
      p.firebaseProjectId,
      p.firebaseStorageBucket,
      p.firebaseMessagingSenderId,
      p.firebaseAppId,
    ].every((v) => String(v ?? "").trim().length > 0);
  });

  const hasRealtimeDatabaseConfig = computed(
    () =>
      isFirebaseConfigured.value &&
      String(runtimeConfig.public.firebaseDatabaseUrl ?? "").trim().length > 0,
  );

  const firebaseLeadDataSource = computed<"Realtime Database" | "Firestore">(() =>
    hasRealtimeDatabaseConfig.value ? "Realtime Database" : "Firestore",
  );

  const allowedAdminEmails = computed(() =>
    String(runtimeConfig.public.allowedAdminEmails ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  const leadsCollectionName = computed(
    () => runtimeConfig.public.leadsCollection?.trim() || "quotes",
  );

  const realtimeLeadsPath = computed(
    () => runtimeConfig.public.rtdbLeadsPath?.trim() || "quoteRequests",
  );

  const aiLeadsCollectionName = computed(() => "ai_leads");
  const realtimeAiLeadsPath = computed(() => "leadEngine");

  const authRef = shallowRef<Auth | null>(null);
  const dbRef = shallowRef<Firestore | null>(null);
  const rtdbRef = shallowRef<Database | null>(null);

  onMounted(() => {
    if (!import.meta.client || !isFirebaseConfigured.value) {
      return;
    }

    const cfg = {
      apiKey: String(runtimeConfig.public.firebaseApiKey).trim(),
      authDomain: String(runtimeConfig.public.firebaseAuthDomain).trim(),
      databaseURL: String(runtimeConfig.public.firebaseDatabaseUrl ?? "").trim(),
      projectId: String(runtimeConfig.public.firebaseProjectId).trim(),
      storageBucket: String(runtimeConfig.public.firebaseStorageBucket).trim(),
      messagingSenderId: String(runtimeConfig.public.firebaseMessagingSenderId).trim(),
      appId: String(runtimeConfig.public.firebaseAppId).trim(),
    };

    const app: FirebaseApp = getApps().length ? getApp() : initializeApp(cfg);
    authRef.value = getAuth(app);
    dbRef.value = getFirestore(app);
    rtdbRef.value = cfg.databaseURL ? getDatabase(app) : null;
  });

  return {
    auth: authRef,
    db: dbRef,
    rtdb: rtdbRef,
    allowedAdminEmails,
    leadsCollectionName,
    realtimeLeadsPath,
    aiLeadsCollectionName,
    realtimeAiLeadsPath,
    isFirebaseConfigured,
    hasRealtimeDatabaseConfig,
    firebaseLeadDataSource,
  };
}
