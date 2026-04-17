"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  MapPin,
  Phone,
  Truck,
} from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { industryOptions, placeSuggestions, vehicles } from "@/data/site-content";

type FieldName = "pickup" | "delivery";

const postcodePattern = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;

function normalisePostcode(value: string) {
  return value.toUpperCase().replace(/\s+/g, " ").trim();
}

function isValidPostcode(value: string) {
  return postcodePattern.test(normalisePostcode(value));
}

function isValidPhone(value: string) {
  return value.replace(/\D/g, "").length >= 10;
}

export function MultiStepQuoteForm() {
  const [form, setForm] = useState({
    pickup: "",
    delivery: "",
    vehicle: "",
    urgency: "",
    name: "",
    company: "",
    industry: "",
    phone: "",
  });
  const [activeField, setActiveField] = useState<FieldName | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const routeReady =
    isValidPostcode(form.pickup) &&
    isValidPostcode(form.delivery) &&
    normalisePostcode(form.pickup) !== normalisePostcode(form.delivery);
  const vehicleReady = Boolean(form.vehicle);
  const urgencyReady = Boolean(form.urgency);
  const contactReady =
    form.name.trim().length > 1 &&
    form.company.trim().length > 1 &&
    form.industry &&
    isValidPhone(form.phone);

  const progress = contactReady
    ? 100
    : urgencyReady
      ? 78
      : vehicleReady
        ? 56
        : routeReady
          ? 32
          : 12;

  const activeSuggestions = activeField
    ? placeSuggestions
        .filter((place) => {
          const query = form[activeField].trim().toLowerCase();

          if (!query) {
            return true;
          }

          return (
            place.label.toLowerCase().includes(query) ||
            place.postcode.toLowerCase().includes(query)
          );
        })
        .slice(0, 5)
    : [];

  function updateField(name: keyof typeof form, value: string) {
    setSubmitted(false);
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function selectSuggestion(field: FieldName, postcode: string) {
    updateField(field, postcode);
    setActiveField(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contactReady) {
      return;
    }

    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="panel-glass relative overflow-hidden p-5 sm:p-6" noValidate>
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cobalt/70 to-transparent" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
            Premium Quote Flow
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Plan your route in four guided steps.
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          {progress}% live
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cobalt via-cobalt to-signalOrange"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="mt-6 space-y-4">
        <section className="rounded-[1.4rem] border border-white/[0.08] bg-black/20 p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cobalt">
                Step 01
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">Route</h3>
            </div>
            {routeReady ? (
              <CheckCircle2 className="h-5 w-5 text-cobalt" />
            ) : (
              <MapPin className="h-5 w-5 text-slate-500" />
            )}
          </div>

          <div className="grid gap-3">
            {(["pickup", "delivery"] as FieldName[]).map((field) => {
              const label = field === "pickup" ? "Pickup postcode" : "Delivery postcode";

              return (
                <div key={field} className="relative">
                  <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-slate-400">
                    {label}
                  </label>
                  <input
                    value={form[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                    onFocus={() => setActiveField(field)}
                    onBlur={() => {
                      window.setTimeout(() => setActiveField(null), 120);
                      updateField(field, normalisePostcode(form[field]));
                    }}
                    placeholder={field === "pickup" ? "EC1A 1BB" : "M1 1AE"}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cobalt/50 focus:bg-white/[0.07]"
                  />

                  <AnimatePresence>
                    {activeField === field ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#090b11] shadow-aura"
                      >
                        {activeSuggestions.map((suggestion) => (
                          <button
                            key={`${field}-${suggestion.postcode}`}
                            type="button"
                            className="flex w-full items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 text-left text-sm text-slate-200 transition last:border-b-0 hover:bg-white/[0.06]"
                            onMouseDown={(event) => {
                              event.preventDefault();
                              selectSuggestion(field, suggestion.postcode);
                            }}
                          >
                            <span>{suggestion.label}</span>
                            <span className="text-xs uppercase tracking-[0.22em] text-cobalt">
                              {suggestion.postcode}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-6 text-slate-400">
            Autocomplete is wired for a Google Places style experience and is
            ready for live API suggestions once keys are added.
          </p>
        </section>

        <AnimatePresence initial={false}>
          {routeReady ? (
            <motion.section
              key="vehicle-step"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-[1.4rem] border border-white/[0.08] bg-black/20 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cobalt">
                    Step 02
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    Vehicle
                  </h3>
                </div>
                {vehicleReady ? (
                  <CheckCircle2 className="h-5 w-5 text-cobalt" />
                ) : (
                  <Truck className="h-5 w-5 text-slate-500" />
                )}
              </div>

              <div className="flex snap-x gap-3 overflow-x-auto pb-1">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => updateField("vehicle", vehicle.id)}
                    className={`min-w-[220px] snap-start rounded-[1.35rem] border p-4 text-left transition ${
                      form.vehicle === vehicle.id
                        ? "border-cobalt/50 bg-cobalt/[0.12] shadow-aura"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {vehicle.name}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-signalOrange">
                          {vehicle.payload}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-cobalt">
                        <Truck className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {vehicle.description}
                    </p>
                  </button>
                ))}
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {vehicleReady ? (
            <motion.section
              key="urgency-step"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-[1.4rem] border border-white/[0.08] bg-black/20 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cobalt">
                    Step 03
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    Sensitivity
                  </h3>
                </div>
                {urgencyReady ? (
                  <CheckCircle2 className="h-5 w-5 text-signalOrange" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-500" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-[1.4rem] border border-white/10 bg-white/5 p-2">
                {[
                  { id: "same-day", label: "SAME DAY", tone: "signalOrange" },
                  { id: "next-day", label: "NEXT DAY", tone: "cobalt" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateField("urgency", option.id)}
                    className={`rounded-[1.1rem] px-4 py-4 text-sm font-semibold uppercase tracking-[0.28em] transition ${
                      form.urgency === option.id
                        ? option.tone === "signalOrange"
                          ? "bg-signalOrange text-white"
                          : "bg-cobalt text-white"
                        : "bg-transparent text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    [{` ${option.label} `}]
                  </button>
                ))}
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {urgencyReady ? (
            <motion.section
              key="contact-step"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-[1.4rem] border border-white/[0.08] bg-black/20 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-cobalt">
                    Step 04
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-white">
                    Contact
                  </h3>
                </div>
                <Phone className="h-5 w-5 text-slate-400" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="Name"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cobalt/50 focus:bg-white/[0.07]"
                />
                <input
                  value={form.company}
                  onChange={(event) => updateField("company", event.target.value)}
                  placeholder="Company"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cobalt/50 focus:bg-white/[0.07]"
                />
                <select
                  value={form.industry}
                  onChange={(event) => updateField("industry", event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cobalt/50 focus:bg-white/[0.07]"
                >
                  <option value="" className="bg-[#090b11] text-slate-400">
                    Select industry
                  </option>
                  {industryOptions.map((industry) => (
                    <option key={industry} value={industry} className="bg-[#090b11] text-white">
                      {industry}
                    </option>
                  ))}
                </select>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="Phone"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cobalt/50 focus:bg-white/[0.07]"
                />
              </div>

              <button
                type="submit"
                disabled={!contactReady}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold uppercase tracking-[0.26em] transition ${
                  contactReady
                    ? "bg-signalOrange text-white hover:bg-[#ff5f24]"
                    : "cursor-not-allowed bg-white/[0.08] text-slate-500"
                }`}
              >
                Request premium quote
                <ChevronRight className="h-4 w-4" />
              </button>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="panel-glass-ember mt-5 p-4"
            role="status"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-signalOrange" />
              <div>
                <p className="font-semibold text-white">Route staged successfully.</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  We have enough detail to prepare the next step of the quote
                  flow for {form.company}. Connect this form to your CRM or
                  email handler to turn the staged submission into a live lead.
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
