import {
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MessageCircleMore,
  PhoneCall,
} from "lucide-react";

import type { LeadRecord } from "@/lib/crm";
import {
  formatCompactDate,
  formatCurrency,
  formatPhoneForWhatsApp,
} from "@/lib/crm";

import { PriorityBadge, StatusBadge } from "./status-badge";

type LeadsTableProps = {
  leads: LeadRecord[];
  onLeadOpen: (lead: LeadRecord) => void;
  compact?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onExport?: () => void;
  emptyStateTitle?: string;
  emptyStateCopy?: string;
};

export function LeadsTable({
  leads,
  onLeadOpen,
  compact = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onExport,
  emptyStateTitle = "No leads match this view",
  emptyStateCopy = "Try a broader search, switch the date range, or reconnect your Firestore data source.",
}: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="surface-card flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--accent-soft)] text-[var(--accent)]">
          <MessageCircleMore className="h-7 w-7" />
        </div>
        <h3 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">
          {emptyStateTitle}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-muted">
          {emptyStateCopy}
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      {!compact ? (
        <div className="flex flex-col gap-3 border-b border-[var(--border-color)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Leads inbox
            </p>
            <p className="mt-1 text-sm text-muted">
              Click a row to open the full lead drawer and update the record.
            </p>
          </div>
          {onExport ? (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left">
          <thead className="border-b border-[var(--border-color)] bg-black/[0.02] dark:bg-white/[0.02]">
            <tr className="text-xs uppercase tracking-[0.22em] text-muted">
              <th className="px-5 py-4 font-semibold">Name</th>
              <th className="px-5 py-4 font-semibold">Phone</th>
              <th className="px-5 py-4 font-semibold">Email</th>
              <th className="px-5 py-4 font-semibold">Pickup & Delivery</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Created</th>
              {!compact ? <th className="px-5 py-4 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="cursor-pointer border-b border-[var(--border-color)] transition hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                onClick={() => onLeadOpen(lead)}
              >
                <td className="px-5 py-4">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {lead.name}
                    </p>
                    <p className="mt-1 text-sm text-muted">{lead.company}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-secondary">{lead.phone}</td>
                <td className="px-5 py-4 text-sm text-secondary">{lead.email}</td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {lead.routeLabel}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {lead.pickupAddress} to {lead.deliveryAddress}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-2">
                    <StatusBadge status={lead.status} />
                    <PriorityBadge priority={lead.priority} />
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {formatCompactDate(lead.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatCurrency(lead.estimatedValue)}
                  </p>
                </td>
                {!compact ? (
                  <td className="px-5 py-4">
                    <div
                      className="flex items-center gap-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <a
                        href={`tel:${formatPhoneForWhatsApp(lead.phone)}`}
                        className="rounded-2xl border border-[var(--border-color)] p-2 text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)]"
                        aria-label={`Call ${lead.name}`}
                      >
                        <PhoneCall className="h-4 w-4" />
                      </a>
                      <a
                        href={`https://wa.me/${formatPhoneForWhatsApp(lead.phone)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-[var(--border-color)] p-2 text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)]"
                        aria-label={`Open WhatsApp for ${lead.name}`}
                      >
                        <MessageCircleMore className="h-4 w-4" />
                      </a>
                      <a
                        href={`mailto:${lead.email}`}
                        className="rounded-2xl border border-[var(--border-color)] p-2 text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)]"
                        aria-label={`Email ${lead.name}`}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 p-4 md:hidden">
        {leads.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() => onLeadOpen(lead)}
            className="surface-card w-full rounded-[24px] p-4 text-left shadow-none"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-[var(--text-primary)]">
                  {lead.name}
                </p>
                <p className="mt-1 text-sm text-muted">{lead.company}</p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <p className="mt-4 text-sm text-secondary">{lead.routeLabel}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={lead.priority} />
              {lead.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="muted-pill">
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {!compact && totalPages > 1 && onPageChange ? (
        <div className="flex items-center justify-between border-t border-[var(--border-color)] px-5 py-4">
          <p className="text-sm text-muted">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border-color)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
