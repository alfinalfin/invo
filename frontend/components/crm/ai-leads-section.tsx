"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bot,
  Mail,
  Phone,
  Filter,
  Search,
  Sparkles,
  MapPin,
  BadgeCheck,
  X,
  Info,
  Globe,
} from "lucide-react";

interface TimelineEvent {
  title: string;
  desc: string;
  type: "active" | "planned" | "past";
}

interface Lead {
  id: string;
  company: string;
  initials: string;
  type: string;
  location: string;
  aiScore: number;
  matchRate: number;
  status: "Hot" | "Warm" | "Cold" | "Follow-up";
  label: string;
  lastContacted: string;
  needsAction?: boolean;
  website?: string;
  reasoning?: string[];
  timeline?: TimelineEvent[];
}

const initialLeads: Lead[] = [
  {
    id: "1",
    company: "Global Freight Ltd",
    initials: "GF",
    type: "Retail Logistics",
    location: "London, UK",
    aiScore: 9.2,
    matchRate: 98,
    status: "Hot",
    label: "Replied",
    lastContacted: "2 hours ago",
    website: "www.globalfreight.io",
    reasoning: [
      "Recent LinkedIn post mentions expansion into South American markets. High demand for ocean freight partners.",
      "Website traffic increased by 40% in shipping/logistics pages this month.",
    ],
    timeline: [
      { title: "Replied to Initial Pitch", desc: "2 hours ago • Marcus (Logistics Mgr)", type: "active" },
      { title: "Follow-up Call Scheduled", desc: "Tomorrow @ 10:00 AM", type: "planned" },
      { title: "First Contact (Email)", desc: "Oct 12, 2023 • AI Generated", type: "past" },
    ],
  },
  { id: "2", company: "Atlas Maritime", initials: "AM", type: "Ocean Freight", location: "Hamburg, DE", aiScore: 7.8, matchRate: 75, status: "Warm", label: "Contacted", lastContacted: "1 day ago" },
  { id: "3", company: "Nova Ventures", initials: "NV", type: "Tech Hardware", location: "San Francisco, US", aiScore: 9.5, matchRate: 92, status: "Hot", label: "New", lastContacted: "Just now", needsAction: true },
];

