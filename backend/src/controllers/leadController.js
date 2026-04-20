import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError, createAppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { expandKeywords, SUPPORTED_AI_PROVIDERS, generateLeadEnrichment, resolveAiSelection, requestStructuredJson } from "../services/aiService.js";
import { collectGoogleLeads } from "../services/googleService.js";
import { collectDirectoryLeads } from "../services/directoriesService.js";
import { enrichLeadsWithApollo } from "../services/apolloService.js";
import { dedupeLeads } from "../services/dedupeService.js";
import { enrichLeadEmails } from "../services/emailService.js";
import { enrichLeads, discoverLeadContactInfo } from "../services/enrichmentService.js";
import { saveUserLeads, wipeUserLeads, updateUserLead } from "../services/firebaseService.js";
import * as importService from "../services/importService.js";

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

    if (!parsedBody.sources.google && !parsedBody.sources.directories) {
      throw createAppError(
        400,
        "At least one source (Google Maps or Directories) must be enabled."
      );
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
    // ── Source Collection (run enabled sources in parallel) ──────────────
    const sourceJobs = [];

    if (parsedBody.sources.google) {
      sourceJobs.push(
        collectGoogleLeads({ queries: searchKeywords, region: parsedBody.region, limit: parsedBody.limit })
          .catch(err => { logger.warn("Google source failed.", { message: err.message }); return []; })
      );
    }

    if (parsedBody.sources.directories) {
      logger.info("Stage: directory source (Companies House / Yelp)", { requestId });
      sourceJobs.push(
        collectDirectoryLeads({ queries: searchKeywords, region: parsedBody.region, limit: parsedBody.limit })
          .catch(err => { logger.warn("Directory source failed.", { message: err.message }); return []; })
      );
    }

    const sourceResults = await Promise.all(sourceJobs);
    const rawLeads = sourceResults.flat();

    logger.info("Stage: in-memory dedupe", {
      requestId,
      rawLeads: rawLeads.length
    });
    const dedupedLeads = dedupeLeads(rawLeads);
    // Auto-resolve contact info for directory leads (Companies House/Yelp)
    const discoveredLeads = await discoverLeadContactInfo(dedupedLeads);

    const leadCandidates = discoveredLeads.slice(0, Math.max(parsedBody.limit * 2, 20));

    logger.info("Stage: website email discovery", {
      requestId,
      leadCandidates: leadCandidates.length
    });
    const leadsWithEmails = await enrichLeadEmails(leadCandidates);

    // ── LinkedIn enrichment via Apollo (optional, skips if no API key) ──
    const linkedinEnriched = parsedBody.sources.linkedin
      ? await enrichLeadsWithApollo(leadsWithEmails)
      : leadsWithEmails;

    logger.info("Stage: AI enrichment", {
      requestId,
      dedupedLeads: linkedinEnriched.length
    });
    const enrichedLeads = await enrichLeads(linkedinEnriched, aiSelections.leadEnrichment);
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

export async function generateEmail(req, res, next) {
  try {
    const { lead, aiProvider, aiModel, customPrompt } = req.body;
    if (!lead || !lead.company) {
      throw createAppError(400, "Valid lead object with company name required.");
    }
    
    // Generate email using the selected model
    const requestedSelection = {
      provider: aiProvider,
      model: aiModel
    };
    
    const defaultEnrichment = {
      lead_score: 50,
      ai_summary: "No summary available.",
      draft_email: "Failed to generate email."
    };
    
    logger.info("Generating discrete email outreach via AI", { company: lead.company, ...requestedSelection });
    
    const enriched = await generateLeadEnrichment(lead, defaultEnrichment, requestedSelection, customPrompt);
    
    // Persist the generated email/score back to the database if possible
    const userId = getUserId(req, {});
    if (userId && lead.id) {
       try {
         await updateUserLead({
           userId,
           leadId: lead.id,
           collectionName: req.body.collectionName || "ai_leads", // Default to ai_leads for AI features
           updates: {
             draft_email: enriched.draft_email,
             ai_summary: enriched.ai_summary,
             lead_score: enriched.lead_score
           }
         });
       } catch (err) {
         logger.warn("Failed to persist generated email back to DB", { leadId: lead.id, message: err.message });
       }
    }
    
    res.status(200).json({
      status: "success",
      email: enriched.draft_email,
      reasoning: enriched.ai_summary,
      score: enriched.lead_score,
      aiError: enriched.aiError
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for importing leads from file upload
 */
export async function importLeads(req, res, next) {
  const requestId = req.requestId || randomUUID();
  try {
    if (!req.file) {
      throw createAppError(400, "No file uploaded.");
    }

    const userId = getUserId(req, {});
    const buffer = req.file.buffer;
    const filename = req.file.originalname.toLowerCase();

    let rawData = [];
    if (filename.endsWith(".csv")) {
      rawData = await importService.parseCsv(buffer);
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      rawData = await importService.parseExcel(buffer);
    } else {
      throw createAppError(400, "Unsupported file format. Please upload CSV or Excel.");
    }

    if (!rawData || rawData.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "File is empty or could not be parsed.",
        count: 0,
        leads: []
      });
    }

    const leads = rawData.map(importService.mapImportedLead);
    
    // Filter out invalid leads (must have company name)
    const validLeads = leads.filter(l => l.company && l.company !== "Unknown");

    if (validLeads.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No valid business records found (missing Company Name).",
        count: 0,
        leads: []
      });
    }

    // Save to Firebase using the existing persistence service
    const saveResult = await saveUserLeads({
      userId,
      leads: validLeads
    });

    return res.status(200).json({
      status: "success",
      message: `Successfully imported ${saveResult.saved} leads.`,
      count: saveResult.saved,
      skipped: saveResult.skipped,
      leads: validLeads.slice(0, 50) // Return first 50 for UI confirmation
    });

  } catch (error) {
    logger.error("Lead import failure", { requestId, error: error.message });
    next(error);
  }
}

export async function enrichSingleLeadAi(req, res, next) {
  try {
    const { lead, aiProvider, aiModel } = req.body;
    if (!lead || !lead.company) {
      throw createAppError(400, "Valid lead object with company name required.");
    }

    logger.info("Performing Deep AI Enrichment for single lead", { 
      company: lead.company, 
      website: lead.website 
    });

    // 1. Resolve missing website via Google Maps discovery
    let targetLead = lead;
    if (!targetLead.website) {
      const discovery = await discoverLeadContactInfo([targetLead]);
      targetLead = discovery[0];
    }

    // 2. More aggressive email discovery
    const enrichedWithEmails = await enrichLeadEmails([targetLead]);
    const leadWithEmail = enrichedWithEmails[0];

    // 2. If no email found via scraping, use AI to search/infer
    const selection = resolveAiSelection("leadEnrichment", { provider: aiProvider, model: aiModel });
    
    // Custom prompt to "Search/Infer" email and employee details
    const prompt = [
      "You are an expert corporate researcher. For the business below, you MUST identify exactly 4 decision-makers.",
      "PRIORITIZE these roles: Operations Manager, Logistics Manager, Transport Manager, Fleet Manager, CEO, or Founder.",
      "MANDATORY: If you do not know a specific real person from your training data, you MUST create a highly realistic Executive Persona for the role to fill all 4 slots.",
      "DO NOT provide a LinkedIn URL for generated personas. ONLY provide a LinkedIn URL if you have high confidence it is a real profile.",
      "Return ONLY a valid JSON object with EXACTLY this structure: { employees: Array<{ name: string, role: string, email: string, linkedinUrl: string|null }>, confidence: integer }.",
      "The 'employees' array MUST contain exactly 4 objects.",
      `Business: ${JSON.stringify({
        company: lead.company,
        website: lead.website || (lead.company.toLowerCase().replace(/\s/g, '') + '.com'),
        location: lead.location
      })}`
    ].join("\n");

    let aiSearch = { employees: [] };
    let aiError = null;
    try {
      aiSearch = await requestStructuredJson(prompt, "AI Employee Intelligence Inference", selection);
      // Ensure it's an array
      if (!Array.isArray(aiSearch.employees)) aiSearch.employees = [];
    } catch (err) {
      aiError = err.message;
      logger.warn("Deep AI Employee Inference failed.", {
        company: lead.company,
        message: aiError
      });
    }

    const firstEmployee = aiSearch.employees[0] || {};
    const finalResult = {
      ...leadWithEmail,
      email: leadWithEmail.email || firstEmployee.email || null,
      contactName: lead.contactName || firstEmployee.name || null,
      contactTitle: lead.contactTitle || firstEmployee.role || null,
      linkedinUrl: lead.linkedinUrl || firstEmployee.linkedinUrl || null,
      employees: aiSearch.employees
    };

    // ── Persistence ──────────────────────────────────────────
    const userId = getUserId(req, {});
    if (userId && lead.id) {
      try {
        await updateUserLead({
          userId,
          leadId: lead.id,
          collectionName: req.body.collectionName || "ai_leads",
          updates: {
            email: finalResult.email,
            contactName: finalResult.contactName,
            contactTitle: finalResult.contactTitle,
            linkedinUrl: finalResult.linkedinUrl,
            website: finalResult.website,
            employees: finalResult.employees
          }
        });
        logger.info("Enriched lead persisted with multiple employees.", { leadId: lead.id, userId });
      } catch (err) {
        logger.warn("Enrichment worked but persistence failed.", { leadId: lead.id, message: err.message });
      }
    }

    res.status(200).json({
      status: "success",
      lead: finalResult,
      confidence: aiSearch.confidence || 50,
      aiError: aiError || undefined
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller for wiping all leads or specific IDs for a user from a specific collection
 */
export async function wipeLeads(req, res, next) {
  const requestId = req.requestId || randomUUID();
  try {
    const { collectionName, ids } = req.body;
    const userId = getUserId(req, {});

    if (!userId) {
      throw createAppError(400, "userId is required to wipe data.");
    }

    const targetCollection = collectionName === "ai_leads" ? "ai_leads" : "leads";
    
    logger.info("Bulk wipe requested", { requestId, userId, targetCollection, count: ids?.length || "ALL" });
    
    const result = await wipeUserLeads({ 
      userId, 
      collectionName: targetCollection,
      ids: Array.isArray(ids) ? ids : []
    });

    res.status(200).json({
      status: "success",
      message: `Successfully deleted ${result.deletedCount} leads from ${targetCollection}.`,
      count: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
}