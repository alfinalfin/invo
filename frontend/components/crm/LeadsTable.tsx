"use client";

import React, { useState } from "react";
import { Building2, MapPin, Phone, Globe, Mail, ChevronDown, ChevronUp, Bot, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Lead {
  id: string;
  company: string;
  location: string;
  phone: string;
  website: string;
  email: string;
  leadScore: number;
  aiSummary: string;
  draftEmail: string;
}

interface LeadsTableProps {
  leads: Lead[];
  onClose: () => void;
}

export function LeadsTable({ leads, onClose }: LeadsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 50) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] w-full p-6 bg-white dark:bg-[#0c1322] rounded-3xl shadow-2xl border border-[var(--border)] overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-2">
             <Sparkles className="w-6 h-6 text-[var(--accent)]" /> Extracted Leads
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
             {leads.length} accounts processed and enriched via AI.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--border)] rounded-xl transition-all">
             Close
          </button>
          <button className="px-4 py-2 text-sm font-bold text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 shadow-lg shadow-[var(--accent)]/20 rounded-xl transition-all">
             Sync to CRM
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-primary)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-secondary)] sticky top-0 z-10 shadow-sm border-b border-[var(--border)]">
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-[25%]">Company</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-[20%]">Location</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-[25%]">Contact</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-[15%]">AI Score</th>
              <th className="p-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider w-[15%]">Details</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <React.Fragment key={lead.id}>
                <tr className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                         <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-[var(--text-primary)] truncate">{lead.company}</span>
                    </div>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] truncate">
                        <MapPin className="w-3.5 h-3.5" /> {lead.location}
                     </div>
                  </td>
                  <td className="p-4 space-y-1">
                     {lead.email && (
                       <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] truncate">
                         <Mail className="w-3.5 h-3.5" /> <a href={`mailto:${lead.email}`} className="hover:text-[var(--accent)] transition-colors">{lead.email}</a>
                       </div>
                     )}
                     {lead.phone && (
                       <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] truncate">
                         <Phone className="w-3.5 h-3.5" /> {lead.phone}
                       </div>
                     )}
                     {lead.website && (
                       <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] truncate">
                         <Globe className="w-3.5 h-3.5" /> <a href={lead.website} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)] transition-colors">Website</a>
                       </div>
                     )}
                  </td>
                  <td className="p-4">
                     <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${getScoreColor(lead.leadScore)}`}>
                        <Bot className="w-3.5 h-3.5" />
                        {lead.leadScore} / 100
                     </div>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors"
                    >
                       View AI Data {expandedId === lead.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
                <AnimatePresence>
                  {expandedId === lead.id && (
                    <motion.tr 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-[var(--bg-secondary)] overflow-hidden border-b border-[var(--border)]"
                    >
                      <td colSpan={5} className="p-0">
                         <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                 <Bot className="w-4 h-4 text-[var(--accent)]" /> AI Summary
                               </h4>
                               <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-primary)] border border-[var(--border)] p-4 rounded-xl">
                                 {lead.aiSummary}
                               </p>
                            </div>
                            <div className="space-y-2">
                               <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                 <Mail className="w-4 h-4 text-emerald-500" /> Drafted Outreach
                               </h4>
                               <div className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-primary)] border border-[var(--border)] p-4 rounded-xl whitespace-pre-line font-mono text-xs">
                                 {lead.draftEmail}
                               </div>
                            </div>
                         </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
