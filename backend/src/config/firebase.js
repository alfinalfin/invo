import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, initializeFirestore } from "firebase-admin/firestore";
import { getDatabase } from "firebase-admin/database";

let firebaseApp;
let firestoreDb;
let realtimeDb;

function isPlaceholderFirebaseConfig(value = "") {
  return ["your-project-id", "firebase-adminsdk-xxxxx", "YOUR_PRIVATE_KEY"].some((marker) =>
    value.includes(marker)
  );
}

function buildServiceAccountFromEnv() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    if (
      isPlaceholderFirebaseConfig(process.env.FIREBASE_PROJECT_ID) ||
      isPlaceholderFirebaseConfig(process.env.FIREBASE_CLIENT_EMAIL) ||
      isPlaceholderFirebaseConfig(process.env.FIREBASE_PRIVATE_KEY)
    ) {
      return null;
    }

    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    };
  }

  return null;
}

export function getFirebaseApp() {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (getApps().length > 0) {
    firebaseApp = getApp();
    return firebaseApp;
  }

  const serviceAccount = buildServiceAccountFromEnv();

  const config = {
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    databaseURL: process.env.FIREBASE_DATABASE_URL
  };

  firebaseApp = initializeApp(config);

  return firebaseApp;
}

export function getRealtimeDb() {
  if (realtimeDb) {
    return realtimeDb;
  }

  const app = getFirebaseApp();
  realtimeDb = getDatabase(app);
  return realtimeDb;
}

export function getFirestoreDb() {
  if (firestoreDb) {
    return firestoreDb;
  }

  const app = getFirebaseApp();

  try {
    firestoreDb = initializeFirestore(app, {
      preferRest: true,
      ignoreUndefinedProperties: true
    });
  } catch {
    firestoreDb = getFirestore(app);
  }

  return firestoreDb;
}
