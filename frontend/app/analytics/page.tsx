import type { Metadata } from "next";

import { CRMWorkspace } from "@/components/crm/crm-workspace";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return <CRMWorkspace section="analytics" />;
}
