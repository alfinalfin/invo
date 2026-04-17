import { Factory, MoveRight } from "lucide-react";

import type { Industry } from "@/data/site-content";

type IndustryMarqueeProps = {
  industries: Industry[];
};

export function IndustryMarquee({ industries }: IndustryMarqueeProps) {
  const repeated = [...industries, ...industries];

  return (
    <div className="mask-edges overflow-hidden">
      <div className="flex w-max animate-marquee gap-4 py-4">
        {repeated.map((industry, index) => (
          <article
            key={`${industry.slug}-${index}`}
            className="min-w-[280px] max-w-[280px] rounded-[1.6rem] border border-white/10 bg-white/5 p-4 shadow-aura"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cobalt">
                <Factory className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {industry.title}
                </h3>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Sector Flow
                </p>
              </div>
            </div>
            <div
              className="bg-slate-800/50 animate-pulse mt-4 aspect-video rounded-xl"
              role="img"
              aria-label={`${industry.title} industry placeholder image`}
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm leading-6 text-slate-300">{industry.blurb}</p>
              <MoveRight className="h-4 w-4 shrink-0 text-signalOrange" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
