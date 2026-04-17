import Link from "next/link";
import {
  BellDot,
  ChartColumnIncreasing,
  CheckCircle,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Truck,
  UsersRound,
  Zap,
  Plus
} from "lucide-react";

import type { DashboardSection } from "@/lib/crm";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activeSection: DashboardSection;
  notificationCount: number;
  openLeadCount: number;
  todayCount: number;
};

const items = [
  {
    href: "/",
    label: "Dashboard",
    section: "dashboard" as const,
    icon: LayoutDashboard,
  },
  {
    href: "/leads",
    label: "Leads",
    section: "leads" as const,
    icon: UsersRound,
  },
  {
    href: "/converted-leads",
    label: "Converted Leads",
    section: "converted_leads" as const,
    icon: CheckCircle,
  },
  {
    href: "/generate-pods",
    label: "Generate PODs",
    section: "generate_pods" as const,
    icon: FileText,
  },
  {
    href: "/ai-leads",
    label: "AI Leads Engine",
    section: "ai_leads" as const,
    icon: Zap,
  },
  {
    href: "/analytics",
    label: "Analytics",
    section: "analytics" as const,
    icon: ChartColumnIncreasing,
  },
  {
    href: "/settings",
    label: "Settings",
    section: "settings" as const,
    icon: Settings,
  },
];

export function Sidebar({
  activeSection,
  notificationCount,
  openLeadCount,
  todayCount,
}: SidebarProps) {
  return (
    <aside className="fixed hidden lg:flex left-0 top-0 h-screen w-64 pt-20 bg-slate-100 dark:bg-slate-950 flex-col z-40 border-r border-outline-variant/10">
      <div className="flex flex-col h-full py-4 gap-2">
        <div className="px-6 mb-6">
          <button className="w-full py-3 px-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus className="w-5 h-5" />
            <span>Add Lead</span>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.section === activeSection;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-all duration-300 mx-2",
                  isActive
                    ? "bg-white dark:bg-slate-900 text-primary shadow-sm rounded-lg font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium rounded-lg"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.section === "leads" && notificationCount > 0 ? (
                  <span className="rounded-full bg-error px-2 py-0.5 text-[11px] font-bold text-on-error">
                    {notificationCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-outline-variant/10 pt-4 space-y-4 px-6 mb-4">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-on-surface">Live Queue</p>
              <BellDot className="h-4 w-4 text-outline" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface p-2 rounded-lg text-center border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase">Open</p>
                <p className="text-sm font-black mt-1">{openLeadCount}</p>
              </div>
              <div className="bg-surface p-2 rounded-lg text-center border border-outline-variant/10">
                <p className="text-[10px] font-bold text-outline uppercase">Today</p>
                <p className="text-sm font-black mt-1">{todayCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
