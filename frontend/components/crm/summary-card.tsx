import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SummaryCardProps = {
  title: string;
  value: string;
  trend: string;
  subtitle: string;
  direction: "up" | "down";
  icon: LucideIcon;
};

export function SummaryCard({
  title,
  value,
  trend,
  subtitle,
  direction,
  icon: Icon,
}: SummaryCardProps) {
  const TrendIcon = direction === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <article className="surface-card-strong relative overflow-hidden p-5 sm:p-6">
      <div className="absolute inset-x-6 top-0 h-24 rounded-full bg-[radial-gradient(circle,_rgba(11,94,215,0.16),_rgba(11,94,215,0))]" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-secondary">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
            {value}
          </p>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div
        className={cn(
          "relative mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
          direction === "up"
            ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
            : "bg-amber-500/12 text-amber-700 dark:text-amber-300",
        )}
      >
        <TrendIcon className="h-3.5 w-3.5" />
        {trend}
      </div>
    </article>
  );
}
