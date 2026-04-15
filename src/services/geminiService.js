import { createAppError } from "../utils/errors.js";
import { fetchJsonWithRetry } from "../utils/http.js";
import { parseJsonFromModelText } from "../utils/json.js";
import { logger } from "../utils/logger.js";
import { getOutboundProfile } from "../config/outboundProfile.js";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";

function getGeminiApiKey() {
  if (!process.env.GEMINI_API_KEY) {
    throw createAppError(500, "GEMINI_API_KEY is not configured.");
  }

  return process.env.GEMINI_API_KEY;
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

function uniqueStrings(values) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter(Boolean)
    )
  );
}

function buildExpansionFallback(keywords, region) {
  const fallback = [];

  for (const keyword of keywords) {
    fallback.push(keyword);
    fallback.push(`${keyword} ${region}`);
    fallback.push(`${keyword} companies ${region}`);
    fallback.push(`${keyword} businesses ${region}`);
    fallback.push(`${keyword} contact details ${region}`);
    fallback.push(`${keyword} logistics companies ${region}`);
  }

  return uniqueStrings(fallback).slice(0, 10);
}

async function requestGeminiJson(prompt, label) {
  const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(getGeminiModel())}:generateContent?key=${encodeURIComponent(getGeminiApiKey())}`;
  const payload = await fetchJsonWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.25,
        responseMimeType: "application/json"
      }
    }),
    timeoutMs: 30000,
    retries: 2,
    retryDelayMs: 1000,
    label
  });

  const text = extractGeminiText(payload);

  if (!text) {
    throw createAppError(502, `${label} returned an empty response.`);
  }

  return parseJsonFromModelText(text);
}

export async function expandKeywords(keywords, region) {
  const fallback = buildExpansionFallback(keywords, region);
  const prompt = [
    "Expand the following lead-generation search keywords for Google Maps discovery.",
    "Return only a JSON array with 5 to 10 concise search phrases.",
    "Keep them region-specific and relevant for finding real businesses.",
    `Region: ${region}`,
    `Keywords: ${JSON.stringify(keywords)}`
  ].join("\n");

  try {
    const parsed = await requestGeminiJson(prompt, "Gemini keyword expansion");
    const expandedKeywords = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.keywords)
        ? parsed.keywords
        : null;

    if (!expandedKeywords) {
      logger.warn("Gemini keyword expansion returned unexpected JSON. Using fallback.");
      return fallback;
    }

    const cleanedKeywords = uniqueStrings(expandedKeywords);
    return cleanedKeywords.length > 0 ? cleanedKeywords.slice(0, 10) : fallback;
  } catch (error) {
    logger.warn("Gemini keyword expansion failed. Using fallback.", { message: error.message });
    return fallback;
  }
}

export async function generateLeadEnrichment(lead, fallbackEnrichment) {
  const outboundProfile = getOutboundProfile();
  const prompt = [
    "Enrich this business lead for outbound sales.",
    "Return only a JSON object with these keys:",
    "lead_score (integer 0-100), ai_summary (string), draft_email (string).",
    "Do not invent facts beyond the provided data.",
    "Write the draft_email as a real business development email from the sender profile below.",
    "The goal is to win subcontract, overflow, same-day, or time-critical freight work that the recipient can pass to the sender for execution.",
    "Keep the tone concise, professional, and commercially realistic for UK logistics outreach.",
    `Sender Profile: ${JSON.stringify(outboundProfile)}`,
    `Lead: ${JSON.stringify({
      company: lead.company,
      location: lead.location,
      phone: lead.phone,
      email: lead.email,
      website: lead.website,
      source: lead.source
    })}`
  ].join("\n");

  try {
    const parsed = await requestGeminiJson(prompt, "Gemini lead enrichment");
    const leadScore = Number.isFinite(Number(parsed?.lead_score))
      ? Math.max(0, Math.min(100, Math.round(Number(parsed.lead_score))))
      : fallbackEnrichment.lead_score;

    return {
      lead_score: leadScore,
      ai_summary:
        typeof parsed?.ai_summary === "string" && parsed.ai_summary.trim()
          ? parsed.ai_summary.trim()
          : fallbackEnrichment.ai_summary,
      draft_email:
        typeof parsed?.draft_email === "string" && parsed.draft_email.trim()
          ? parsed.draft_email.trim()
          : fallbackEnrichment.draft_email
    };
  } catch (error) {
    logger.warn("Gemini enrichment failed. Using fallback values.", {
      company: lead.company,
      message: error.message
    });
    return fallbackEnrichment;
  }
}
