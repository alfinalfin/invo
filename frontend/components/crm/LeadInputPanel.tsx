"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, X, Map, Database, Linkedin } from "lucide-react";
import { searchPlaces } from "../../app/actions/places";

interface Sources {
  google: boolean;
  directories: boolean;
  linkedin: boolean;
}

interface LeadInputPanelProps {
  keywords: string[];
  setKeywords: (keywords: string[]) => void;
  region: string;
  setRegion: (region: string) => void;
  limit: number;
  setLimit: (limit: number) => void;
  sources: Sources;
  setSources: (sources: Sources) => void;
}

export function LeadInputPanel({
  keywords,
  setKeywords,
  region,
  setRegion,
  limit,
  setLimit,
  sources,
  setSources,
}: LeadInputPanelProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const [locationSearch, setLocationSearch] = useState(region || "");
  const [placePredictions, setPlacePredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const addKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keywordInput.trim() !== "") {
      e.preventDefault();
      if (!keywords.includes(keywordInput.trim())) {
        setKeywords([...keywords, keywordInput.trim()]);
      }
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (locationSearch.trim().length > 2 && locationSearch !== region) {
        try {
          const results = await searchPlaces(locationSearch);
          setPlacePredictions(results || []);
        } catch (e) {
          console.error(e);
        }
      } else {
        setPlacePredictions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [locationSearch, region]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col space-y-8 p-6 bg-white/5 dark:bg-[#0c1322]/50 backdrop-blur-xl border border-[var(--border)] rounded-3xl shadow-xl">
      <div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Search className="w-5 h-5 text-[var(--accent)]" /> Targeting Parameters
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Define exactly who your AI agents should hunt for.
        </p>
      </div>

      {/* Keywords */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-[var(--text-primary)]">Target Keywords</label>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20 transition-all">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-1.5 text-sm font-medium text-[var(--accent)]"
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                className="hover:text-[var(--accent)]/70 hover:bg-[var(--accent)]/10 rounded-full p-0.5 transition-colors"
                title="Remove keyword"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={addKeyword}
            placeholder="Type a keyword and press Enter..."
            className="min-w-[200px] flex-1 bg-transparent px-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none border-none focus:ring-0"
          />
        </div>
      </div>

      {/* Region & Limit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3 relative" ref={locationRef}>
          <label className="text-sm font-semibold text-[var(--text-primary)]">Geographic Region</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                setShowPredictions(true);
              }}
              onFocus={() => setShowPredictions(true)}
              placeholder="e.g. London, United Kingdom"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] py-3.5 pl-11 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all"
            />
            
            {showPredictions && placePredictions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-56 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-primary)] shadow-2xl backdrop-blur-md">
                {placePredictions.map((place) => (
                  <button
                    key={place.place_id}
                    onClick={(e) => {
                      e.preventDefault();
                      setLocationSearch(place.description);
                      setRegion(place.description);
                      setShowPredictions(false);
                    }}
                    className="w-full text-left px-5 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] transition-colors border-b border-[var(--border)] last:border-0 truncate flex items-center gap-3"
                  >
                    <MapPin className="w-4 h-4 opacity-50 shrink-0" />
                    <span>{place.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex justify-between text-sm font-semibold text-[var(--text-primary)]">
            <span>Extraction Volume</span>
            <span className="text-[var(--accent)] font-bold bg-[var(--accent)]/10 px-2.5 py-0.5 rounded-md">
              {limit} Leads
            </span>
          </label>
          <div className="pt-2">
            <input
              type="range"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              min="10"
              max="100"
              step="10"
              className="w-full h-2 rounded-full appearance-none bg-[var(--border)] accent-[var(--accent)] outline-none cursor-pointer"
            />
            <div className="flex justify-between items-center mt-3 text-xs text-[var(--text-tertiary)] font-medium">
              <span>10 (Fast)</span>
              <span>100 (Deep)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="space-y-4">
        <label className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          Data Sources
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setSources({ ...sources, google: !sources.google })}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              sources.google
                ? "border-blue-500 bg-blue-500/5 shadow-[0_4px_12px_rgba(59,130,246,0.1)]"
                : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-blue-500/50"
            }`}
          >
            <div className={`p-2 rounded-lg ${sources.google ? 'bg-blue-500 text-white' : 'bg-[var(--border)] text-[var(--text-secondary)]'}`}>
              <Map className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-bold ${sources.google ? 'text-blue-500' : 'text-[var(--text-primary)]'}`}>Google Maps</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Places API</div>
            </div>
          </button>

          <button
            onClick={() => setSources({ ...sources, directories: !sources.directories })}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              sources.directories
                ? "border-purple-500 bg-purple-500/5 shadow-[0_4px_12px_rgba(168,85,247,0.1)]"
                : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-purple-500/50"
            }`}
          >
            <div className={`p-2 rounded-lg ${sources.directories ? 'bg-purple-500 text-white' : 'bg-[var(--border)] text-[var(--text-secondary)]'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-bold ${sources.directories ? 'text-purple-500' : 'text-[var(--text-primary)]'}`}>Directories</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Global Registry</div>
            </div>
          </button>

          <button
            onClick={() => setSources({ ...sources, linkedin: !sources.linkedin })}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden ${
              sources.linkedin
                ? "border-[#0a66c2] bg-[#0a66c2]/5 shadow-[0_4px_12px_rgba(10,102,194,0.1)]"
                : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[#0a66c2]/50"
            }`}
          >
            <div className={`p-2 rounded-lg ${sources.linkedin ? 'bg-[#0a66c2] text-white' : 'bg-[var(--border)] text-[var(--text-secondary)]'}`}>
              <Linkedin className="w-5 h-5" />
            </div>
            <div>
              <div className={`text-sm font-bold ${sources.linkedin ? 'text-[#0a66c2]' : 'text-[var(--text-primary)]'}`}>LinkedIn</div>
              <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Executive Data</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
