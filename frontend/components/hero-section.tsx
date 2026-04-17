"use client";

import { motion } from "framer-motion";
import { Clock3, ShieldCheck, Sparkles, Waypoints } from "lucide-react";

import { MultiStepQuoteForm } from "@/components/multi-step-quote-form";

const heroCards = [
  {
    icon: Clock3,
    label: "60 Minute Average",
    text: "Urgent collection planning for live operational pressure.",
  },
  {
    icon: Waypoints,
    label: "Dedicated Routes",
    text: "One vehicle, one mission, one visible chain of updates.",
  },
  {
    icon: ShieldCheck,
    label: "Premium Visibility",
    text: "Human support, proof of delivery, and status confidence.",
  },
];

export function HeroSection() {
  return (
    <section id="quote" className="section-shell relative overflow-hidden pb-20 pt-12 sm:pb-24 sm:pt-16">
      <div className="absolute left-[-8%] top-20 h-72 w-72 rounded-full bg-radial-cobalt blur-3xl" />
      <div className="absolute right-[-5%] top-10 h-80 w-80 rounded-full bg-radial-ember blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="pt-4"
        >
          <div className="eyebrow">
            <Sparkles className="h-3.5 w-3.5 text-cobalt" />
            Same Day Courier and Logistics
          </div>

          <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            UK logistics, directed with calm precision and visible urgency.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            INVO AURA Logistics delivers same-day and scheduled courier support
            for businesses that need more than transport. We build confidence
            around every route with personal dispatch, dedicated vehicles, and
            premium communication from pickup to proof of delivery.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-full border border-cobalt/20 bg-cobalt/10 px-4 py-2 text-sm font-semibold text-white">
              SAME DAY RESPONSE
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200">
              NEXT DAY PLANNING
            </div>
            <div className="rounded-full border border-signalOrange/20 bg-signalOrange/10 px-4 py-2 text-sm font-semibold text-white">
              DEDICATED VEHICLES
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {heroCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <motion.article
                  key={card.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    ease: "easeOut",
                    delay: 0.12 + index * 0.08,
                  }}
                  className="rounded-[1.5rem] border border-white/[0.08] bg-white/5 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cobalt">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-white">
                    {card.label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {card.text}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.12 }}
          className="lg:pl-4"
        >
          <MultiStepQuoteForm />
        </motion.div>
      </div>
    </section>
  );
}
