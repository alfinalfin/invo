import { fetchJsonWithRetry } from "../utils/http.js";
import { logger } from "../utils/logger.js";

// ─────────────────────────────────────────────
// Apollo.io People Search API
// Used to enrich existing leads with executive emails & LinkedIn context.
// This is the compliant way to get "LinkedIn-style" data.
// Sign up at: https://app.apollo.io → Settings → API Keys
// Free tier: 50 person exports/month
// ─────────────────────────────────────────────

const APOLLO_PEOPLE_SEARCH_URL = "https://api.apollo.io/v1/mixed_people/search";

function getApolloKey() {
  return process.env.APOLLO_API_KEY || null;
}

/**
 * Given a company name, search Apollo for the most relevant executive.
 * Returns { name, title, linkedin_url, email } or null.
 */
async function findExecutiveForCompany(companyName, apiKey) {
  try {
    const res = await fetchJsonWithRetry(APOLLO_PEOPLE_SEARCH_URL, {
      method: "POST",
      timeoutMs: 10000,
      retries: 1,
      retryDelayMs: 1000,
      label: `Apollo Executive Search (${companyName})`,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey
      },
      body: JSON.stringify({
        q_organization_name: companyName,
        person_titles: ["CEO", "Managing Director", "Director", "Logistics Manager", "Operations Manager", "Founder"],
        per_page: 1
      })
    });

    const person = res?.people?.[0];
    if (!person) return null;

    return {
      contactName:   [person.first_name, person.last_name].filter(Boolean).join(" ") || null,
      contactTitle:  person.title || null,
      linkedinUrl:   person.linkedin_url || null,
      contactEmail:  person.email || null
    };
  } catch (err) {
    logger.warn("Apollo executive lookup failed.", { company: companyName, message: err.message });
    return null;
  }
}

/**
 * Enriches an array of leads with Apollo executive data.
 * Leads that Apollo can't match are returned unchanged.
 * Safe to call without an Apollo key — returns leads unchanged.
 */
export async function enrichLeadsWithApollo(leads) {
  const apiKey = getApolloKey();
  if (!apiKey) {
    logger.info("APOLLO_API_KEY not set — skipping LinkedIn executive enrichment.");
    return leads;
  }

  logger.info("Starting Apollo executive enrichment.", { leadCount: leads.length });

  const enriched = [];

  for (const lead of leads) {
    if (!lead.company || lead.company === "Unknown Company") {
      enriched.push(lead);
      continue;
    }

    const executive = await findExecutiveForCompany(lead.company, apiKey);

    if (executive) {
      enriched.push({
        ...lead,
        // Only override email if we don't already have one from website scraping
        email:        lead.email || executive.contactEmail || lead.email,
        contactName:  executive.contactName,
        contactTitle: executive.contactTitle,
        linkedinUrl:  executive.linkedinUrl
      });
    } else {
      enriched.push(lead);
    }
  }

  logger.info("Apollo enrichment completed.", {
    enriched: enriched.filter(l => l.linkedinUrl).length,
    total: enriched.length
  });

  return enriched;
}
