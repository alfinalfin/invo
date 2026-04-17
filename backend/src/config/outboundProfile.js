const DEFAULT_OUTBOUND_PROFILE = {
  companyName: "InvoAura Logistics UK",
  tagline: "Dedicated Same-Day & Time-Critical Freight",
  positioning:
    "InvoAura Logistics is a leading UK courier service. We support freight forwarders, logistics operators, and businesses with urgent, dedicated A-to-B transport solutions built for speed, reliability, and professional communication.",
  offer:
    "We take subcontract, overflow, urgent same-day, and time-critical freight work from freight forwarders, logistics operators, and businesses, then execute it reliably under tight timelines.",
  targetAudience:
    "freight forwarders, logistics operators, and businesses that need dependable transport execution support",
  callToAction:
    "Invite them to discuss subcontract support, overflow coverage, or urgent shipment handling.",
  signatureName: "[Your Name]",
  signatureTitle: "Business Development | InvoAura Logistics UK",
  signaturePhone: "[Your Phone]",
  signatureEmail: "[Your Email]",
  signatureWebsite: "[Your Website]"
};

function readProfileValue(envKey, fallback) {
  const value = process.env[envKey];
  return value && value.trim() ? value.trim() : fallback;
}

export function getOutboundProfile() {
  return {
    companyName: readProfileValue("OUTBOUND_COMPANY_NAME", DEFAULT_OUTBOUND_PROFILE.companyName),
    tagline: readProfileValue("OUTBOUND_TAGLINE", DEFAULT_OUTBOUND_PROFILE.tagline),
    positioning: readProfileValue("OUTBOUND_POSITIONING", DEFAULT_OUTBOUND_PROFILE.positioning),
    offer: readProfileValue("OUTBOUND_OFFER", DEFAULT_OUTBOUND_PROFILE.offer),
    targetAudience: readProfileValue("OUTBOUND_TARGET_AUDIENCE", DEFAULT_OUTBOUND_PROFILE.targetAudience),
    callToAction: readProfileValue("OUTBOUND_CALL_TO_ACTION", DEFAULT_OUTBOUND_PROFILE.callToAction),
    signatureName: readProfileValue("OUTBOUND_SIGNATURE_NAME", DEFAULT_OUTBOUND_PROFILE.signatureName),
    signatureTitle: readProfileValue("OUTBOUND_SIGNATURE_TITLE", DEFAULT_OUTBOUND_PROFILE.signatureTitle),
    signaturePhone: readProfileValue("OUTBOUND_SIGNATURE_PHONE", DEFAULT_OUTBOUND_PROFILE.signaturePhone),
    signatureEmail: readProfileValue("OUTBOUND_SIGNATURE_EMAIL", DEFAULT_OUTBOUND_PROFILE.signatureEmail),
    signatureWebsite: readProfileValue("OUTBOUND_SIGNATURE_WEBSITE", DEFAULT_OUTBOUND_PROFILE.signatureWebsite)
  };
}
