export const siteConfig = {
  name: "Invoaura CRM",
  description:
    "Premium lead operations CRM for courier and logistics teams, with live quote visibility, conversion analytics, and admin-first workflow control.",
  phoneDisplay: "+91 99888 44070",
  phoneHref: "tel:+919988844070",
  locale: "en_IN",
};

export type SiteRoute = {
  path: string;
  changeFrequency: "weekly" | "monthly";
  priority: number;
};

export const sitemapRoutes: SiteRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/leads", changeFrequency: "weekly", priority: 0.85 },
  { path: "/analytics", changeFrequency: "weekly", priority: 0.8 },
  { path: "/settings", changeFrequency: "monthly", priority: 0.7 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.55 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.55 },
  { path: "/franchise", changeFrequency: "monthly", priority: 0.5 },
  { path: "/make-payment", changeFrequency: "monthly", priority: 0.45 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.35 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.35 },
];

export function resolveSiteUrl(siteUrl?: string) {
  return (
    siteUrl?.trim() ||
    process.env.NUXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://dashboard.invoaura.com"
  );
}
