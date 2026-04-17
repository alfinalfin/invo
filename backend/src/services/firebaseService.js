import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getFirestoreDb } from "../config/firebase.js";
import { chunkArray } from "../utils/batch.js";
import { createAppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { buildUniqueKey } from "./dedupeService.js";

const LEADS_COLLECTION = "leads";
const FIRESTORE_BATCH_SIZE = 400;

function buildLeadDocumentId(userId, uniqueKey) {
  return createHash("sha1").update(`${userId}:${uniqueKey}`).digest("hex");
}

async function fetchExistingLeadKeys(userId) {
  const db = getFirestoreDb();
  const snapshot = await db.collection(LEADS_COLLECTION).where("userId", "==", userId).get();
  const existingKeys = new Set();

  snapshot.forEach((documentSnapshot) => {
    const uniqueKey = documentSnapshot.get("uniqueKey");

    if (uniqueKey) {
      existingKeys.add(uniqueKey);
    }
  });

  return existingKeys;
}

function normalizeFirestoreError(error) {
  const message = error?.message || "Firestore request failed.";

  if (message.includes("Cloud Firestore API has not been used") || message.includes("SERVICE_DISABLED")) {
    return createAppError(
      503,
      "Firestore is not enabled for this Google project. Enable Cloud Firestore API and create a Firestore database, then retry.",
      {
        provider: "firestore",
        reason: "api_disabled"
      }
    );
  }

  if (message.includes("UNAVAILABLE")) {
    return createAppError(503, "Firestore is temporarily unavailable.", {
      provider: "firestore",
      reason: "unavailable"
    });
  }

  return createAppError(500, "Failed to persist leads to Firestore.", {
    provider: "firestore",
    reason: "unknown",
    message
  });
}

export async function saveUserLeads({ userId, leads }) {
  if (!userId) {
    throw createAppError(400, "A userId is required to store leads in Firestore.");
  }

  if (!Array.isArray(leads) || leads.length === 0) {
    return { saved: 0, skipped: 0 };
  }

  const db = getFirestoreDb();
  try {
    const existingKeys = await fetchExistingLeadKeys(userId);
    const leadPayloads = [];
    let skipped = 0;

    for (const lead of leads) {
      const uniqueKey = buildUniqueKey(lead);

      if (!uniqueKey || existingKeys.has(uniqueKey)) {
        skipped += 1;
        continue;
      }

      existingKeys.add(uniqueKey);
      leadPayloads.push({
        documentId: buildLeadDocumentId(userId, uniqueKey),
        data: {
          ...lead,
          userId,
          uniqueKey,
          createdAt: Timestamp.now()
        }
      });
    }

    for (const payloadBatch of chunkArray(leadPayloads, FIRESTORE_BATCH_SIZE)) {
      const batch = db.batch();

      for (const payload of payloadBatch) {
        const documentReference = db.collection(LEADS_COLLECTION).doc(payload.documentId);
        batch.set(documentReference, payload.data, { merge: true });
      }

      await batch.commit();
    }

    logger.info("Firestore persistence completed.", {
      userId,
      saved: leadPayloads.length,
      skipped
    });

    return {
      saved: leadPayloads.length,
      skipped
    };
  } catch (error) {
    logger.error("Firestore persistence failed.", {
      userId,
      message: error?.message
    });
    throw normalizeFirestoreError(error);
  }
}

export async function wipeUserLeads({ userId, collectionName = LEADS_COLLECTION, ids = [] }) {
  if (!userId) {
    throw createAppError(400, "A userId is required to wipe leads.");
  }

  const db = getFirestoreDb();
  try {
    let snapshot;
    if (ids && ids.length > 0) {
      // Fetch specifically by ID
      const refs = ids.map(id => db.collection(collectionName).doc(id));
      snapshot = await db.getAll(...refs);
    } else {
      // Fetch all for user
      snapshot = await db.collection(collectionName).where("userId", "==", userId).get();
    }
    
    const docs = Array.isArray(snapshot) ? snapshot : snapshot.docs;
    if (!docs || docs.length === 0) {
      return { deletedCount: 0 };
    }

    const batches = chunkArray(docs, FIRESTORE_BATCH_SIZE);
    let deletedCount = 0;

    for (const docBatch of batches) {
      const batch = db.batch();
      for (const doc of docBatch) {
        if (doc.exists || (doc.ref && doc.id)) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      }
      await batch.commit();
    }

    logger.info("Bulk deletion completed.", { userId, collectionName, deletedCount, isPartial: ids.length > 0 });
    return { deletedCount };
  } catch (error) {
    logger.error("Failed to perform bulk deletion.", { userId, collectionName, message: error.message });
    throw normalizeFirestoreError(error);
  }
}
