import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyB0CP1bU95vvgZd6FMGllk0H9E1whqING4",
  authDomain: "invo-e72fe.firebaseapp.com",
  databaseURL: "https://invo-e72fe-default-rtdb.firebaseio.com",
  projectId: "invo-e72fe",
  storageBucket: "invo-e72fe.firebasestorage.app",
  messagingSenderId: "615806474524",
  appId: "1:615806474524:web:f38b6163dc08e1c09642d9",
  measurementId: "G-8L0X3VXN8C"
};

export const allowedAdminEmails = (process.env.NEXT_PUBLIC_ALLOWED_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const leadsCollectionName =
  process.env.NEXT_PUBLIC_LEADS_COLLECTION?.trim() || "quotes";

export const realtimeLeadsPath =
  process.env.NEXT_PUBLIC_RTDB_LEADS_PATH?.trim() || "quoteRequests";

export const isFirebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(Boolean);

export const hasRealtimeDatabaseConfig =
  isFirebaseConfigured && Boolean(firebaseConfig.databaseURL);

const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const analytics = firebaseApp ? getAnalytics(firebaseApp) : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const rtdb =
  firebaseApp && hasRealtimeDatabaseConfig ? getDatabase(firebaseApp) : null;

export const firebaseLeadDataSource = hasRealtimeDatabaseConfig
  ? "Realtime Database"
  : "Firestore";
