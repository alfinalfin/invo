import type { Metadata } from "next";

import { SimplePageShell } from "@/components/simple-page-shell";

export const metadata: Metadata = {
  title: "Make a Payment",
  description:
    "Secure payment route placeholder for INVO AURA Logistics customer invoices and service settlements.",
};

export default function MakePaymentPage() {
  return (
    <SimplePageShell
      eyebrow="Payments"
      title="A payment destination that feels as polished as the dispatch flow."
      description="This route is ready to be connected to Stripe, a hosted invoice portal, or your preferred payment provider."
    >
      <article className="panel-glass p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">Next integration step</h2>
        <p className="mt-4 text-sm leading-8 text-slate-300">
          Wire this page to your payment provider, invoice system, or customer
          account area. The navigation, metadata, and sitemap support are
          already in place.
        </p>
      </article>
    </SimplePageShell>
  );
}
