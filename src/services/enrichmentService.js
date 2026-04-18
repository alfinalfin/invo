import { chunkArray } from "../utils/batch.js";
import { logger } from "../utils/logger.js";
import { getOutboundProfile } from "../config/outboundProfile.js";
import { generateLeadEnrichment } from "./aiService.js";
import { resolveSingleBusinessContact } from "./googleService.js";

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
    draft_email: ""
  };
}

export async function discoverLeadContactInfo(leads) {
  const needsDiscovery = leads.filter(l => !l.website && (l.source === "companies_house" || l.source === "yelp"));
  
  if (needsDiscovery.length === 0) {
    return leads;
  }

  logger.info("Starting automated contact discovery for leads missing websites.", { 
    total: leads.length,
    searching: needsDiscovery.length 
  });
  
  const discoveredMap = new Map();
  
  // Process in small batches to respect rate limits
  for (const batch of chunkArray(needsDiscovery, 5)) {
    const batchResults = await Promise.allSettled(
      batch.map(async (lead) => {
        const contact = await resolveSingleBusinessContact(lead.company, lead.location);
        return { company: lead.company, contact };
      })
    );
    
    batchResults.forEach((res) => {
      if (res.status === "fulfilled" && res.value.contact) {
        discoveredMap.set(res.value.company, res.value.contact);
      }
    });
  }
  
  return leads.map(lead => {
    const discovery = discoveredMap.get(lead.company);
    if (discovery) {
      return {
        ...lead,
        ...discovery,
        discovery_status: "resolved"
      };
    }
    return lead;
  });
}

export async function enrichLeads(leads, aiOptions = {}) {
  // We now skip costly AI generation during bulk scraping.
  // The AI is exclusively invoked 'on-demand' in the frontend.
  return leads.map(lead => ({
    ...lead,
    ...buildFallbackEnrichment(lead)
  }));
}
