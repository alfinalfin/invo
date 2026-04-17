"use client";

import React, { useState } from "react";
import { Settings2, ChevronDown, Mail, SearchCode, RefreshCw } from "lucide-react";
import { AIProvider, PROVIDERS, MODELS } from "./AIModelSelector";

export interface AIOverride {
  provider: AIProvider;
  model: string;
}

interface AdvancedAISettingsProps {
  keywordConfig: AIOverride | null;
  setKeywordConfig: (config: AIOverride | null) => void;
  emailConfig: AIOverride | null;
  setEmailConfig: (config: AIOverride | null) => void;
  mainProvider: AIProvider;
  mainModel: string;
}

export function AdvancedAISettings({
  keywordConfig,
  setKeywordConfig,
  emailConfig,
  setEmailConfig,
  mainProvider,
  mainModel,
}: AdvancedAISettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const renderOverrideSelector = (
    title: string,
    icon: React.ReactNode,
    description: string,
    currentConfig: AIOverride | null,
    setConfig: (config: AIOverride | null) => void
  ) => {
    const isOverrideActive = currentConfig !== null;
    const activeProvider = currentConfig?.provider || mainProvider;
    const activeModel = currentConfig?.model || mainModel;

    return (
      <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOverrideActive ? 'bg-[var(--accent)] text-white' : 'bg-[var(--border)] text-[var(--text-secondary)]'}`}>
              {icon}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex items-center">
             <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isOverrideActive} 
                onChange={(e) => {
                  if (e.target.checked) {
                    setConfig({ provider: mainProvider, model: mainModel });
                  } else {
                    setConfig(null);
                  }
                }} 
              />
              <div className="w-9 h-5 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)]"></div>
            </label>
          </div>
        </div>

        {isOverrideActive && (
          <div className="p-3 bg-[var(--surface-primary)] border border-[var(--border)] rounded-xl space-y-3 mt-1 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Provider Override</label>
              <select 
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-sm rounded-lg p-2 outline-none focus:border-[var(--accent)] text-[var(--text-primary)] font-medium"
                value={activeProvider}
                onChange={(e) => {
                  const newProvider = e.target.value as AIProvider;
                  const newModel = MODELS[newProvider].find(m => m.recommended)?.id || MODELS[newProvider][0].id;
                  setConfig({ provider: newProvider, model: newModel });
                }}
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Model Override</label>
              <select 
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-sm rounded-lg p-2 outline-none focus:border-[var(--accent)] text-[var(--text-primary)] font-medium"
                value={activeModel}
                onChange={(e) => setConfig({ provider: activeProvider, model: e.target.value })}
              >
                {MODELS[activeProvider].map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full border-t border-[var(--border)] pt-4 mt-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <Settings2 className="w-4 h-4" /> Advanced Pipeline Overrides
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-200">
          {renderOverrideSelector(
            "Keyword Expansion",
            <SearchCode className="w-5 h-5" />,
            "Model used to find semantic variations of base keywords.",
            keywordConfig,
            setKeywordConfig
          )}
          
          {renderOverrideSelector(
            "Cold Email Drafting",
            <Mail className="w-5 h-5" />,
            "Model used to compose personalized outreach messages.",
            emailConfig,
            setEmailConfig
          )}

          <div className="md:col-span-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3 mt-2">
             <RefreshCw className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
             <p className="text-sm text-yellow-600 dark:text-yellow-400/80 font-medium leading-relaxed">
               When an override is not active, the assigned task automatically falls back to your main selection context ({PROVIDERS.find(p => p.id === mainProvider)?.name} - {MODELS[mainProvider]?.find(m => m.id === mainModel)?.name || "Default"}).
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
