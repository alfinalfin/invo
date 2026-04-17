"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Database, BrainCircuit, Save, CheckCircle2, Loader2, X } from "lucide-react";

interface LivePipelineStatusProps {
  maxLeads: number;
  onCancel: () => void;
  onComplete: () => void;
}

const STAGES = [
  { id: "fetching", label: "Fetching Target Accounts", icon: Search },
  { id: "extracting", label: "Extracting Meta Information", icon: Database },
  { id: "enriching", label: "AI Target Enrichment & Scoring", icon: BrainCircuit },
  { id: "saving", label: "Ingesting into CRM", icon: Save },
];

export function LivePipelineStatus({ maxLeads, onCancel, onComplete }: LivePipelineStatusProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [processedLeads, setProcessedLeads] = useState(0);

  // Simulate progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let leadsInterval: NodeJS.Timeout;

    if (currentStage < STAGES.length) {
       interval = setInterval(() => {
         setCurrentStage(prev => {
            if (prev === STAGES.length - 1) {
              setTimeout(onComplete, 1000); // Trigger complete after last stage finishes
            }
            return prev + 1;
         });
       }, 3000); // 3s per stage
    }

    leadsInterval = setInterval(() => {
       setProcessedLeads(prev => {
         const next = prev + maxLeads / 40; // increment smoothly based on max leads
         if (next >= maxLeads) return maxLeads;
         return Math.floor(next);
       });
    }, 300);

    return () => {
      clearInterval(interval);
      clearInterval(leadsInterval);
    };
  }, [currentStage, maxLeads, onComplete]);

  const progressPercent = Math.min(((currentStage * 1000 + (processedLeads / maxLeads) * 3000) / (STAGES.length * 1000)) * 100, 100).toFixed(0); 
  // simplified overall progress visualization

  return (
    <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-12 px-6">
      <button 
         onClick={onCancel} 
         className="absolute right-0 top-0 p-3 rounded-full text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         className="text-center mb-10 w-full"
      >
        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-3">Pipeline Active</h2>
        <p className="text-[var(--text-secondary)] font-medium">Extracting and enriching data in real-time.</p>
      </motion.div>

      {/* Glass Panel */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.2 }}
         className="w-full bg-[var(--surface-primary)] border border-[var(--border)] rounded-[24px] p-8 shadow-2xl relative overflow-hidden"
       >
         {/* Glow Effect */}
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
         
         <div className="flex justify-between items-center mb-8 border-b border-[var(--border)] pb-4">
             <div className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">
               Processing Pipeline
             </div>
             <div className="font-mono text-sm bg-[var(--bg-secondary)] px-3 py-1 rounded-md font-semibold text-[var(--text-primary)]">
                {processedLeads} / {maxLeads} Leads
             </div>
         </div>

         <div className="space-y-6">
           {STAGES.map((stage, index) => {
             const Icon = stage.icon;
             const isPast = currentStage > index;
             const isActive = currentStage === index;
             const isPending = currentStage < index;

             return (
               <motion.div 
                 key={stage.id}
                 initial={{ x: -20, opacity: 0 }}
                 animate={{ x: 0, opacity: 1 }}
                 transition={{ delay: index * 0.1 }}
                 className={`flex items-center gap-4 transition-all duration-500 ${isPending ? 'opacity-40' : 'opacity-100'}`}
               >
                  <div className={`p-2 rounded-xl border flex-shrink-0 ${
                    isPast ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20 text-white' : 
                    isActive ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30' : 
                    'bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-tertiary)]'
                  }`}>
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                     <h4 className={`text-base font-bold transition-colors duration-300 ${isPast ? 'text-emerald-600 dark:text-emerald-400' : isActive ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
                       {stage.label}
                     </h4>
                     {isActive && (
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: "100%" }} 
                         transition={{ duration: 3, ease: "linear" }}
                         className="h-1 bg-[var(--accent)]/20 rounded-full mt-2 overflow-hidden"
                       >
                         <div className="h-full bg-[var(--accent)] w-full shadow-[0_0_10px_var(--accent)]"></div>
                       </motion.div>
                     )}
                  </div>
               </motion.div>
             );
           })}
         </div>

         {/* Overall Progress */}
         <div className="mt-10 pt-6 border-t border-[var(--border)]">
           <div className="flex justify-between items-center text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
             <span>Overall Progress</span>
             <span>{Number(progressPercent) > 100 ? 100 : progressPercent}%</span>
           </div>
           <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 relative"
               initial={{ width: 0 }}
               animate={{ width: `${Number(progressPercent) > 100 ? 100 : progressPercent}%` }}
               transition={{ ease: "linear", duration: 0.5 }}
             >
                <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/50 blur-[2px]"></div>
             </motion.div>
           </div>
         </div>
      </motion.div>
    </div>
  );
}
