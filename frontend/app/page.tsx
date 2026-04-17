import type { Metadata } from "next";

import { CRMWorkspace } from "@/components/crm/crm-workspace";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return <CRMWorkspace section="dashboard" />;
}