export function AiLeadsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [activeFilter, setActiveFilter] = useState<"All" | "Hot Leads" | "Follow-up">("All");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState("");

  const filteredLeads = useMemo(() => {
    if (activeFilter === "Hot Leads") return initialLeads.filter((l) => l.status === "Hot");
    if (activeFilter === "Follow-up") return initialLeads.filter((l) => l.status === "Follow-up" || l.status === "Warm");
    return initialLeads;
  }, [activeFilter]);

  const selectedLead = useMemo(() => {
    return initialLeads.find((l) => l.id === selectedLeadId) || null;
  }, [selectedLeadId]);

  const handleGenerateOutreach = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(id);
    setTimeout(() => {
      setIsGenerating(null);
      setToastMessage("AI Email Draft Generated! ✨");
      setTimeout(() => setToastMessage(""), 3000);
    }, 1500);
  };

  return (
    <div className="animate-in fade-in duration-500 min-h-full pb-8 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-1">AI Leads Engine</h1>
          <p className="text-on-surface-variant font-medium">AI-powered freight forwarder lead management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-surface-container-high px-4 py-2 rounded-xl shadow-sm mr-2">
            <span className="text-sm font-semibold text-on-surface-variant">Auto AI Analysis</span>
            <div className="w-10 h-5 bg-primary/20 rounded-full relative flex items-center px-1 cursor-pointer">
              <div className="w-3.5 h-3.5 bg-primary rounded-full absolute right-1 shadow-sm"></div>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-surface-container-high text-primary font-bold rounded-xl hover:bg-surface-container-highest transition-colors">
            Import Leads
          </button>
          <button className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/15 hover:opacity-90 transition-opacity">
            + Add Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm">
          <p className="text-sm font-semibold text-on-surface-variant mb-2">Total Leads</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-black tracking-tight">1,284</span>
            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full mb-1">+12%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm">
          <p className="text-sm font-semibold text-on-surface-variant mb-2">Hot Leads 🔥</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-black tracking-tight text-error">42</span>
            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full mb-1">+8%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm">
          <p className="text-sm font-semibold text-on-surface-variant mb-2">Contacted 📩</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-black tracking-tight">856</span>
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full mb-1">+5%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest dark:bg-surface-container p-6 rounded-xl shadow-sm border-l-4 border-primary">
          <p className="text-sm font-semibold text-on-surface-variant mb-2">Conversion Rate 📊</p>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-black tracking-tight">18.4%</span>
            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full mb-1">+2.4%</span>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl">
            <button
              onClick={() => setActiveFilter("All")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeFilter === "All" ? "bg-white dark:bg-surface shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              All Leads
            </button>
            <button
              onClick={() => setActiveFilter("Hot Leads")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeFilter === "Hot Leads" ? "bg-white dark:bg-surface shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Hot Leads 🔥
            </button>
            <button
              onClick={() => setActiveFilter("Follow-up")}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeFilter === "Follow-up" ? "bg-white dark:bg-surface shadow-sm text-primary" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              Follow-Up Needed ⏳
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-surface-container-low rounded-lg px-3 py-2 gap-2 border border-outline-variant/10">
              <MapPin className="w-4 h-4 text-outline" />
              <select className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-on-surface outline-none">
                <option>Location</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>USA</option>
              </select>
            </div>
            <div className="flex items-center bg-surface-container-low rounded-lg px-3 py-2 gap-2 border border-outline-variant/10">
              <BadgeCheck className="w-4 h-4 text-outline" />
              <select className="bg-transparent border-none p-0 text-xs font-bold focus:ring-0 text-on-surface outline-none">
                <option>Score Range</option>
                <option>90%+</option>
                <option>75%+</option>
              </select>
            </div>
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams?.toString() ?? "");
                params.set("scrape", "true");
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 px-4 py-3 bg-surface-container border-b-0 rounded-lg text-xs font-black uppercase tracking-widest text-outline">
        <div className="col-span-3">Company Name</div>
        <div className="col-span-2">Location</div>
        <div className="col-span-2 lg:col-span-1">Score</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1 lg:col-span-2">Last Contacted</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className="divide-y divide-transparent">
        {filteredLeads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => setSelectedLeadId(lead.id)}
            className={`grid grid-cols-12 px-4 py-5 items-center transition-colors mt-2 rounded-lg cursor-pointer group ${selectedLeadId === lead.id ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-surface-container-low"}`}
          >
            <div className="col-span-3 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-black ${selectedLeadId === lead.id ? "bg-surface-container-highest text-primary" : "bg-surface-container-highest text-secondary"}`}
              >
                {lead.initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-on-surface line-clamp-1">{lead.company}</p>
                  {lead.needsAction && (
                    <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                      Action
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-outline truncate">{lead.type}</p>
              </div>
            </div>

            <div className="col-span-2 text-sm font-medium truncate pr-2">{lead.location}</div>

            <div className="col-span-2 lg:col-span-1">
              <span
                className={`px-2 py-1 rounded-full text-[10px] font-black ${
                  lead.aiScore >= 9 ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" : lead.aiScore >= 7 ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" : "bg-blue-100 text-blue-700"
                }`}
              >
                {lead.aiScore} {lead.status === "Hot" ? "HOT" : lead.status === "Warm" ? "MED" : ""}
              </span>
            </div>

            <div className="col-span-2">
              <span
                className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                  lead.label === "Replied"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                    : lead.label === "Contacted"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
                    : lead.label === "New"
                    ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    : ""
                }`}
              >
                {lead.label}
              </span>
            </div>

            <div className="col-span-1 lg:col-span-2 text-sm text-outline truncate">{lead.lastContacted}</div>

            <div className={`col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${selectedLeadId === lead.id ? "opacity-100" : ""}`}>
              <button onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-white dark:hover:bg-surface-container rounded-lg transition-colors">
                <Phone className="w-4 h-4 text-secondary hover:text-primary" />
              </button>
              <button onClick={(e) => e.stopPropagation()} className="p-2 hover:bg-white dark:hover:bg-surface-container rounded-lg transition-colors">
                <Mail className="w-4 h-4 text-secondary hover:text-primary" />
              </button>
              <button
                onClick={(e) => handleGenerateOutreach(lead.id, e)}
                className="p-2 hover:bg-white dark:hover:bg-surface-container rounded-lg transition-colors relative group/draft"
              >
                <Sparkles className={`w-4 h-4 text-primary ${isGenerating === lead.id ? "animate-spin" : ""}`} />
                <div className="absolute right-0 top-full mt-1 hidden group-hover/draft:block bg-surface-container-high text-xs tracking-wider font-bold py-1 px-2 rounded w-max text-on-surface-variant">
                  Draft Email
                </div>
              </button>
            </div>
          </div>
        ))}
        {filteredLeads.length === 0 && (
          <div className="py-12 text-center text-outline font-medium">No AI leads found matching the criteria.</div>
        )}
      </div>

      <div
        className={`fixed right-0 top-16 w-full sm:w-[400px] bg-surface-container-low dark:bg-surface-container border-l border-outline-variant/10 p-6 overflow-y-auto h-[calc(100vh-64px)] z-40 shadow-2xl transition-transform duration-300 ${
          selectedLead ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedLead && (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-outline" />
                <h3 className="font-black text-lg tracking-tight uppercase">Lead Intelligence</h3>
              </div>
              <button
                onClick={() => setSelectedLeadId(null)}
                className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="bg-white dark:bg-surface-container-lowest p-5 rounded-2xl shadow-sm mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-2xl text-primary flex-shrink-0">
                  {selectedLead.initials}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xl font-black truncate">{selectedLead.company}</h4>
                  {selectedLead.website && (
                    <p className="text-sm text-outline font-medium flex items-center gap-1 mt-1 truncate">
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                      {selectedLead.website}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low dark:bg-surface-container p-3 rounded-xl">
                  <p className="text-[10px] font-black text-outline uppercase mb-1">AI Score</p>
                  <p className="text-xl font-black text-error">{selectedLead.aiScore} / 10</p>
                </div>
                <div className="bg-surface-container-low dark:bg-surface-container p-3 rounded-xl">
                  <p className="text-[10px] font-black text-outline uppercase mb-1">Match Rate</p>
                  <p className="text-xl font-black text-primary">{selectedLead.matchRate}%</p>
                </div>
              </div>
            </div>

            {selectedLead.reasoning && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-4 h-4 text-primary" />
                  <h5 className="text-xs font-black uppercase text-outline tracking-widest">AI Analysis Reasoning</h5>
                </div>
                <div className="space-y-3">
                  {selectedLead.reasoning.map((reason, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={`w-1 min-h-[40px] rounded-full ${i === 0 ? "bg-green-400" : "bg-blue-400"}`}></div>
                      <p className="text-sm font-medium leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary w-4 h-4" />
                  <h5 className="text-xs font-black uppercase text-outline tracking-widest">Smart Email Suggestion</h5>
                </div>
                <button className="text-[10px] font-bold text-primary px-2 py-1 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                  Regenerate
                </button>
              </div>
              <div className="bg-white dark:bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 relative">
                <p className="text-xs font-bold text-on-surface mb-2">Subject: Re: Seamless South American Logistics Expansion</p>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  "Hi Marcus, I noticed Global Freight's recent announcement about Brazil operations. InvoAura's AI-routed sea freight can reduce your South Am transit times by 12%..."
                </p>
                <button className="w-full py-2 bg-primary text-on-primary text-xs font-bold rounded-lg shadow-md hover:bg-primary/90 transition-colors">
                  Use Template & Send
                </button>
              </div>
            </div>

            {selectedLead.timeline && (
              <div>
                <h5 className="text-xs font-black uppercase text-outline tracking-widest mb-4">Journey Timeline</h5>
                <div className="space-y-6 relative ml-2">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-outline-variant/30"></div>

                  {selectedLead.timeline.map((event, i) => (
                    <div key={i} className="relative pl-6">
                      <div
                        className={`absolute left-0 top-1 w-4 h-4 rounded-full ${
                          event.type === "active"
                            ? "bg-primary ring-4 ring-primary/10"
                            : event.type === "planned"
                            ? "bg-white dark:bg-surface-container border-2 border-primary"
                            : "bg-outline-variant"
                        }`}
                      ></div>
                      <p className={`text-xs font-black ${event.type === "active" ? "text-on-surface" : "text-on-surface-variant"}`}>
                        {event.title}
                      </p>
                      <p className="text-[10px] text-outline font-medium mt-0.5">{event.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-50">
        <Sparkles className="w-6 h-6 fill-white" />
      </button>

      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all z-50 flex items-center gap-2"
          style={{ animation: "fade-up 0.3s ease-out" }}
        >
          <Sparkles className="w-4 h-4" />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
