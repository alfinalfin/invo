import { chunkArray } from "../utils/batch.js";
import { delay } from "../utils/delay.js";
import { createAppError } from "../utils/errors.js";
import { fetchJsonWithRetry } from "../utils/http.js";
import { logger } from "../utils/logger.js";

const GOOGLE_TEXT_SEARCH_ENDPOINT =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";
const GOOGLE_PLACE_DETAILS_ENDPOINT =
  "https://maps.googleapis.com/maps/api/place/details/json";
const MAX_TEXT_SEARCH_PAGES = 3;
const SEARCH_BATCH_SIZE = 3;
const DETAILS_BATCH_SIZE = 8;
const RETRYABLE_GOOGLE_STATUS = new Set(["UNKNOWN_ERROR", "OVER_QUERY_LIMIT"]);
const REGION_ALIASES = new Map([
  [
    "uk",
    {
      label: "United Kingdom",
      searchLabel: "United Kingdom",
      code: "uk"
    }
  ],
  [
    "united kingdom",
    {
      label: "United Kingdom",
      searchLabel: "United Kingdom",
      code: "uk"
    }
  ],
  [
    "great britain",
    {
      label: "United Kingdom",
      searchLabel: "United Kingdom",
      code: "uk"
    }
  ],
  [
    "us",
    {
      label: "United States",
      searchLabel: "United States",
      code: "us"
    }
  ],
  [
    "usa",
    {
      label: "United States",
      searchLabel: "United States",
      code: "us"
    }
  ],
  [
    "united states",
    {
      label: "United States",
      searchLabel: "United States",
      code: "us"
    }
  ]
]);

function getGoogleApiKey() {
  if (!process.env.GOOGLE_API_KEY) {
    throw createAppError(500, "GOOGLE_API_KEY is not configured.");
  }

  return process.env.GOOGLE_API_KEY;
}

function cleanRegionInput(region) {
  return region
    .trim()
    .replace(/\s+/g, " ")
    .split(/\s*-\s*/)
    .filter(Boolean)[0] || region.trim();
}

function normalizeRegion(region) {
  const trimmed = cleanRegionInput(region);
  const lower = trimmed.toLowerCase();

  if (REGION_ALIASES.has(lower)) {
    return REGION_ALIASES.get(lower);
  }

  if (trimmed.length === 2) {
    return { label: trimmed.toUpperCase(), searchLabel: trimmed.toUpperCase(), code: lower };
  }

  return { label: trimmed, searchLabel: trimmed, code: "" };
}

function buildRegionalQuery(query, region) {
  const normalizedRegion = normalizeRegion(region);
  const regionSearchLabel = normalizedRegion.searchLabel || normalizedRegion.label;
  return query.trim().toLowerCase().includes(regionSearchLabel.toLowerCase())
    ? query.trim()
    : `${query.trim()} ${regionSearchLabel}`;
}

function validateGooglePayload(payload, label) {
  const status = payload?.status;

  if (status === "OK" || status === "ZERO_RESULTS") {
    return payload;
  }

  throw createAppError(502, `${label} failed with Google status ${status || "UNKNOWN"}.`, {
    status,
    errorMessage: payload?.error_message
  });
}

async function fetchGoogleTextSearchPage({ query, region, pageToken }) {
  const apiKey = getGoogleApiKey();
  const params = new URLSearchParams({ key: apiKey });

  if (pageToken) {
    params.set("pagetoken", pageToken);
  } else {
    const normalizedRegion = normalizeRegion(region);
    params.set("query", buildRegionalQuery(query, region));

    if (normalizedRegion.code) {
      params.set("region", normalizedRegion.code);
    }
  }

  const url = `${GOOGLE_TEXT_SEARCH_ENDPOINT}?${params.toString()}`;
  return fetchJsonWithRetry(url, {
    timeoutMs: 20000,
    retries: 2,
    retryDelayMs: 1000,
    label: "Google Places Text Search"
  });
}

async function fetchNextPageWithRetry({ query, region, pageToken }) {
  let payload = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await delay(2000);
    payload = await fetchGoogleTextSearchPage({
      query,
      region,
      pageToken
    });

    if (payload?.status !== "INVALID_REQUEST") {
      return payload;
    }
  }

  return payload;
}

