import type { Metadata } from "next";

import { SimplePageShell } from "@/components/simple-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Understand how INVO AURA Logistics handles enquiry data, quote submissions, and service communications.",
};

export default function PrivacyPage() {
  return (
    <SimplePageShell
      eyebrow="Privacy"
      title="Clear handling for enquiry data and client communication."
      description="This placeholder privacy page gives the site a live destination while the final legal copy is prepared."
    >
      <article className="panel-glass p-6 sm:p-8 text-sm leading-8 text-slate-300">
        We only collect the contact and shipment information needed to respond
        to quote requests, support customer communication, and provide logistics
        services. Replace this placeholder with final legal copy before launch.
      </article>
    </SimplePageShell>
  );
}
