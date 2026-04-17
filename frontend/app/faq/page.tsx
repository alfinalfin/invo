import type { Metadata } from "next";

import { FAQAccordion } from "@/components/faq-accordion";
import { SimplePageShell } from "@/components/simple-page-shell";
import { faqItems } from "@/data/site-content";

export const metadata: Metadata = {
  title: "Logistics FAQ",
  description:
    "Answers to common courier, vehicle, pricing, urgency, and business logistics questions for INVO AURA Logistics.",
};

export default function FAQPage() {
  return (
    <SimplePageShell
      eyebrow="Support"
      title="Frequently asked logistics questions."
      description="A premium courier experience still needs straightforward answers. Here are the key questions businesses ask before they book."
    >
      <div className="panel-glass p-6 sm:p-8">
        <FAQAccordion items={faqItems} />
      </div>
    </SimplePageShell>
  );
}
