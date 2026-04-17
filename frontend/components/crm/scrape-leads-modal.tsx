"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Bot, MapPin, Search, X, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { searchPlaces } from "../../app/actions/places";

export function ScrapeLeadsModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(searchParams?.get("scrape") === "true");
  }, [searchParams]);

  const closeModal = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.delete("scrape");
    router.push(`${pathname}?${params.toString()}`);
  };

  const [keywords, setKeywords] = useState<string[]>(["logistics", "freight"]);
  const [keywordInput, setKeywordInput] = useState("");

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

  const [location, setLocation] = useState("United Kingdom - National");
  const [locationSearch, setLocationSearch] = useState("United Kingdom - National");
  const [placePredictions, setPlacePredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (locationSearch.trim().length > 2 && locationSearch !== location) {
        const results = await searchPlaces(locationSearch);
        setPlacePredictions(results);
      } else {
        setPlacePredictions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [locationSearch, location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [maxLeads, setMaxLeads] = useState(50);
  const [sourceMaps, setSourceMaps] = useState(true);
  const [sourceDirectories, setSourceDirectories] = useState(false);
  const [enableAIFiltering, setEnableAIFiltering] = useState(true);
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const [isScraping, setIsScraping] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const startScraping = () => {
    setIsScraping(true);
    setToastMessage("Scraping started...");

    setTimeout(() => {
      setIsScraping(false);
      setToastMessage("42 leads added successfully! ✨");

      setTimeout(() => {
        setToastMessage("");
        closeModal();
      }, 2000);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div
        className="surface-card relative w-full max-w-lg animate-in fade-in zoom-in-95 overflow-hidden rounded-[24px] shadow-2xl transition-all duration-300"
      >
        {/* Header */}
        <div className="border-b border-[var(--border)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                  Scrape Leads
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Extract high-quality prospects automatically.
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="rounded-full p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Keywords */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Target Keywords
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-2 focus-within:border-[var(--accent)] transition-colors">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="flex items-center gap-1 rounded-lg bg-[var(--accent)]/10 px-2 py-1 text-sm font-medium text-[var(--accent)]"
                >
                  {kw}
                  <button
                    onClick={() => removeKeyword(kw)}
                    className="hover:text-[var(--accent)]/70 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={addKeyword}
                placeholder="Add keyword & press enter..."
                className="min-w-[120px] flex-1 bg-transparent px-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
              />
            </div>
          </div>

          {/* Location & Max Leads */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative" ref={locationRef}>
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Geographic Region
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => {
                    setLocationSearch(e.target.value);
                    setShowPredictions(true);
                  }}
                  onFocus={() => setShowPredictions(true)}
                  placeholder="e.g. London, UK"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
                
                {showPredictions && placePredictions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-[100] mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-primary)] shadow-lg backdrop-blur-md">
                    {placePredictions.map((place) => (
                      <button
                        key={place.place_id}
                        onClick={(e) => {
                          e.preventDefault();
                          setLocationSearch(place.description);
                          setLocation(place.description);
                          setShowPredictions(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white transition-colors border-b border-[var(--border)] last:border-0 truncate"
                      >
                        {place.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex justify-between text-sm font-medium text-[var(--text-primary)]">
                <span>Max Leads</span>
                <span className="text-[var(--text-secondary)]">{maxLeads}</span>
              </label>
              <input
                type="range"
                value={maxLeads}
                onChange={(e) => setMaxLeads(parseInt(e.target.value))}
                min="10"
                max="200"
                step="10"
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>

          {/* Data Sources */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Data Sources
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  sourceMaps
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sourceMaps}
                  onChange={(e) => setSourceMaps(e.target.checked)}
                  className="hidden"
                />
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    sourceMaps
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)]"
                  }`}
                >
                  {sourceMaps && <ShieldCheck className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={`text-sm font-medium ${
                    sourceMaps
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  Google Maps
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                  sourceDirectories
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-[var(--border)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={sourceDirectories}
                  onChange={(e) => setSourceDirectories(e.target.checked)}
                  className="hidden"
                />
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    sourceDirectories
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--border)]"
                  }`}
                >
                  {sourceDirectories && <ShieldCheck className="h-3.5 w-3.5" />}
                </div>
                <span
                  className={`text-sm font-medium ${
                    sourceDirectories
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)]"
                  }`}
                >
                  Directories
                </span>
              </label>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4 rounded-xl bg-[var(--bg-secondary)] p-4">
            <label className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Enable AI Filtering (OpenClaw)
                </span>
              </div>
              <div
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  enableAIFiltering ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setEnableAIFiltering(!enableAIFiltering);
                }}
              >
                <div
                  className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    enableAIFiltering ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </label>

            <label className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--text-secondary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Skip Duplicates
                </span>
              </div>
              <div
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  skipDuplicates ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setSkipDuplicates(!skipDuplicates);
                }}
              >
                <div
                  className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    skipDuplicates ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] p-6">
          <button
            onClick={startScraping}
            disabled={isScraping}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--accent)]/90 disabled:opacity-70"
          >
            {!isScraping ? (
              <>
                <Sparkles className="h-4 w-4" />
                Start Scraping
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing workflow...
              </>
            )}
          </button>
        </div>

        {/* Toast overlay */}
        {toastMessage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom-5 fade-in rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
