"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Loader2, Plus, Sparkles, Square, X } from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import { EmbeddingResult, cosine, createEmbeddings, norm } from "@/app/lib/embeddings";
import { showToast } from "@/app/lib/toast";

const STORAGE_KEY = "minimalnextollamachat.embeddings";

const DEFAULT_INPUTS = [
  "How do I reset my password?",
  "I forgot my login credentials and can't sign in.",
  "What time does the store open on Saturdays?",
];

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50";

function loadInputs(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string") && parsed.length) {
      return parsed;
    }
  } catch {
    // Private mode or bad data.
  }
  return DEFAULT_INPUTS;
}

/** Blue background whose strength follows the similarity (negative values stay clear). */
function similarityStyle(value: number): React.CSSProperties {
  return { backgroundColor: `rgba(59, 130, 246, ${Math.max(0, Math.min(1, value)) * 0.75})` };
}

function CopyButton({ text, title }: { text: string; title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          showToast("error", "Clipboard unavailable");
        }
      }}
      title={title}
      className="p-1 text-gray-400 hover:text-gray-200"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

interface RunResult extends EmbeddingResult {
  inputs: string[];
  ms: number;
}

export function EmbeddingsPanel() {
  const { config, updateConfig } = useApp();
  const [inputs, setInputs] = useState<string[]>(loadInputs);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {
      // Ignore quota / privacy-mode errors.
    }
  }, [inputs]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const texts = inputs.map((s) => s.trim()).filter(Boolean);

  const run = async () => {
    if (running) return;
    if (!config.baseUrl.trim()) return showToast("error", "Configure the API base URL first.");
    if (!config.embeddingModel.trim()) return showToast("error", "Select an embedding model.");
    if (texts.length === 0) return showToast("error", "Enter at least one text.");

    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setError(null);
    const started = performance.now();
    try {
      const embedded = await createEmbeddings(
        config,
        config.embeddingModel,
        texts,
        config.embeddingDimensions,
        controller.signal,
      );
      setResult({ ...embedded, inputs: texts, ms: Math.round(performance.now() - started) });
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setRunning(false);
    }
  };

  const download = () => {
    if (!result) return;
    const data = {
      model: result.model,
      embeddings: result.inputs.map((input, i) => ({ input, embedding: result.vectors[i] })),
    };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "embeddings.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const ranked =
    result && result.vectors.length > 1
      ? result.vectors
          .slice(1)
          .map((v, i) => ({ index: i + 1, score: cosine(result.vectors[0], v) }))
          .sort((a, b) => b.score - a.score)
      : [];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Embeddings</h2>
              <p className="text-xs text-gray-500">
                Sends every text to <code className="text-gray-400">/embeddings</code> in one
                request and compares the vectors. The first text is used as the query.
              </p>
            </div>
            <label className="text-xs text-gray-400 flex items-center gap-2">
              Dimensions
              <input
                type="number"
                min={0}
                value={config.embeddingDimensions || ""}
                onChange={(e) =>
                  updateConfig({ embeddingDimensions: Math.max(0, Number(e.target.value) || 0) })
                }
                placeholder="default"
                title="Only for models that support shortening (e.g. text-embedding-3-*)"
                className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
            </label>
          </div>

          <div className="space-y-2">
            {inputs.map((value, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-2 w-6 shrink-0 text-right text-xs font-mono text-gray-500">
                  #{i + 1}
                </span>
                <textarea
                  value={value}
                  rows={2}
                  onChange={(e) =>
                    setInputs((prev) => prev.map((s, j) => (j === i ? e.target.value : s)))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run();
                  }}
                  placeholder={i === 0 ? "Query text" : "Text to compare"}
                  className={`${inputClass} resize-y`}
                />
                <button
                  onClick={() => setInputs((prev) => prev.filter((_, j) => j !== i))}
                  disabled={inputs.length === 1}
                  className="mt-2 p-1 text-gray-500 hover:text-red-400 disabled:opacity-30"
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pl-8">
            <button
              onClick={() => setInputs((prev) => [...prev, ""])}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-200"
            >
              <Plus size={14} />
              Add text
            </button>
            {running ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                <Square size={12} />
                Stop
              </button>
            ) : (
              <button
                onClick={run}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
                title="Ctrl+Enter"
              >
                <Sparkles size={14} />
                Embed
              </button>
            )}
            {running && <Loader2 size={14} className="animate-spin text-gray-400" />}
          </div>
          {error && <p className="pl-8 text-sm text-red-400">{error}</p>}
        </section>

        {result && (
          <>
            <section className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 border-t border-gray-800 pt-4">
              <span>
                Model <span className="font-mono text-gray-200">{result.model}</span>
              </span>
              <span>
                <span className="text-gray-200">{result.vectors.length}</span> vectors ×{" "}
                <span className="text-gray-200">{result.vectors[0]?.length ?? 0}</span> dimensions
              </span>
              {result.promptTokens !== undefined && (
                <span>
                  <span className="text-gray-200">{result.promptTokens}</span> tokens
                </span>
              )}
              <span>{result.ms} ms</span>
              <button
                onClick={download}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-gray-200"
              >
                <Download size={12} />
                Download JSON
              </button>
            </section>

            {ranked.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Closest to #1
                </h3>
                <ol className="space-y-1.5">
                  {ranked.map(({ index, score }) => (
                    <li key={index} className="flex items-center gap-3 text-sm">
                      <span className="w-12 shrink-0 text-right font-mono text-gray-300">
                        {score.toFixed(3)}
                      </span>
                      <div className="w-24 shrink-0 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${Math.max(0, score) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-500 font-mono text-xs">#{index + 1}</span>
                      <span className="truncate text-gray-300">{result.inputs[index]}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {result.vectors.length > 1 && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cosine similarity
                </h3>
                <div className="overflow-x-auto">
                  <table className="text-xs font-mono border-separate border-spacing-0.5">
                    <thead>
                      <tr>
                        <th />
                        {result.inputs.map((input, j) => (
                          <th key={j} title={input} className="px-2 py-1 text-gray-500 font-normal">
                            #{j + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.vectors.map((a, i) => (
                        <tr key={i}>
                          <th
                            title={result.inputs[i]}
                            className="px-2 py-1 text-gray-500 font-normal text-right"
                          >
                            #{i + 1}
                          </th>
                          {result.vectors.map((b, j) => {
                            const value = cosine(a, b);
                            return (
                              <td
                                key={j}
                                style={similarityStyle(value)}
                                title={`#${i + 1} ↔ #${j + 1}`}
                                className="px-2 py-1.5 rounded text-center text-gray-100 min-w-14"
                              >
                                {value.toFixed(3)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Vectors
              </h3>
              {result.vectors.map((vector, i) => (
                <div
                  key={i}
                  className="bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-500">#{i + 1}</span>
                    <span className="truncate text-gray-300">{result.inputs[i]}</span>
                    <span className="ml-auto shrink-0 text-gray-500">
                      ‖v‖ {norm(vector).toFixed(3)}
                    </span>
                    <CopyButton text={JSON.stringify(vector)} title="Copy vector as JSON" />
                  </div>
                  <p className="mt-1 font-mono text-gray-500 truncate">
                    [
                    {vector
                      .slice(0, 8)
                      .map((x) => x.toFixed(4))
                      .join(", ")}
                    {vector.length > 8 ? ", …" : ""}]
                  </p>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
