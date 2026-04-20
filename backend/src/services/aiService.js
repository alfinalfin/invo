import { getOutboundProfile } from "../config/outboundProfile.js";
import { createAppError } from "../utils/errors.js";
import { fetchJsonWithRetry } from "../utils/http.js";
import { parseJsonFromModelText } from "../utils/json.js";
import { logger } from "../utils/logger.js";

const GROQ_CHAT_COMPLETIONS_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_CHAT_COMPLETIONS_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export const SUPPORTED_AI_PROVIDERS = ["groq", "openrouter", "gemini"];

const DEFAULT_AI_PROVIDER = "groq";
const DEFAULT_MODELS = {
  groq: "llama-3.3-70b-versatile",
  openrouter: "openai/gpt-4o-mini",
  gemini: "gemini-2.5-flash"
};
const PROVIDER_ALIASES = {
  google: "gemini",
  "open-router": "openrouter",
  open_router: "openrouter"
};
const PROVIDER_ENV_CONFIG = {
  groq: {
    apiKey: "GROQ_API_KEY",
    model: "GROQ_MODEL"
  },
  openrouter: {
    apiKey: "OPENROUTER_API_KEY",
    model: "OPENROUTER_MODEL"
  },
  gemini: {
    apiKey: "GEMINI_API_KEY",
    model: "GEMINI_MODEL"
  }
};
const TASK_ENV_CONFIG = {
  keywordExpansion: {
    provider: "KEYWORD_EXPANSION_PROVIDER",
    model: "KEYWORD_EXPANSION_MODEL"
  },
  leadEnrichment: {
    provider: "EMAIL_GENERATION_PROVIDER",
    model: "EMAIL_GENERATION_MODEL"
  }
};
const JSON_ONLY_SYSTEM_PROMPT =
  "Return only valid JSON. Do not wrap the response in markdown. Do not add commentary.";

function readEnvValue(envKey) {
  const value = process.env[envKey];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeProvider(provider) {
  if (!provider) {
    return null;
  }

  const normalized = provider.trim().toLowerCase();
  const resolvedProvider = PROVIDER_ALIASES[normalized] || normalized;

  if (!SUPPORTED_AI_PROVIDERS.includes(resolvedProvider)) {
    throw createAppError(
      400,
      `Unsupported AI provider "${provider}". Supported providers: ${SUPPORTED_AI_PROVIDERS.join(", ")}.`
    );
  }

  return resolvedProvider;
}

function getProviderApiKey(provider) {
  const apiKey = readEnvValue(PROVIDER_ENV_CONFIG[provider].apiKey);

  if (!apiKey) {
    throw createAppError(500, `${PROVIDER_ENV_CONFIG[provider].apiKey} is not configured.`);
  }

  if (provider === "groq" && /^groq\.com-gsk_/i.test(apiKey)) {
    return apiKey.replace(/^groq\.com-/i, "");
  }

  if (provider === "openrouter" && /^openrouter-sk-or-v1-/i.test(apiKey)) {
    return apiKey.replace(/^openrouter-/i, "");
  }

  return apiKey;
}

export function resolveAiSelection(task, requestedSelection = {}) {
  const taskEnvConfig = TASK_ENV_CONFIG[task] || {};
  const requestedProvider = normalizeProvider(requestedSelection.provider);
  const provider =
    requestedProvider ||
    normalizeProvider(readEnvValue(taskEnvConfig.provider)) ||
    normalizeProvider(readEnvValue("AI_PROVIDER")) ||
    DEFAULT_AI_PROVIDER;
  const requestedModel =
    typeof requestedSelection.model === "string" && requestedSelection.model.trim()
      ? requestedSelection.model.trim()
      : null;
  const providerEnvConfig = PROVIDER_ENV_CONFIG[provider];
  const model =
    requestedModel ||
    readEnvValue(taskEnvConfig.model) ||
    readEnvValue(providerEnvConfig.model) ||
    readEnvValue("AI_MODEL") ||
    DEFAULT_MODELS[provider];

  if (!model) {
    throw createAppError(500, `No model is configured for AI provider "${provider}".`);
  }

  return {
    provider,
    model
  };
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

function extractOpenAiCompatibleText(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      return part?.text || "";
    })
    .filter(Boolean)
    .join("\n")
    .trim();
}

function parseJsonResponse(text, label, selection) {
  if (!text) {
    throw createAppError(502, `${label} returned an empty response.`, selection);
  }

  const parsed = parseJsonFromModelText(text);

  if (parsed === null) {
    throw createAppError(502, `${label} returned invalid JSON.`, selection);
  }

  return parsed;
}

async function requestGeminiJson(prompt, label, selection) {
  const url =
    `${GEMINI_ENDPOINT}/${encodeURIComponent(selection.model)}` +
    `:generateContent?key=${encodeURIComponent(getProviderApiKey("gemini"))}`;
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

  return parseJsonResponse(extractGeminiText(payload), label, selection);
}

