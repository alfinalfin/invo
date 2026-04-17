import { CRMWorkspace } from "@/components/crm/crm-workspace";

export const metadata = {
  title: "Generate PODs | InvoAura Logistics",
  description: "Generate and manage Proof of Delivery documents.",
};

export default function GeneratePodsPage() {
  return <CRMWorkspace section="generate_pods" />;
}
