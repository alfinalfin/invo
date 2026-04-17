import type { Metadata } from "next";

import { SimplePageShell } from "@/components/simple-page-shell";

export const metadata: Metadata = {
  title: "Franchise Opportunities",
  description:
    "Learn about franchise and network expansion opportunities with INVO AURA Logistics.",
};

export default function FranchisePage() {
  return (
    <SimplePageShell
      eyebrow="Franchise"
      title="Build regional logistics presence with a premium network model."
      description="The franchise vision focuses on high-trust local operators supported by a brand built around visibility, urgency, and disciplined delivery."
    >
      <article className="panel-glass p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">What the model prioritises</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            "Brand systems that feel premium from the first enquiry.",
            "Local market ownership with central design and SEO support.",
            "Operational playbooks for urgent courier and scheduled logistics.",
            "A platform story that can scale beyond commodity transport.",
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
