function normalizeWhitespace(value = "") {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCompanyKey(company) {
  return normalizeWhitespace(company || "").toLowerCase();
}

export function normalizeWebsiteKey(website) {
  if (!website) {
    return "";
  }

  const candidate = website.trim();
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    const parsedUrl = new URL(withProtocol);
    const hostname = parsedUrl.hostname.replace(/^www\./i, "").toLowerCase();
    const pathname = parsedUrl.pathname.replace(/\/+$/, "").toLowerCase();
    return `${hostname}${pathname}`;
  } catch {
    return candidate
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

export function buildUniqueKey(lead) {
  return normalizeWebsiteKey(lead?.website) || normalizeCompanyKey(lead?.company);
}

function scoreLead(lead) {
  return ["company", "location", "phone", "website", "lead_score", "ai_summary", "draft_email"].reduce(
    (score, field) => (lead?.[field] ? score + 1 : score),
    0
  );
}

function hydrateLead(primary, fallback) {
  const merged = { ...primary };

  for (const [field, value] of Object.entries(fallback || {})) {
    if (
      (merged[field] === undefined || merged[field] === null || merged[field] === "") &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      merged[field] = value;
    }
  }

  return merged;
}

export function dedupeLeads(leads) {
  const uniqueLeads = new Map();

  for (const lead of leads) {
    const uniqueKey = buildUniqueKey(lead);

    if (!uniqueKey) {
      continue;
    }

    if (!uniqueLeads.has(uniqueKey)) {
      uniqueLeads.set(uniqueKey, lead);
      continue;
    }

    const currentLead = uniqueLeads.get(uniqueKey);
    const preferredLead =
      scoreLead(lead) > scoreLead(currentLead)
        ? hydrateLead(lead, currentLead)
        : hydrateLead(currentLead, lead);

    uniqueLeads.set(uniqueKey, preferredLead);
  }

  return Array.from(uniqueLeads.values());
}
