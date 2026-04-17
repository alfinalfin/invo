import type { Metadata } from "next";

import { SimplePageShell } from "@/components/simple-page-shell";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Review the current placeholder terms and conditions page for INVO AURA Logistics.",
};

export default function TermsPage() {
  return (
    <SimplePageShell
      eyebrow="Terms"
      title="Commercial terms and transport conditions."
      description="This placeholder route is ready for your formal service terms, booking conditions, and payment language."
    >
      <article className="panel-glass p-6 sm:p-8 text-sm leading-8 text-slate-300">
        Booking conditions, liability details, payment terms, and service
        restrictions should be added here before production launch. The route is
        in place so the footer, sitemap, and metadata are ready now.
      </article>
    </SimplePageShell>
  );
}
