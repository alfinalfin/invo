import type { Metadata } from "next";

import { CRMWorkspace } from "@/components/crm/crm-workspace";

export const metadata: Metadata = {
  title: "Converted Leads",
};

export default function ConvertedLeadsPage() {
  return <CRMWorkspace section="converted_leads" />;
}