async function requestOpenAiCompatibleJson(prompt, label, selection) {
  const headers = {
    Authorization: `Bearer ${getProviderApiKey(selection.provider)}`,
    "Content-Type": "application/json"
  };

  if (selection.provider === "openrouter") {
    headers["HTTP-Referer"] = readEnvValue("OPENROUTER_SITE_URL") || "http://localhost:5000";
    headers["X-Title"] =
      readEnvValue("OPENROUTER_APP_NAME") || "AI Lead Generation Engine Backend";
  }

  const payload = await fetchJsonWithRetry(
    selection.provider === "groq"
      ? GROQ_CHAT_COMPLETIONS_ENDPOINT
      : OPENROUTER_CHAT_COMPLETIONS_ENDPOINT,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: selection.model,
        temperature: 0.25,
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: JSON_ONLY_SYSTEM_PROMPT
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      timeoutMs: 30000,
      retries: 2,
      retryDelayMs: 1000,
      label
    }
  );

  return parseJsonResponse(extractOpenAiCompatibleText(payload), label, selection);
}

const FALLBACK_MODELS = [
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
  { provider: "openrouter", model: "google/gemma-3-27b-it:free" },
  { provider: "groq", model: "llama-3.3-70b-versatile" },
  { provider: "groq", model: "meta-llama/llama-4-scout-17b-16e-instruct" },
  { provider: "groq", model: "llama-3.1-8b-instant" }
];

async function executeModelRequest(prompt, label, selection) {
  if (selection.provider === "gemini") {
    return requestGeminiJson(prompt, label, selection);
  }
  return requestOpenAiCompatibleJson(prompt, label, selection);
}

/**
 * Safe wrapper — returns null instead of throwing when a provider API key
 * is not configured. Used in the fallback loop to skip unavailable providers
 * without crashing the whole request.
 */
function tryGetProviderApiKey(provider) {
  try {
    return getProviderApiKey(provider);
  } catch {
    return null;
  }
}

export async function requestStructuredJson(prompt, label, selection) {
  let lastError = null;

  try {
    return await executeModelRequest(prompt, label, selection);
  } catch (err) {
    lastError = err;
    logger.warn(`Primary AI Model ${selection.model} on ${selection.provider} failed for ${label}. Engaging failover sequence.`, { message: err.message });
  }

  for (const fallback of FALLBACK_MODELS) {
    if (fallback.provider === selection.provider && fallback.model === selection.model) {
      continue; 
    }
    
    if (!tryGetProviderApiKey(fallback.provider)) {
      continue;
    }

    try {
      logger.info(`Attempting fallback model ${fallback.model} on ${fallback.provider} for ${label}`);
      return await executeModelRequest(prompt, label, fallback);
    } catch (fallbackErr) {
      lastError = fallbackErr;
      logger.warn(`Fallback model ${fallback.model} failed.`, { message: fallbackErr.message });
    }
  }

  throw new Error("All AI failbacks exhausted. Final error: " + (lastError ? lastError.message : "None"));
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

export async function expandKeywords(keywords, region, requestedSelection = {}) {
  const fallback = buildExpansionFallback(keywords, region);
  const prompt = [
    "Expand the following lead-generation search keywords for Google Maps discovery.",
    "Return only a JSON array with 5 to 10 concise search phrases.",
    "Keep them region-specific and relevant for finding real businesses.",
    `Region: ${region}`,
    `Keywords: ${JSON.stringify(keywords)}`
  ].join("\n");

  let selection;

  try {
    selection = resolveAiSelection("keywordExpansion", requestedSelection);
    const parsed = await requestStructuredJson(prompt, "AI keyword expansion", selection);
    const expandedKeywords = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.keywords)
        ? parsed.keywords
        : null;

    if (!expandedKeywords) {
      logger.warn("AI keyword expansion returned unexpected JSON. Using fallback.", selection);
      return fallback;
    }

    const cleanedKeywords = uniqueStrings(expandedKeywords);
    return cleanedKeywords.length > 0 ? cleanedKeywords.slice(0, 10) : fallback;
  } catch (error) {
    logger.warn("AI keyword expansion failed. Using fallback.", {
      provider: selection?.provider || requestedSelection.provider,
      model: selection?.model || requestedSelection.model,
      message: error.message
    });
    return fallback;
  }
}

export async function generateLeadEnrichment(lead, fallbackEnrichment, requestedSelection = {}, customPrompt = null) {
  const outboundProfile = getOutboundProfile();
  
  const promptLines = [
    "Enrich this business lead for outbound sales.",
    "Return only a JSON object with these keys:",
    "lead_score (integer 0-100), ai_summary (string), draft_email (string).",
    "Do not invent facts beyond the provided data.",
    "Write the draft_email as a real business development email from the sender profile below.",
    "The goal is to win subcontract, overflow, same-day, or time-critical freight work that the recipient can pass to the sender for execution.",
    "Keep the tone concise, professional, and commercially realistic for UK logistics outreach.",
    "CRITICAL RULE: NEVER use placeholder variables like [Your Name], [Your Phone], or [Your Email] in the draft_email. The email must be 100% ready to send without missing fields. Sign off intelligently.",
  ];

  if (customPrompt) {
    promptLines.push(`USER CUSTOM INSTRUCTION: ${customPrompt}`);
  }

  const prompt = [
    ...promptLines,
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

  let selection;

  try {
    selection = resolveAiSelection("leadEnrichment", requestedSelection);
    const parsed = await requestStructuredJson(prompt, "AI lead enrichment", selection);
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
    logger.warn("AI lead enrichment failed. Using fallback values.", {
      company: lead.company,
      provider: selection?.provider || requestedSelection.provider,
      model: selection?.model || requestedSelection.model,
      message: error.message
    });
    return { ...fallbackEnrichment, aiError: error.message };
  }
}

