import type { LeadPriority, LeadStatus } from "@/lib/crm";
import { cn } from "@/lib/utils";

const statusStyles: Record<LeadStatus, string> = {
  New: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  Contacted: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  "In progress": "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  Pending: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  Converted: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  Closed: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

const priorityStyles: Record<LeadPriority, string> = {
  Urgent: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  "High priority": "bg-orange-500/12 text-orange-700 dark:text-orange-300",
  Warm: "bg-blue-500/12 text-blue-700 dark:text-blue-300",
  "Follow-up": "bg-slate-500/12 text-slate-700 dark:text-slate-300",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current/70" />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        priorityStyles[priority],
      )}
    >
      {priority}
    </span>
  );
}
