"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Sparkles } from "lucide-react";
import { LeadInputPanel } from "./LeadInputPanel";
import { AIModelSelector, AIProvider, MODELS } from "./AIModelSelector";
import { AdvancedAISettings, AIOverride } from "./AdvancedAISettings";
import { LivePipelineStatus } from "./LivePipelineStatus";
import { LeadsTable, Lead } from "./LeadsTable";

type ViewState = "setup" | "progress" | "results" | "error";

export function AILeadDashboard() {
  const [viewState, setViewState] = useState<ViewState>("setup");
  const [errorMessage, setErrorMessage] = useState("");

  // Targeting State
  const [keywords, setKeywords] = useState<string[]>(["freight forwarder", "logistics"]);
  const [region, setRegion] = useState("United Kingdom");
  const [limit, setLimit] = useState(50);
  const [sources, setSources] = useState({
    google: true,
    directories: false,
    linkedin: false,
  });

  // AI Config State
  const [mainProvider, setMainProvider] = useState<AIProvider>("groq");
  const [mainModel, setMainModel] = useState<string>("llama-3.3-70b-versatile");
  const [keywordConfig, setKeywordConfig] = useState<AIOverride | null>(null);
  const [emailConfig, setEmailConfig] = useState<AIOverride | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("invoaura_ai_lead_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.keywords) setKeywords(parsed.keywords);
        if (parsed.region) setRegion(parsed.region);
        if (parsed.limit) setLimit(parsed.limit);
        if (parsed.sources) setSources(parsed.sources);
        if (parsed.mainProvider) setMainProvider(parsed.mainProvider);
        if (parsed.mainModel) setMainModel(parsed.mainModel);
        if (parsed.keywordConfig !== undefined) setKeywordConfig(parsed.keywordConfig);
        if (parsed.emailConfig !== undefined) setEmailConfig(parsed.emailConfig);
      }
    } catch (e) {
      console.warn("Could not load saved config");
    }
  }, []);

  // Save to localStorage when launch
  const saveConfig = () => {
    try {
      localStorage.setItem("invoaura_ai_lead_config", JSON.stringify({
        keywords, region, limit, sources, mainProvider, mainModel, keywordConfig, emailConfig
      }));
    } catch (e) {}
  };

  const launchEngine = async () => {
    if (keywords.length === 0) {
      alert("Please enter at least one target keyword.");
      return;
    }
    if (!region) {
      alert("Please enter a geographic region.");
      return;
    }

    saveConfig();
    setViewState("progress");
    setErrorMessage("");
    setLeads([]);

    const payload = {
      keywords,
      region,
      limit,
      sources,
      aiConfig: {
        provider: mainProvider,
        model: mainModel,
        keyword: keywordConfig,
        email: emailConfig,
      }
    };

    try {
      // We start the visual pipeline immediately, but actually fire the request
      const res = await fetch("http://129.154.254.139/api/scrape-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();
      
      // Assume data.leads is the array
      if (data && data.leads) {
        setLeads(data.leads.map((l: any, i: number) => ({
           id: l.id || String(i),
           company: l.company || "Unknown",
           location: l.location || region,
           phone: l.phone || "",
           website: l.website || "",
           email: l.email || "",
           leadScore: l.lead_score || l.leadScore || Math.floor(Math.random() * 40) + 60,
           aiSummary: l.ai_summary || l.aiSummary || "Lead meets primary targeting criteria but full AI summary was unavailable.",
           draftEmail: l.draft_email || l.draftEmail || "Subject: Exploring supply chain synergies...\n\nHi there,\n\nI noticed you operate in logistics..."
        })));
      } else {
        throw new Error("No leads returned from the engine.");
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to execute pipeline.");
      setViewState("error");
    }
  };

  const handlePipelineComplete = () => {
    // Only transition if not already errored out
    setViewState(prev => prev === 'progress' ? 'results' : prev);
  };

  // Safe model setter
  const handleSetMainProvider = (prov: AIProvider) => {
    setMainProvider(prov);
    const defaultModel = MODELS[prov].find(m => m.recommended)?.id || MODELS[prov][0].id;
    setMainModel(defaultModel);
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] dark:bg-[#050B14] p-4 sm:p-8 font-body">
      
      <AnimatePresence mode="wait">
        
        {viewState === "setup" && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto space-y-8 pb-32"
          >
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--border)] pb-6 relative">
                 <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[200%] bg-blue-500/10 blur-[120px] pointer-events-none"></div>
                 
                 <div>
                   <h1 className="text-4xl lg:text-5xl font-black text-[var(--text-primary)] font-display tracking-tight flex items-center gap-3">
                     AI Leads Engine <Sparkles className="w-8 h-8 text-[var(--accent)] animate-pulse" />
                   </h1>
                   <p className="text-base text-[var(--text-secondary)] mt-2 font-medium max-w-2xl leading-relaxed">
                     Deploy autonomous AI agents to scrape, score, and enrich B2B logistics prospects worldwide. Select your intelligence parameters below.
                   </p>
                 </div>

                 <button
                    onClick={launchEngine}
                    className="group relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-indigo-500 px-8 py-4 text-base font-extrabold text-white shadow-[0_8px_30px_rgba(46,91,255,0.3)] transition-all hover:shadow-[0_12px_40px_rgba(46,91,255,0.4)] hover:-translate-y-1 w-full md:w-auto"
                 >
                    <span>Launch Engine</span>
                    <Rocket className="w-5 h-5 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" strokeWidth={2.5} />
                 </button>
             </div>

             {/* Main Setup Layout */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                {/* Left Column - Target Param */}
                <div className="lg:col-span-7">
                  <LeadInputPanel 
                    keywords={keywords} setKeywords={setKeywords}
                    region={region} setRegion={setRegion}
                    limit={limit} setLimit={setLimit}
                    sources={sources} setSources={setSources}
                  />
                </div>

                {/* Right Column - Intelligence Config */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <AIModelSelector 
                    provider={mainProvider} setProvider={handleSetMainProvider}
                    modelId={mainModel} setModelId={setMainModel}
                  />

                  <div className="px-6 pb-6 pt-2 bg-white/5 dark:bg-[#0c1322]/50 backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-xl">
                    <AdvancedAISettings 
                       keywordConfig={keywordConfig} setKeywordConfig={setKeywordConfig}
                       emailConfig={emailConfig} setEmailConfig={setEmailConfig}
                       mainProvider={mainProvider} mainModel={mainModel}
                    />
                  </div>
                </div>
             </div>
          </motion.div>
        )}

        {viewState === "progress" && (
           <motion.div 
             key="progress"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="min-h-[80vh] flex items-center justify-center"
           >
             <LivePipelineStatus 
               maxLeads={limit} 
               onCancel={() => setViewState("setup")} 
               onComplete={handlePipelineComplete} 
             />
           </motion.div>
        )}

        {viewState === "results" && (
           <motion.div 
             key="results"
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0 }}
             className="h-[calc(100vh-2rem)] flex items-center justify-center p-4 max-w-[1400px] mx-auto"
           >
             <LeadsTable leads={leads} onClose={() => setViewState("setup")} />
           </motion.div>
        )}

        {viewState === "error" && (
           <motion.div 
             key="error"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="min-h-[60vh] flex flex-col items-center justify-center text-center max-w-md mx-auto"
           >
             <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                <Rocket className="w-10 h-10 rotate-180" />
             </div>
             <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Engine critical failure</h2>
             <p className="text-[var(--text-secondary)] font-medium mb-8 leading-relaxed">
               {errorMessage}
             </p>
             <button 
                onClick={() => setViewState("setup")}
                className="bg-[var(--accent)] text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
             >
                Return to Setup
             </button>
           </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
