"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Mail,
  MapPin,
  MessageSquareText,
  PhoneCall,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import {
  formatCurrency,
  formatDate,
  formatPhoneForWhatsApp,
  leadStatuses,
  type LeadRecord,
  type LeadStatus,
} from "../../lib/crm";

import { PriorityBadge, StatusBadge } from "./status-badge";

type LeadDetailSheetProps = {
  lead: LeadRecord | null;
  open: boolean;
  onClose: () => void;
  onSave: (
    leadId: string,
    patch: {
      status: LeadStatus;
      notes: string;
      lastContactedAt?: string;
      estimatedValue?: number;
      podDeliveryDate?: string;
      podDriverName?: string;
      podVehicleReg?: string;
      podPieces?: string;
      podWeight?: string;
      podDimensions?: string;
      podGoodsDescription?: string;
      podNotes?: string;
      podGoodsItems?: string;
    },
  ) => Promise<void> | void;
};

export function LeadDetailSheet({
  lead,
  open,
  onClose,
  onSave,
}: LeadDetailSheetProps) {
  const [draftStatus, setDraftStatus] = useState<LeadStatus>("New");
  const [draftNotes, setDraftNotes] = useState("");
  const [podDraft, setPodDraft] = useState({
    podDeliveryDate: "",
    podDriverName: "",
    podVehicleReg: "",
    podPieces: "",
    podWeight: "",
    podDimensions: "",
    podGoodsDescription: "",
    podNotes: "",
  });
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!lead) {
      return;
    }

    setDraftStatus(lead.status);
    setDraftNotes(lead.notes);
    setPodDraft({
      podDeliveryDate: lead.podDeliveryDate || "",
      podDriverName: lead.podDriverName || "",
      podVehicleReg: lead.podVehicleReg || "",
      podPieces: lead.podPieces || "",
      podWeight: lead.podWeight || "",
      podDimensions: lead.podDimensions || "",
      podGoodsDescription: lead.podGoodsDescription || "",
      podNotes: lead.podNotes || "",
    });
  }, [lead]);

  const handleSave = (nextStatus = draftStatus, finalValue?: number) => {
    if (!lead) {
      return;
    }

    startTransition(() => {
      void onSave(lead.id, {
        status: nextStatus,
        notes: draftNotes,
        lastContactedAt:
          nextStatus === "Contacted" || nextStatus === "Converted"
            ? new Date().toISOString()
            : lead.lastContactedAt,
        ...(finalValue !== undefined ? { estimatedValue: finalValue } : {}),
        ...podDraft,
      });
    });
  };

  return (
    <>
    <AnimatePresence>
      {open && lead ? (
        <>
          <motion.button
            type="button"
            aria-label="Close lead detail"
            className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-3 top-3 z-50 flex h-[calc(100vh-1.5rem)] w-[min(560px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[32px] border border-[var(--border-color)] bg-[var(--surface-secondary)] shadow-[var(--shadow-strong)]"
          >
            <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[var(--border-color)] p-6">
              <div>
                <p className="soft-pill">Lead detail</p>
                <h2 className="mt-4 text-2xl font-semibold text-[var(--text-primary)]">
                  {lead.name}
                </h2>
                <p className="mt-2 text-sm text-muted">
                  {lead.company} • {lead.id}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-[var(--border-color)] p-3 text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6">
                <div className="surface-card rounded-[28px] p-5 shadow-none">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={draftStatus} />
                    <PriorityBadge priority={lead.priority} />
                    {lead.tags.map((tag) => (
                      <span key={tag} className="muted-pill">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">
                        Estimated value
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                        {formatCurrency(lead.estimatedValue)}
                      </p>
                    </div>
                    <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">
                        Assigned to
                      </p>
                      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">
                        {lead.assignedTo}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <a
                    href={`tel:${formatPhoneForWhatsApp(lead.phone)}`}
                    className="surface-card flex items-center gap-3 rounded-[24px] p-4 shadow-none"
                  >
                    <PhoneCall className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Call lead
                      </p>
                      <p className="text-sm text-muted">{lead.phone}</p>
                    </div>
                  </a>
                  <a
                    href={`mailto:${lead.email}`}
                    className="surface-card flex items-center gap-3 rounded-[24px] p-4 shadow-none"
                  >
                    <Mail className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Email lead
                      </p>
                      <p className="text-sm text-muted">{lead.email}</p>
                    </div>
                  </a>
                </div>

                <div className="surface-card rounded-[28px] p-5 shadow-none">
                  <div className="flex items-center gap-3">
                    <UserRound className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Contact details
                      </p>
                      <p className="text-sm text-muted">
                        Created {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">
                        Contact
                      </p>
                      <p className="mt-2 text-sm leading-7 text-secondary">
                        {lead.name} • {lead.email} • {lead.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">
                        Route
                      </p>
                      <p className="mt-2 text-sm leading-7 text-secondary">
                        {lead.routeLabel}
                      </p>
                    </div>
                    {lead.lastContactedAt ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-muted">
                          Last contacted
                        </p>
                        <p className="mt-2 text-sm leading-7 text-secondary">
                          {formatDate(lead.lastContactedAt)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="surface-card rounded-[28px] p-5 shadow-none">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Shipment details
                      </p>
                      <p className="text-sm text-muted">
                        Route and load requirements
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4">
                    <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">
                        Pickup
                      </p>
                      <p className="mt-2 text-sm leading-7 text-secondary">
                        {lead.pickupAddress}
                      </p>
                      {lead.collectionTime ? (
                        <p className="mt-1 text-xs text-muted">
                          Collection: {lead.collectionTime}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">
                        Delivery
                      </p>
                      <p className="mt-2 text-sm leading-7 text-secondary">
                        {lead.deliveryAddress}
                      </p>
                    </div>
                    {(lead.goodsDescription || lead.weightDimensions || lead.vehicleType) && (
                      <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted">
                          Load Details
                        </p>
                        <div className="mt-2 space-y-1">
                          {lead.goodsDescription && (
                            <p className="text-sm leading-7 text-secondary">
                              <span className="text-muted">Goods:</span> {lead.goodsDescription}
                            </p>
                          )}
                          {lead.weightDimensions && (
                            <p className="text-sm leading-7 text-secondary">
                              <span className="text-muted">Size:</span> {lead.weightDimensions}
                            </p>
                          )}
                          {lead.vehicleType && (
                            <p className="text-sm leading-7 text-secondary">
                              <span className="text-muted">Vehicle:</span> {lead.vehicleType}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="surface-card rounded-[28px] p-5 shadow-none">
                  <div className="flex items-center gap-3">
                    <MessageSquareText className="h-5 w-5 text-[var(--accent)]" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        Request and notes
                      </p>
                      <p className="text-sm text-muted">
                        Turn raw inquiry detail into an actionable next step
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-5">
                    <div className="rounded-[24px] bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted">
                        Customer request
                      </p>
                      <p className="mt-2 text-sm leading-7 text-secondary">
                        {lead.message}
                      </p>
                      {lead.customerNotes && (
                        <div className="mt-3 border-t border-[var(--border-color)] pt-3">
                          <p className="text-xs uppercase tracking-[0.24em] text-muted">
                            Client Notes
                          </p>
                          <p className="mt-1 text-sm leading-7 text-secondary">
                            {lead.customerNotes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="lead-status"
                        className="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                      >
                        Update status
                      </label>
                      <select
                        id="lead-status"
                        value={draftStatus}
                        onChange={(event) =>
                          setDraftStatus(event.target.value as LeadStatus)
                        }
                        className="mt-2 w-full rounded-[20px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
                      >
                        {leadStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="lead-notes"
                        className="text-xs font-semibold uppercase tracking-[0.24em] text-muted"
                      >
                        Internal notes
                      </label>
                      <textarea
                        id="lead-notes"
                        rows={6}
                        value={draftNotes}
                        onChange={(event) => setDraftNotes(event.target.value)}
                        className="mt-2 w-full rounded-[24px] border border-[var(--border-color)] bg-transparent px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDraftStatus("Contacted");
                      handleSave("Contacted");
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Mark contacted
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteAmount(lead?.estimatedValue?.toString() || "");
                      setIsConversionModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    Convert lead
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isPending}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
    <AnimatePresence>
      {isConversionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close modal"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsConversionModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm rounded-[32px] border border-[var(--border-color)] bg-[var(--surface-secondary)] p-6 shadow-[var(--shadow-strong)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                Convert Lead
              </h3>
              <button
                type="button"
                className="rounded-full p-2 text-muted hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => setIsConversionModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-6 text-sm text-secondary">
              Enter the final quote amount to convert this lead.
            </p>

            <div className="mb-8 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                Quote Amount (£)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                  £
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={quoteAmount}
                  onChange={(e) => setQuoteAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const amount = parseFloat(quoteAmount);
                      if (isNaN(amount) || amount < 0) {
                        window.alert("Please enter a valid quote amount.");
                        return;
                      }
                      setDraftStatus("Converted");
                      handleSave("Converted", amount);
                      setIsConversionModalOpen(false);
                    }
                  }}
                  className="w-full rounded-[24px] border border-[var(--border-color)] bg-transparent py-3 pl-8 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full rounded-[24px] bg-[var(--accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                onClick={() => {
                  const amount = parseFloat(quoteAmount);
                  if (isNaN(amount) || amount < 0) {
                    window.alert("Please enter a valid quote amount.");
                    return;
                  }
                  setDraftStatus("Converted");
                  handleSave("Converted", amount);
                  setIsConversionModalOpen(false);
                }}
              >
                Submit & Convert
              </button>
              <button
                type="button"
                className="w-full rounded-[24px] border border-[var(--border-color)] py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => setIsConversionModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
