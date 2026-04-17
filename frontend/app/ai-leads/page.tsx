import type { Metadata } from "next";

import { CRMWorkspace } from "@/components/crm/crm-workspace";

export const metadata: Metadata = {
  title: "AI Leads Engine",
};

export default function AiLeadsPage() {
  return <CRMWorkspace section="ai_leads" />;
}
