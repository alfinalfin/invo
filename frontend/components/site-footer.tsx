import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";

import { statusItems } from "@/data/site-content";
import { siteConfig } from "@/lib/site";

const footerLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "Careers", href: "/careers" },
  { label: "Drive With Us", href: "/careers" },
  { label: "Franchise", href: "/franchise" },
  { label: "Privacy", href: "/privacy" },
  { label: "T&Cs", href: "/terms" },
];

const socialLinks = [
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "Twitter", href: "#", icon: Twitter },
];

export function SiteFooter() {
  const scrollingStatus = [...statusItems, ...statusItems];

  return (
    <footer className="border-t border-white/[0.08] bg-black/30">
      <div className="section-shell py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-5">
            <div className="eyebrow">INVO AURA Dispatch Network</div>
            <div className="max-w-2xl">
              <h2 className="section-heading text-3xl sm:text-4xl">
                Premium courier visibility for businesses that cannot afford
                drift.
              </h2>
              <p className="muted-copy mt-4">
                We blend urgent-response transport with premium communication,
                dependable vehicles, and a dispatch experience that feels calm
                even when the shipment is not.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cobalt/30 hover:bg-white/[0.08]"
                  >
                    <Icon className="h-4 w-4 text-cobalt" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <article className="panel-glass p-6">
              <h3 className="text-lg font-semibold text-white">Quick Links</h3>
              <div className="mt-4 grid gap-3">
                {footerLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-sm text-slate-300 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </article>

            <article className="panel-glass p-6">
              <h3 className="text-lg font-semibold text-white">Contact</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>{siteConfig.phoneDisplay}</p>
                <p>hello@invoaura.co.uk</p>
                <p>Serving the UK with same-day and planned logistics.</p>
              </div>
            </article>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-full border border-white/10 bg-white/5">
          <div className="mask-edges">
            <div className="flex w-max animate-ticker gap-10 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-300">
              {scrollingStatus.map((item, index) => (
                <span key={`${item}-${index}`} className="whitespace-nowrap">
                  [{` ${item} `}]
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-6 text-xs uppercase tracking-[0.28em] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{siteConfig.name}</p>
          <p>Personalised. Professional. Punctual.</p>
        </div>
      </div>
    </footer>
  );
}
