import type { Metadata } from "next";

import { SimplePageShell } from "@/components/simple-page-shell";

export const metadata: Metadata = {
  title: "Careers and Driver Opportunities",
  description:
    "Explore courier, driver, and operations opportunities with INVO AURA Logistics across the UK.",
};

export default function CareersPage() {
  return (
    <SimplePageShell
      eyebrow="Careers"
      title="Drive with a dispatch team that values calm under pressure."
      description="We are building a premium logistics operation for drivers, dispatchers, and support teams who care about communication as much as delivery performance."
    >
      <article className="panel-glass p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">Why join INVO AURA?</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            "Dedicated business-focused routes and repeat client work.",
            "Operational visibility with a premium service culture.",
            "Growth opportunities across courier and support roles.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300"
            >
              {item}
            </div>
          ))}
        </div>
      </article>
    </SimplePageShell>
  );
}
