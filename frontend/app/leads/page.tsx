import type { Metadata } from "next";

import { CRMWorkspace } from "@/components/crm/crm-workspace";

export const metadata: Metadata = {
  title: "Leads",
};

export default function LeadsPage() {
  return <CRMWorkspace section="leads" />;
}
