"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Check, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import { listModels } from "@/app/lib/openai";

/** Lowercases and drops separators so "gpt4o" finds "gpt-4o" and "qwen2.5" finds "Qwen2.5-Coder". */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[\s\-_.:/]+/g, "");
}

/** Every whitespace-separated word of the query must appear in the model ID. */
function matchesQuery(model: string, query: string): boolean {
  const target = normalize(model);
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => target.includes(normalize(word)));
}

export function ModelSelect() {
  const { config, updateConfig } = useApp();
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  /** Text typed while searching; null shows the selected model and the full list. */
  const [query, setQuery] = useState<string | null>(null);
  /** Index of the keyboard-highlighted option, -1 for none. */
  const [highlight, setHighlight] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { baseUrl, apiKey, authHeader } = config;

  const requestRef = useRef<AbortController | null>(null);

  const loadModels = useCallback(async () => {
    // Cancel any in-flight request so a slower, older response can't overwrite this one.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await listModels({ baseUrl, apiKey, authHeader }, controller.signal);
      if (!controller.signal.aborted) setModels(result);
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Failed to load models");
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, [baseUrl, apiKey, authHeader]);

  // Debounce so typing a URL or key doesn't fire a request per keystroke.
  useEffect(() => {
    if (!baseUrl) return;
    const timer = setTimeout(loadModels, 500);
    return () => clearTimeout(timer);
  }, [baseUrl, loadModels]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery(null);
  }, []);

  // Clicking outside abandons the search and shows the selected model again.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [close]);

  const commit = (model: string) => {
    if (model) updateConfig({ model });
    close();
    inputRef.current?.blur();
  };

  const search = query?.trim() ?? "";
  // Offer the typed text as a custom ID when it isn't in the list. A query with spaces
  // is a multi-word search, not an ID.
  const showCustom = search !== "" && !/\s/.test(search) && !models.includes(search);
  const options = useMemo(() => {
    const filtered = search ? models.filter((m) => matchesQuery(m, search)) : models;
    return showCustom ? [...filtered, search] : filtered;
  }, [models, search, showCustom]);
  const active = Math.min(highlight, options.length - 1);

  // Keep the highlighted (or, on open, the selected) option visible.
  useEffect(() => {
    if (!open) return;
    const index = active >= 0 ? active : options.indexOf(config.model);
    listRef.current
      ?.querySelector(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active, options, config.model]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      if (options.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setHighlight((h) => {
        const current = Math.min(h, options.length - 1);
        if (current < 0) return step === 1 ? 0 : options.length - 1;
        return (current + step + options.length) % options.length;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) commit(options[active]);
      else commit(search);
    } else if (e.key === "Escape") {
      close();
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-72 max-w-full">
      <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg px-2 focus-within:border-blue-500/60">
        <Box size={14} className="text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          value={query ?? config.model}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(e.target.value.trim() ? 0 : -1);
            setOpen(true);
          }}
          onFocus={(e) => {
            // Start from the full list; typing replaces the selected text.
            e.target.select();
            setHighlight(-1);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search or type a model ID"
          role="combobox"
          aria-expanded={open}
          aria-controls="model-options"
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
          onClick={() => {
            if (open) {
              close();
            } else {
              setHighlight(-1);
              setOpen(true);
            }
          }}
          title="Show models"
          className="p-1 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {open && (
        <div
          id="model-options"
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl"
        >
          {loading && <div className="px-3 py-2 text-xs text-gray-400">Loading models…</div>}
          {error && <div className="px-3 py-2 text-xs text-red-400">{error}</div>}
          {!loading && !error && options.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-500">
              No models found. Type a model ID and press Enter.
            </div>
          )}
          {options.map((m, i) => {
            const isCustom = showCustom && i === options.length - 1;
            const isSelected = !isCustom && m === config.model;
            return (
              <button
                key={isCustom ? "__custom" : m}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                // Keep focus in the input so the click isn't treated as a blur.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(m)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${
                  i === active ? "bg-gray-700" : ""
                } ${isCustom ? "text-gray-400 border-t border-gray-700" : "text-gray-200"}`}
              >
                <span className="w-3.5 shrink-0">
                  {isSelected && <Check size={14} className="text-blue-400" />}
                </span>
                <span className="truncate">
                  {isCustom ? (
                    <>
                      Use <span className="text-gray-200">&ldquo;{m}&rdquo;</span>
                    </>
                  ) : (
                    m
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
