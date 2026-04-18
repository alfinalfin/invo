import { fetchJsonWithRetry } from "../utils/http.js";
import { logger } from "../utils/logger.js";
import { chunkArray } from "../utils/batch.js";

// ─────────────────────────────────────────────
// Companies House (UK) — free, unlimited
// https://developer-specs.company-information.service.gov.uk/
// ─────────────────────────────────────────────
const CH_SEARCH_URL = "https://api.company-information.service.gov.uk/search/companies";
const CH_OFFICERS_URL = "https://api.company-information.service.gov.uk/company";

function getCompaniesHouseKey() {
  return process.env.COMPANIES_HOUSE_API_KEY || null;
}

function buildChAuthHeader(apiKey) {
  // Companies House uses HTTP Basic Auth: key as username, empty password
  const encoded = Buffer.from(`${apiKey}:`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}

function normalizeCompaniesHouseLead(item) {
  const address = item.registered_office_address || {};
  const parts = [
    address.address_line_1,
    address.address_line_2,
    address.locality,
    address.postal_code,
    address.country || "United Kingdom"
  ].filter(Boolean);

  return {
    company:  item.title || item.company_name || "Unknown Company",
    location: parts.join(", ") || "United Kingdom",
    phone:    null,
    website:  null,
    email:    null,
    source:   "companies_house",
    status:   item.company_status || "active",
    companyNumber: item.company_number || null
  };
}

async function searchCompaniesHouse(keyword, apiKey, maxResults = 20) {
  const params = new URLSearchParams({
    q:             keyword,
    items_per_page: String(Math.min(maxResults, 100))
  });
  const url = `${CH_SEARCH_URL}?${params.toString()}`;

  try {
    const data = await fetchJsonWithRetry(url, {
      timeoutMs: 15000,
      retries: 2,
      retryDelayMs: 800,
      label: "Companies House Search",
      headers: buildChAuthHeader(apiKey)
    });

    if (!data || !Array.isArray(data.items)) {
      return [];
    }

    return data.items
      .filter(item => item.company_status === "active")
      .map(normalizeCompaniesHouseLead);
  } catch (err) {
    if (err.message?.includes("401")) {
      logger.error("Companies House Search failed: Invalid API Key. Please check the key in your .env file.");
    } else {
      logger.warn("Companies House search failed for keyword.", {
        keyword,
        message: err.message
      });
    }
    return [];
  }
}

export async function collectCompaniesHouseLeads({ queries, limit }) {
  const apiKey = getCompaniesHouseKey();
  if (!apiKey) {
    logger.info("COMPANIES_HOUSE_API_KEY not set — skipping UK directory source.");
    return [];
  }

  logger.info("Starting Companies House discovery.", { queryCount: queries.length });

  const perQueryLimit = Math.ceil(limit / Math.max(queries.length, 1));
  const allLeads = [];

  for (const batch of chunkArray(queries, 3)) {
    const settled = await Promise.allSettled(
      batch.map(q => searchCompaniesHouse(q, apiKey, perQueryLimit))
    );

    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        allLeads.push(...result.value);
      } else {
        logger.warn("CH batch item failed.", { query: batch[i], message: result.reason?.message });
      }
    });
  }

  logger.info("Companies House discovery completed.", { total: allLeads.length });
  return allLeads.slice(0, limit);
}

// ─────────────────────────────────────────────
// Yelp Fusion — 500 req/day free
// https://docs.developer.yelp.com/reference/v3_business_search
// ─────────────────────────────────────────────
const YELP_SEARCH_URL = "https://api.yelp.com/v3/businesses/search";

function getYelpKey() {
  return process.env.YELP_API_KEY || null;
}

function normalizeYelpLead(biz) {
  const loc = biz.location || {};
  const displayAddress = Array.isArray(loc.display_address)
    ? loc.display_address.join(", ")
    : [loc.address1, loc.city, loc.country].filter(Boolean).join(", ");

  return {
    company:  biz.name || "Unknown Business",
    location: displayAddress || "Unknown",
    phone:    biz.display_phone || biz.phone || null,
    website:  biz.url || null,
    email:    null,
    source:   "yelp"
  };
}

async function searchYelp(keyword, region, apiKey, limit = 20) {
  const params = new URLSearchParams({
    term:     keyword,
    location: region,
    limit:    String(Math.min(limit, 50))
  });
  const url = `${YELP_SEARCH_URL}?${params.toString()}`;

  try {
    const data = await fetchJsonWithRetry(url, {
      timeoutMs: 12000,
      retries: 2,
      retryDelayMs: 500,
      label: "Yelp Fusion Search",
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!data || !Array.isArray(data.businesses)) return [];
    return data.businesses.map(normalizeYelpLead);
  } catch (err) {
    logger.warn("Yelp search failed for keyword.", { keyword, message: err.message });
    return [];
  }
}

export async function collectYelpLeads({ queries, region, limit }) {
  const apiKey = getYelpKey();
  if (!apiKey) {
    logger.info("YELP_API_KEY not set — skipping Yelp directory source.");
    return [];
  }

  logger.info("Starting Yelp Fusion discovery.", { queryCount: queries.length });

  const perQueryLimit = Math.ceil(limit / Math.max(queries.length, 1));
  const allLeads = [];

  for (const batch of chunkArray(queries, 3)) {
    const settled = await Promise.allSettled(
      batch.map(q => searchYelp(q, region, apiKey, perQueryLimit))
    );

    settled.forEach((result, i) => {
      if (result.status === "fulfilled") {
        allLeads.push(...result.value);
      } else {
        logger.warn("Yelp batch item failed.", { query: batch[i], message: result.reason?.message });
      }
    });
  }

  logger.info("Yelp discovery completed.", { total: allLeads.length });
  return allLeads.slice(0, limit);
}

// ─────────────────────────────────────────────
// Combined entry point — picks the right source based on region
// ─────────────────────────────────────────────
export async function collectDirectoryLeads({ queries, region, limit }) {
  const regionLower = (region || "").toLowerCase();

  // MUCH broader UK detection to match cities and regions
  const ukKeywords = [
    "uk", "united kingdom", "england", "scotland", "wales", "britain", "gb",
    "london", "manchester", "birmingham", "leeds", "glasgow", "liverpool",
    "bristol", "sheffield", "nottingham", "cardiff", "belfast", "newcastle",
    "heathrow", "gatwick", "southampton", "felixstowe", "dover", "tilbury",
    "hull", "grimsby", "aberdeen", "edinburgh", "portsmouth", "plymouth"
  ];

  const isUK = ukKeywords.some(kw => regionLower.includes(kw));

  if (isUK) {
    logger.info("Region identified as UK. Using Companies House directory.", { region });
    return collectCompaniesHouseLeads({ queries, limit });
  }

  // Fallback to Yelp for non-UK or international
  logger.info("Region not identified as UK. Using Yelp Fusion directory.", { region });
  return collectYelpLeads({ queries, region, limit });
}
