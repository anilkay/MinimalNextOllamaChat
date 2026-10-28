"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import { listModels } from "@/app/lib/openai";

export function ModelSelect() {
  const { config, updateConfig } = useApp();
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(config.model);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { baseUrl, apiKey } = config;

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setModels(await listModels({ baseUrl, apiKey }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load models");
    } finally {
      setLoading(false);
    }
  }, [baseUrl, apiKey]);

  useEffect(() => {
    if (baseUrl) loadModels();
  }, [baseUrl, loadModels]);

  useEffect(() => {
    setDraft(config.model);
  }, [config.model]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const commit = (model: string) => {
    updateConfig({ model });
    setDraft(model);
    setOpen(false);
  };

  const filtered = models.filter((m) =>
    m.toLowerCase().includes(draft.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative w-72 max-w-full">
      <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 focus-within:border-blue-500/60">
        <Box size={14} className="text-gray-400 shrink-0" />
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(draft.trim());
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Model (e.g. gpt-4o-mini)"
          className="flex-1 min-w-0 bg-transparent text-sm py-2 focus:outline-none text-gray-100 placeholder-gray-500"
        />
        <button
          onClick={loadModels}
          title="Refresh models"
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
        <button
          onClick={() => setOpen((o) => !o)}
          title="Show models"
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
          {loading && <div className="px-3 py-2 text-xs text-gray-400">Loading models…</div>}
          {error && <div className="px-3 py-2 text-xs text-red-400">{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">
              No models found. Type an ID and press Enter.
            </div>
          )}
          {filtered.map((m) => (
            <button
              key={m}
              onClick={() => commit(m)}
              className="block w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 truncate"
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
