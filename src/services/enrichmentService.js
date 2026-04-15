import { chunkArray } from "../utils/batch.js";
import { logger } from "../utils/logger.js";
import { getOutboundProfile } from "../config/outboundProfile.js";
import { generateLeadEnrichment } from "./geminiService.js";

const ENRICHMENT_BATCH_SIZE = 5;

function buildFallbackLeadScore(lead) {
  let score = 25;

  if (lead.website) {
    score += 35;
  }

  if (lead.email) {
    score += 15;
  }

  if (lead.phone) {
    score += 20;
  }

  if (lead.location) {
    score += 10;
  }

  if (lead.source === "google_maps") {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

export function buildFallbackEnrichment(lead) {
  const outboundProfile = getOutboundProfile();
  const score = buildFallbackLeadScore(lead);
  const company = lead.company || "this company";
  const location = lead.location || "their market";

  return {
    lead_score: score,
    ai_summary: `${company} appears in Google Maps for ${location}. ${
      lead.email
        ? `A reachable business email (${lead.email}) was found on the website, which improves outbound readiness.`
        : lead.website
          ? "The business has a website, which signals stronger outbound readiness."
          : "A website was not found, so phone-led outreach may convert better."
    }`,
    draft_email:
      `Subject: Dedicated same-day support for ${company}\n\n` +
      `Hi ${company} team,\n\n` +
      `I'm reaching out from ${outboundProfile.companyName}. ${outboundProfile.positioning}\n\n` +
      `We regularly support ${outboundProfile.targetAudience} with subcontract, overflow, and urgent same-day work when they need a dependable partner to execute quickly and communicate professionally from collection through delivery.\n\n` +
      `If your team ever needs support covering time-critical freight around ${location}, we'd be glad to help. ${outboundProfile.callToAction}\n\n` +
      `Best regards,\n` +
      `${outboundProfile.signatureName}\n` +
      `${outboundProfile.signatureTitle}\n` +
      `${outboundProfile.signaturePhone}\n` +
      `${outboundProfile.signatureEmail}\n` +
      `${outboundProfile.signatureWebsite}`
  };
}

export async function enrichLeads(leads) {
  const enrichedLeads = [];

  for (const leadBatch of chunkArray(leads, ENRICHMENT_BATCH_SIZE)) {
    const settledEnrichment = await Promise.allSettled(
      leadBatch.map((lead) => generateLeadEnrichment(lead, buildFallbackEnrichment(lead)))
    );

    settledEnrichment.forEach((result, index) => {
      const lead = leadBatch[index];

      if (result.status === "fulfilled") {
        enrichedLeads.push({
          ...lead,
          ...result.value
        });
        return;
      }

      logger.warn("Lead enrichment batch item failed. Using fallback.", {
        company: lead.company,
        message: result.reason?.message
      });

      enrichedLeads.push({
        ...lead,
        ...buildFallbackEnrichment(lead)
      });
    });
  }

  return enrichedLeads;
}
