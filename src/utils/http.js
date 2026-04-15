import { delay } from "./delay.js";
import { createAppError } from "./errors.js";
import { safeJsonParse } from "./json.js";

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const DEFAULT_TEXT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; LeadEngineBot/1.0; +https://example.com/bot)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7"
};

export async function fetchJsonWithRetry(
  url,
  {
    method = "GET",
    headers = {},
    body,
    timeoutMs = 15000,
    retries = 3,
    retryDelayMs = 750,
    label = "HTTP request"
  } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          ...headers
        },
        body,
        signal: AbortSignal.timeout(timeoutMs)
      });

      const responseText = await response.text();
      const parsedBody = responseText ? safeJsonParse(responseText) : null;

      if (!response.ok) {
        const httpError = createAppError(
          response.status,
          parsedBody?.error?.message || `${label} failed with status ${response.status}.`,
          parsedBody || responseText
        );

        if (attempt < retries && RETRYABLE_STATUS_CODES.has(response.status)) {
          await delay(retryDelayMs * (attempt + 1));
          continue;
        }

        throw httpError;
      }

      if (!responseText) {
        return {};
      }

      if (parsedBody === null) {
        throw createAppError(502, `${label} returned invalid JSON.`, { responseText });
      }

      return parsedBody;
    } catch (error) {
      lastError = error;
      const statusCode = error?.statusCode || error?.status;
      const shouldRetry = !statusCode || RETRYABLE_STATUS_CODES.has(statusCode);

      if (attempt >= retries || !shouldRetry) {
        break;
      }

      await delay(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}

export async function fetchTextWithRetry(
  url,
  {
    method = "GET",
    headers = {},
    body,
    timeoutMs = 15000,
    retries = 2,
    retryDelayMs = 750,
    label = "HTTP text request"
  } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...DEFAULT_TEXT_HEADERS,
          ...headers
        },
        body,
        signal: AbortSignal.timeout(timeoutMs),
        redirect: "follow"
      });

      if (!response.ok) {
        const httpError = createAppError(
          response.status,
          `${label} failed with status ${response.status}.`,
          { url }
        );

        if (attempt < retries && RETRYABLE_STATUS_CODES.has(response.status)) {
          await delay(retryDelayMs * (attempt + 1));
          continue;
        }

        throw httpError;
      }

      const contentType = response.headers.get("content-type") || "";

      if (!/(text\/html|text\/plain|application\/xhtml\+xml)/i.test(contentType)) {
        throw createAppError(415, `${label} returned unsupported content type.`, {
          url,
          contentType
        });
      }

      const responseText = await response.text();
      return {
        url: response.url,
        contentType,
        text: responseText
      };
    } catch (error) {
      lastError = error;
      const statusCode = error?.statusCode || error?.status;
      const shouldRetry = !statusCode || RETRYABLE_STATUS_CODES.has(statusCode);

      if (attempt >= retries || !shouldRetry) {
        break;
      }

      await delay(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError;
}
