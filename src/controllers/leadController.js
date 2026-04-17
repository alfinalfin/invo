import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError, createAppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { expandKeywords, SUPPORTED_AI_PROVIDERS } from "../services/aiService.js";
import { collectGoogleLeads } from "../services/googleService.js";
import { dedupeLeads } from "../services/dedupeService.js";
import { enrichLeadEmails } from "../services/emailService.js";
import { enrichLeads } from "../services/enrichmentService.js";
import { saveUserLeads } from "../services/firebaseService.js";

const aiProviderSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.enum(SUPPORTED_AI_PROVIDERS)
);
const optionalModelSchema = z
  .string()
  .trim()
  .min(1, "Model names must not be empty.")
  .optional();
const requestSchema = z.object({
  keywords: z
    .union([
      z.array(z.string().trim().min(2, "Each keyword must be at least 2 characters long.")),
      z.string().trim().min(2, "At least one keyword is required.")
    ])
    .transform((value) =>
      Array.isArray(value)
        ? value
        : value
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean)
    )
    .refine((keywords) => keywords.length > 0, "At least one keyword is required."),
  region: z.string().trim().min(2, "Region is required."),
  limit: z.coerce.number().int().min(10).max(100),
  userId: z.string().trim().optional(),
  sources: z
    .object({
      google: z.boolean().default(true),
      directories: z.boolean().default(false),
      linkedin: z.boolean().default(false)
    })
    .default({
      google: true,
      directories: false,
      linkedin: false
    }),
  ai: z
    .object({
      provider: aiProviderSchema.optional().default("groq"),
      model: optionalModelSchema,
      keywordProvider: aiProviderSchema.optional(),
      keywordModel: optionalModelSchema,
      emailProvider: aiProviderSchema.optional(),
      emailModel: optionalModelSchema
    })
    .default({
      provider: "groq"
    })
});

function getUserId(req, parsedBody) {
  return (
    req.headers["x-user-id"] ||
    req.headers["x-firebase-uid"] ||
    parsedBody.userId ||
    req.user?.uid
  );
}

function uniqueKeywordList(keywords) {
  return Array.from(new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)));
}

function buildAiSelections(ai = {}) {
  return {
    keywordExpansion: {
      provider: ai.keywordProvider || ai.provider,
      model: ai.keywordModel || ai.model
    },
    leadEnrichment: {
      provider: ai.emailProvider || ai.provider,
      model: ai.emailModel || ai.model
    }
  };
}

function isFirestorePersistenceError(error) {
  return error instanceof AppError && error.details?.provider === "firestore";
}

export async function scrapeLeads(req, res, next) {
  const requestId = req.requestId || randomUUID();

  try {
    const parsedBody = requestSchema.parse(req.body);
    const userId = getUserId(req, parsedBody);
    const aiSelections = buildAiSelections(parsedBody.ai);

    if (!userId) {
      throw createAppError(400, "userId is required in the request body or x-user-id header.");
    }

    if (parsedBody.sources.linkedin) {
      throw createAppError(400, "LinkedIn scraping is intentionally not supported.");
    }

    if (!parsedBody.sources.google) {
      throw createAppError(
        400,
        "Google Maps must be enabled because it is the only configured real lead source."
      );
    }

    if (parsedBody.sources.directories) {
      logger.warn("Directory source requested without a configured provider. Skipping directories.", {
        requestId,
        userId
      });
    }

    logger.info("Lead scrape started.", {
      requestId,
      userId,
      keywordCount: parsedBody.keywords.length,
      region: parsedBody.region,
      limit: parsedBody.limit,
      keywordAiProvider: aiSelections.keywordExpansion.provider,
      emailAiProvider: aiSelections.leadEnrichment.provider,
      emailAiModel: aiSelections.leadEnrichment.model
    });

    logger.info("Stage: keyword expansion", { requestId });
    const expandedKeywords = await expandKeywords(
      parsedBody.keywords,
      parsedBody.region,
      aiSelections.keywordExpansion
    );
    const searchKeywords = uniqueKeywordList([...parsedBody.keywords, ...expandedKeywords]).slice(0, 10);

    logger.info("Stage: Google Places fetch", {
      requestId,
      queryCount: searchKeywords.length
    });
    const rawLeads = await collectGoogleLeads({
      queries: searchKeywords,
      region: parsedBody.region,
      limit: parsedBody.limit
    });

    logger.info("Stage: in-memory dedupe", {
      requestId,
      rawLeads: rawLeads.length
    });
    const dedupedLeads = dedupeLeads(rawLeads);
    const leadCandidates = dedupedLeads.slice(0, Math.max(parsedBody.limit * 2, 20));

    logger.info("Stage: website email discovery", {
      requestId,
      leadCandidates: leadCandidates.length
    });
    const leadsWithEmails = await enrichLeadEmails(leadCandidates);

    logger.info("Stage: AI enrichment", {
      requestId,
      dedupedLeads: leadsWithEmails.length
    });
    const enrichedLeads = await enrichLeads(leadsWithEmails, aiSelections.leadEnrichment);
    const limitedLeads = enrichedLeads.slice(0, parsedBody.limit);

    logger.info("Stage: Firestore persistence", {
      requestId,
      leadCount: limitedLeads.length
    });
    let saved = 0;
    let skipped = 0;

    try {
      const persistenceResult = await saveUserLeads({
        userId,
        leads: limitedLeads
      });
      saved = persistenceResult.saved;
      skipped = persistenceResult.skipped;
    } catch (error) {
      if (!isFirestorePersistenceError(error)) {
        throw error;
      }

      logger.warn("Lead scrape completed without persistence.", {
        requestId,
        userId,
        returned: limitedLeads.length,
        message: error.message,
        reason: error.details?.reason
      });

      res.status(200).json({
        status: "partial_success",
        saved,
        skipped,
        leads: limitedLeads,
        persistence: {
          status: "failed",
          message: error.message,
          reason: error.details?.reason
        }
      });
      return;
    }

    logger.info("Lead scrape completed.", {
      requestId,
      userId,
      saved,
      skipped,
      returned: limitedLeads.length
    });

    res.status(200).json({
      status: "success",
      saved,
      skipped,
      leads: limitedLeads
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(createAppError(400, "Invalid request payload.", error.flatten()));
      return;
    }

    next(error);
  }
}
