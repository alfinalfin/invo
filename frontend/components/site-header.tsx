"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  CreditCard,
  Globe2,
  Menu,
  Phone,
  X,
} from "lucide-react";
import { useState } from "react";

import { services } from "@/data/site-content";
import { siteConfig } from "@/lib/site";

const navLinks = [
  { label: "Industries", href: "/#industries" },
  { label: "Vehicles", href: "/#vehicles" },
  { label: "About", href: "/#about" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-obsidian/70 backdrop-blur-xl">
      <div className="section-shell">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold tracking-[0.35em] text-white">
              IA
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-[0.22em] text-white">
                INVO AURA
              </p>
              <p className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
                Logistics
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            <div className="group relative">
              <Link
                href="/#services"
                className="flex items-center gap-2 text-sm font-medium text-slate-200 transition hover:text-white"
              >
                Services <ChevronDown className="h-4 w-4" />
              </Link>
              <div className="pointer-events-none absolute left-0 top-full pt-5 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div className="panel-glass grid w-[40rem] gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.slice(0, 8).map((service) => (
                      <Link
                        key={service.slug}
                        href="/#services"
                        className="rounded-2xl border border-white/[0.08] bg-white/5 p-4 transition hover:border-cobalt/30 hover:bg-white/[0.08]"
                      >
                        <p className="text-xs uppercase tracking-[0.28em] text-cobalt">
                          {service.eyebrow}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {service.title}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          {service.note}
                        </p>
                      </Link>
                    ))}
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-cobalt/[0.16] via-white/5 to-signalOrange/10 p-5">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                      Aura Dispatch
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">
                      One premium route desk for urgent UK logistics.
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Dedicated vehicles, fast collections, and a human team
                      that stays visible from booking to proof of delivery.
                    </p>
                    <Link
                      href="/#quote"
                      className="mt-5 inline-flex rounded-full border border-white/[0.15] px-4 py-2 text-sm font-semibold text-white transition hover:border-cobalt/40 hover:bg-white/[0.08]"
                    >
                      Build a quote
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-200 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href={siteConfig.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Phone className="h-4 w-4 text-cobalt" />
              {siteConfig.phoneDisplay}
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-300">
              <Globe2 className="h-4 w-4 text-cobalt" />
              <span className="text-white">EN</span>
              <span className="text-slate-500">/</span>
              <span>ES</span>
            </div>
            <Link
              href="/make-payment"
              className="inline-flex items-center gap-2 rounded-full bg-signalOrange px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ff5f24]"
            >
              <CreditCard className="h-4 w-4" />
              Make Payment
            </Link>
          </div>

          <button
            type="button"
            aria-label="Open mobile menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-t border-white/[0.08] bg-obsidian/95 lg:hidden"
          >
            <div className="section-shell space-y-4 py-5">
              <div className="panel-glass space-y-3 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Services
                </p>
                <div className="grid gap-2">
                  {services.slice(0, 6).map((service) => (
                    <Link
                      key={service.slug}
                      href="/#services"
                      className="rounded-2xl border border-white/[0.08] bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                      onClick={() => setMobileOpen(false)}
                    >
                      {service.title}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                {[...navLinks, { label: "FAQ", href: "/faq" }].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="rounded-2xl border border-white/[0.08] bg-white/5 px-4 py-3 text-sm font-medium text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={siteConfig.phoneHref}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Call {siteConfig.phoneDisplay}
                </Link>
                <Link
                  href="/make-payment"
                  className="rounded-2xl bg-signalOrange px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  Make Payment
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
