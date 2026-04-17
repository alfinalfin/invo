"use client";

import React, { useMemo } from "react";
import { Zap, BrainCircuit, Coins, CheckCircle2, ChevronRight } from "lucide-react";

export type AIProvider = "groq" | "openrouter" | "gemini";

export interface AIModel {
  id: string;
  name: string;
  speed: string;
  intelligence: string;
  costTier: string;
  recommended?: boolean;
}

export const PROVIDERS: { id: AIProvider; name: string; icon: string }[] = [
  { id: "groq", name: "Groq", icon: "⚡" },
  { id: "openrouter", name: "OpenRouter", icon: "🌐" },
  { id: "gemini", name: "Gemini", icon: "✨" },
];

export const MODELS: Record<AIProvider, AIModel[]> = {
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", speed: "Very Fast", intelligence: "High", costTier: "Balanced", recommended: true },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", speed: "Maximum", intelligence: "Standard", costTier: "Cheap" },
    { id: "llama-3.1-405b-reasoning", name: "Llama 3.1 405B", speed: "Standard", intelligence: "Maximum", costTier: "Premium" },
  ],
  openrouter: [
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", speed: "Fast", intelligence: "High", costTier: "Cheap", recommended: true },
    { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", speed: "Standard", intelligence: "Very High", costTier: "Premium" },
    { id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet", speed: "Fast", intelligence: "Very High", costTier: "Balanced" },
    { id: "meta-llama/llama-3.1-405b", name: "Llama 3.1 405B", speed: "Standard", intelligence: "Maximum", costTier: "Premium" },
  ],
  gemini: [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", speed: "Very Fast", intelligence: "High", costTier: "Cheap", recommended: true },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", speed: "Standard", intelligence: "Very High", costTier: "Premium" },
  ],
};

interface AIModelSelectorProps {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  modelId: string;
  setModelId: (modelId: string) => void;
}

export function AIModelSelector({ provider, setProvider, modelId, setModelId }: AIModelSelectorProps) {
  const currentModels = MODELS[provider];

  // Auto-select first model or recommended if switching provider
  useMemo(() => {
    if (!currentModels.find(m => m.id === modelId)) {
      const defaultModel = currentModels.find(m => m.recommended) || currentModels[0];
      setModelId(defaultModel.id);
    }
  }, [provider, currentModels, modelId, setModelId]);

  const costIcon = (tier: string) => {
    if (tier === "Cheap") return "💰 Cheap";
    if (tier === "Balanced") return "⚖️ Balanced";
    return "💎 Premium";
  };

  return (
    <div className="flex flex-col space-y-6 flex-1 w-full p-6 bg-white/5 dark:bg-[#0c1322]/50 backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-xl">
      <div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-purple-500" /> AI Core Selection
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Choose the intelligence engine to drive extraction.
        </p>
      </div>

      {/* Provider Tabs */}
      <div className="flex p-1 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)]">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => setProvider(p.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
              provider === p.id
                ? "bg-white dark:bg-[#1e293b] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/5"
            }`}
          >
            <span>{p.icon}</span> {p.name}
          </button>
        ))}
      </div>

      {/* Models List */}
      <div className="space-y-3">
        {currentModels.map((model) => (
          <button
            key={model.id}
            onClick={() => setModelId(model.id)}
            className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden group ${
              modelId === model.id
                ? "border-purple-500 bg-purple-500/5 shadow-[0_4px_16px_rgba(168,85,247,0.15)]"
                : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-purple-500/30"
            }`}
          >
            {/* Recommended Badge */}
            {model.recommended && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-500 to-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
                Recommended
              </div>
            )}

            <div className="flex justify-between items-start gap-4 z-10 relative">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-base font-bold ${modelId === model.id ? 'text-purple-500 dark:text-purple-400' : 'text-[var(--text-primary)]'}`}>
                    {model.name}
                  </h4>
                  {modelId === model.id && <CheckCircle2 className="w-4 h-4 text-purple-500" />}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                   <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                     <Zap className="w-3.5 h-3.5 text-yellow-500" /> 
                     <span>{model.speed}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                     <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                     <span>{model.intelligence}</span>
                   </div>
                   <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                     <Coins className="w-3.5 h-3.5 text-green-500" />
                     <span>{costIcon(model.costTier)}</span>
                   </div>
                </div>
              </div>

              <div className={`mt-2 p-2 rounded-full transition-transform duration-300 ${modelId === model.id ? 'bg-purple-500 text-white translate-x-0' : 'bg-transparent text-[var(--border)] -translate-x-2 group-hover:translate-x-0 group-hover:text-purple-400'}`}>
                <ChevronRight className="w-4 h-4" strokeWidth={3} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