async function searchBusinesses(query, region) {
  const results = [];
  let nextPageToken = null;

  for (let pageNumber = 0; pageNumber < MAX_TEXT_SEARCH_PAGES; pageNumber += 1) {
    let payload;

    if (pageNumber > 0 && nextPageToken) {
      payload = await fetchNextPageWithRetry({
        query,
        region,
        pageToken: nextPageToken
      });

      if (payload?.status === "INVALID_REQUEST") {
        logger.warn("Google next_page_token was not ready after retries. Keeping collected results.", {
          query,
          pageNumber,
          nextPageToken
        });
        break;
      }
    } else {
      payload = await fetchGoogleTextSearchPage({
        query,
        region,
        pageToken: nextPageToken
      });
    }

    if (RETRYABLE_GOOGLE_STATUS.has(payload?.status)) {
      await delay(1500);
      payload = await fetchGoogleTextSearchPage({
        query,
        region,
        pageToken: nextPageToken
      });
    }

    validateGooglePayload(payload, "Google Places Text Search");

    if (Array.isArray(payload.results)) {
      results.push(...payload.results);
    }

    if (!payload.next_page_token) {
      break;
    }

    nextPageToken = payload.next_page_token;
  }

  return results;
}

async function fetchPlaceDetails(placeId) {
  const params = new URLSearchParams({
    key: getGoogleApiKey(),
    place_id: placeId,
    fields: "formatted_address,formatted_phone_number,website"
  });

  const url = `${GOOGLE_PLACE_DETAILS_ENDPOINT}?${params.toString()}`;
  const payload = await fetchJsonWithRetry(url, {
    timeoutMs: 15000,
    retries: 2,
    retryDelayMs: 1000,
    label: "Google Place Details"
  });

  validateGooglePayload(payload, "Google Place Details");
  return payload.result || {};
}

function uniquePlacesById(places) {
  const uniquePlaces = new Map();

  for (const place of places) {
    if (place?.place_id && !uniquePlaces.has(place.place_id)) {
      uniquePlaces.set(place.place_id, place);
    }
  }

  return Array.from(uniquePlaces.values());
}

function cleanWebsite(website) {
  return typeof website === "string" && website.trim() ? website.trim() : null;
}

function cleanPhoneNumber(phone) {
  return typeof phone === "string" && phone.trim() ? phone.trim() : null;
}

function normalizeLead(place, details = {}) {
  return {
    company: place?.name?.trim() || "Unknown company",
    location:
      details.formatted_address?.trim() ||
      place?.formatted_address?.trim() ||
      place?.vicinity?.trim() ||
      "Unknown location",
    phone: cleanPhoneNumber(details.formatted_phone_number),
    website: cleanWebsite(details.website),
    email: null,
    source: "google_maps"
  };
}

export async function collectGoogleLeads({ queries, region, limit }) {
  const uniqueQueries = Array.from(
    new Set(
      queries
        .map((query) => query?.trim())
        .filter(Boolean)
    )
  );

  if (uniqueQueries.length === 0) {
    return [];
  }

  logger.info("Starting Google Places discovery.", {
    queryCount: uniqueQueries.length,
    region
  });

  const rawPlaces = [];
  const failedQueries = [];

  for (const queryBatch of chunkArray(uniqueQueries, SEARCH_BATCH_SIZE)) {
    const settledResults = await Promise.allSettled(
      queryBatch.map((query) => searchBusinesses(query, region))
    );

    settledResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        rawPlaces.push(...result.value);
        return;
      }

      failedQueries.push({
        query: queryBatch[index],
        message: result.reason?.message || "Unknown Google Places error."
      });

      logger.warn("Google text search batch item failed.", {
        query: queryBatch[index],
        message: result.reason?.message
      });
    });
  }

  if (rawPlaces.length === 0 && failedQueries.length > 0) {
    throw createAppError(502, "Google Places discovery failed for this request.", {
      provider: "google_places",
      failedQueries
    });
  }

  const detailCandidates = uniquePlacesById(rawPlaces).slice(0, Math.max(limit * 3, 30));
  const leads = [];

  for (const placeBatch of chunkArray(detailCandidates, DETAILS_BATCH_SIZE)) {
    const settledDetails = await Promise.allSettled(
      placeBatch.map((place) => fetchPlaceDetails(place.place_id))
    );

    settledDetails.forEach((result, index) => {
      const place = placeBatch[index];

      if (result.status === "fulfilled") {
        leads.push(normalizeLead(place, result.value));
        return;
      }

      logger.warn("Google Place Details failed. Falling back to search payload.", {
        placeId: place.place_id,
        company: place.name,
        message: result.reason?.message
      });

      leads.push(normalizeLead(place));
    });
  }

  logger.info("Google Places discovery completed.", {
    rawPlaces: rawPlaces.length,
    detailCandidates: detailCandidates.length,
    leads: leads.length,
    failedQueries: failedQueries.length
  });

  return leads;
}
