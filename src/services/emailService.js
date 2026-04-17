import { chunkArray } from "../utils/batch.js";
import { fetchTextWithRetry } from "../utils/http.js";
import { logger } from "../utils/logger.js";

const EMAIL_BATCH_SIZE = 4;
const MAX_PAGES_PER_WEBSITE = 4;
const MAX_HTML_LENGTH = 250000;
const COMMON_CONTACT_PATHS = ["/contact", "/contact-us", "/about", "/about-us", "/team"];
const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PUBLIC_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "live.com"
]);

function normalizeWebsiteUrl(website) {
  if (!website) {
    return null;
  }

  const candidate = website.trim();
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    const url = new URL(withProtocol);
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function getBaseHostname(url) {
  return url.hostname.replace(/^www\./i, "").toLowerCase();
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&#64;|&commat;/gi, "@")
    .replace(/&#46;|&period;/gi, ".")
    .replace(/&#x40;/gi, "@")
    .replace(/&#x2e;/gi, ".")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ");
}

function normalizeObfuscatedEmails(text) {
  return decodeHtmlEntities(text)
    .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
    .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
    .replace(/\s+at\s+/gi, "@")
    .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
    .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
    .replace(/\s+dot\s+/gi, ".");
}

function extractEmailsFromText(text) {
  const candidates = normalizeObfuscatedEmails(text)
    .match(EMAIL_REGEX)
    ?.map((email) => email.toLowerCase())
    .filter(Boolean);

  if (!candidates?.length) {
    return [];
  }

  return Array.from(
    new Set(
      candidates.filter((email) => {
        const [localPart, domain] = email.split("@");

        if (!localPart || !domain) {
          return false;
        }

        if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(email)) {
          return false;
        }

        return !localPart.includes("example");
      })
    )
  );
}

function extractInternalLinks(html, pageUrl) {
  const hrefMatches = Array.from(html.matchAll(/href\s*=\s*["']([^"'#]+)["']/gi));
  const links = [];

  for (const match of hrefMatches) {
    const href = match[1]?.trim();

    if (!href || /^(mailto:|tel:|javascript:)/i.test(href)) {
      continue;
    }

    try {
      const resolved = new URL(href, pageUrl);
      if (resolved.origin === pageUrl.origin) {
        resolved.hash = "";
        links.push(resolved.toString());
      }
    } catch {
      // Ignore invalid URLs in markup.
    }
  }

  return Array.from(new Set(links));
}

function buildCandidateUrls(homeUrl, homepageHtml) {
  const candidateUrls = new Set([homeUrl.toString()]);

  for (const path of COMMON_CONTACT_PATHS) {
    candidateUrls.add(new URL(path, homeUrl).toString());
  }

  const internalLinks = extractInternalLinks(homepageHtml, homeUrl);

  for (const link of internalLinks) {
    if (/contact|about|team|support|get-in-touch/i.test(link)) {
      candidateUrls.add(link);
    }
  }

  return Array.from(candidateUrls).slice(0, MAX_PAGES_PER_WEBSITE);
}

function scoreEmail(email, websiteUrl) {
  const domain = email.split("@")[1] || "";
  const websiteDomain = websiteUrl ? getBaseHostname(websiteUrl) : "";
  let score = 0;

  if (websiteDomain && domain.includes(websiteDomain)) {
    score += 40;
  }

  if (!PUBLIC_EMAIL_PROVIDERS.has(domain)) {
    score += 20;
  }

  if (/^(info|sales|contact|hello|support|enquiries|enquiry|admin)\b/i.test(email)) {
    score += 15;
  }

  if (/^(noreply|no-reply|donotreply|do-not-reply)\b/i.test(email)) {
    score -= 50;
  }

  return score;
}

function chooseBestEmail(emails, websiteUrl) {
  if (!emails.length) {
    return null;
  }

  return [...emails].sort((left, right) => scoreEmail(right, websiteUrl) - scoreEmail(left, websiteUrl))[0];
}

async function discoverEmailForLead(lead) {
  const websiteUrl = normalizeWebsiteUrl(lead.website);

  if (!websiteUrl) {
    return {
      ...lead,
      email: null
    };
  }

  try {
    const homepage = await fetchTextWithRetry(websiteUrl.toString(), {
      timeoutMs: 12000,
      retries: 1,
      retryDelayMs: 1000,
      label: "Website homepage fetch"
    });
    const homepageHtml = homepage.text.slice(0, MAX_HTML_LENGTH);
    const candidateUrls = buildCandidateUrls(new URL(homepage.url), homepageHtml);
    const collectedEmails = new Set(extractEmailsFromText(homepageHtml));

    const secondaryUrls = candidateUrls.filter((url) => url !== homepage.url);

    if (secondaryUrls.length > 0) {
      const settledPages = await Promise.allSettled(
        secondaryUrls.map((url) =>
          fetchTextWithRetry(url, {
            timeoutMs: 10000,
            retries: 1,
            retryDelayMs: 750,
            label: "Website contact page fetch"
          })
        )
      );

      settledPages.forEach((result) => {
        if (result.status !== "fulfilled") {
          return;
        }

        const pageText = result.value.text.slice(0, MAX_HTML_LENGTH);
        extractEmailsFromText(pageText).forEach((email) => collectedEmails.add(email));
      });
    }

    return {
      ...lead,
      email: chooseBestEmail(Array.from(collectedEmails), websiteUrl)
    };
  } catch (error) {
    logger.warn("Website email discovery failed.", {
      company: lead.company,
      website: lead.website,
      message: error.message
    });

    return {
      ...lead,
      email: null
    };
  }
}

export async function enrichLeadEmails(leads) {
  const leadsWithEmails = [];

  for (const leadBatch of chunkArray(leads, EMAIL_BATCH_SIZE)) {
    const settledResults = await Promise.allSettled(leadBatch.map((lead) => discoverEmailForLead(lead)));

    settledResults.forEach((result, index) => {
      const lead = leadBatch[index];

      if (result.status === "fulfilled") {
        leadsWithEmails.push(result.value);
        return;
      }

      logger.warn("Lead email discovery batch item failed.", {
        company: lead.company,
        website: lead.website,
        message: result.reason?.message
      });

      leadsWithEmails.push({
        ...lead,
        email: null
      });
    });
  }

  return leadsWithEmails;
}
