import { Filter } from "lucide-react";
import { type Dispatch, type SetStateAction } from "react";

import {
  dateRangeOptions,
  formatCurrency,
  leadSources,
  leadStatuses,
  sortOptions,
  type DateRangeOption,
  type LeadRecord,
  type LeadSource,
  type LeadStatus,
  type SortOption,
} from "@/lib/crm";

import { LeadsTable } from "./leads-table";

type LeadsSectionProps = {
  filteredCount: number;
  averageDealValue: number;
  statusFilter: LeadStatus | "All";
  setStatusFilter: Dispatch<SetStateAction<LeadStatus | "All">>;
  sourceFilter: LeadSource | "All";
  setSourceFilter: Dispatch<SetStateAction<LeadSource | "All">>;
  dateRange: DateRangeOption;
  setDateRange: Dispatch<SetStateAction<DateRangeOption>>;
  sortOption: SortOption;
  setSortOption: Dispatch<SetStateAction<SortOption>>;
  pagedLeads: LeadRecord[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLeadOpen: (lead: LeadRecord) => void;
  onExport: () => void;
};

export function LeadsSection({
  filteredCount,
  averageDealValue,
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
  dateRange,
  setDateRange,
  sortOption,
  setSortOption,
  pagedLeads,
  currentPage,
  totalPages,
  onPageChange,
  onLeadOpen,
  onExport,
}: LeadsSectionProps) {
  return (
    <div className="space-y-6">
      <section className="surface-card-strong p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="soft-pill">Lead management</p>
            <h1 className="section-heading mt-5">Work the full pipeline</h1>
            <p className="subtle-copy mt-4 max-w-2xl">
              Search, filter, sort, and action every inquiry from one clean
              operational table built for high-volume logistics teams.
            </p>
          </div>
          <div className="surface-card rounded-[28px] p-5 shadow-none">
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              Filtered records
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
              {filteredCount}
            </p>
            <p className="mt-2 text-sm text-muted">
              {formatCurrency(averageDealValue)} average converted value
            </p>
          </div>
        </div>
      </section>

      <section className="surface-card p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as LeadStatus | "All")
              }
              className="w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="All">All statuses</option>
              {leadStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Source
            </span>
            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value as LeadSource | "All")
              }
              className="w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
            >
              <option value="All">All sources</option>
              {leadSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Date range
            </span>
            <select
              value={dateRange}
              onChange={(event) =>
                setDateRange(event.target.value as DateRangeOption)
              }
              className="w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
            >
              {dateRangeOptions.map((range) => (
                <option key={range} value={range}>
                  Last {range.replace("d", "")} days
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
              Sort by
            </span>
            <select
              value={sortOption}
              onChange={(event) =>
                setSortOption(event.target.value as SortOption)
              }
              className="w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-[24px] bg-[var(--accent-soft)] p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-[var(--accent)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--accent)]">
                  Active filters
                </p>
                <p className="text-sm text-secondary">
                  {filteredCount} visible leads
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LeadsTable
        leads={pagedLeads}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onLeadOpen={onLeadOpen}
        onExport={onExport}
      />
    </div>
  );
}
