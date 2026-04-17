import type { Metadata } from "next";

import { CRMWorkspace } from "@/components/crm/crm-workspace";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return <CRMWorkspace section="settings" />;
}
