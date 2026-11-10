"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  Plus,
  Scale,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import {
  DecisionQuestion,
  DecisionWorkspace,
  MAX_CHOICE_OPTIONS,
  MAX_SCORE_LEVELS,
  QuestionType,
  SystemOneResponse,
  buildSystemOneRequest,
  isAnswer,
  parseState,
  runSystemOne,
} from "@/app/lib/systemone";
import { showToast } from "@/app/lib/toast";

const STORAGE_KEY = "minimalnextollamachat.decision";

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50";

/** Noul probabilities at or above / below these read as yes / no (the docs' starting point). */
const NOUL_YES = 0.7;
const NOUL_NO = 0.3;

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function newQuestion(type: QuestionType, name: string): DecisionQuestion {
  return {
    uid: makeId(),
    name,
    type,
    instructions: "",
    options:
      type === "choice"
        ? [
            { name: "", description: "" },
            { name: "", description: "" },
          ]
        : [],
    levels: type === "score" ? ["", "", ""] : [],
    trueMeans: "",
    falseMeans: "",
  };
}

function question(partial: Partial<DecisionQuestion> & Pick<DecisionQuestion, "name" | "type">) {
  return { ...newQuestion(partial.type, partial.name), options: [], levels: [], ...partial };
}

const EXAMPLES: { label: string; workspace: () => DecisionWorkspace }[] = [
  {
    label: "Support ticket",
    workspace: () => ({
      state:
        "Hi, my order #4821 arrived yesterday but the blender jar is cracked. I need it for a party on Friday. Can you send a replacement quickly, or should I just return it?",
      questions: [
        question({
          name: "department",
          type: "choice",
          instructions: "Which team should handle this message?",
          options: [
            { name: "shipping", description: "Delivery, tracking, damaged or lost parcels" },
            { name: "returns", description: "Returns, replacements and refunds" },
            { name: "billing", description: "Charges, invoices and payment methods" },
            { name: "technical", description: "How to use or fix a product" },
          ],
        }),
        question({
          name: "urgency",
          type: "score",
          instructions: "How soon does the customer need a response?",
          levels: [
            "No time pressure",
            "Should be answered within a few days",
            "Needs an answer today",
          ],
        }),
        question({
          name: "wants_replacement",
          type: "noul",
          instructions: "Does the customer ask for a replacement item?",
        }),
      ],
    }),
  },
  {
    label: "Product review (JSON state)",
    workspace: () => ({
      state: JSON.stringify(
        {
          product: "Trail running shoes",
          stars: 3,
          review:
            "Great grip on wet rocks and very light. After two months the sole started to separate from the toe, which is disappointing at this price.",
        },
        null,
        2,
      ),
      questions: [
        question({
          name: "sentiment",
          type: "score",
          instructions: "How does `review` feel about the product overall?",
          levels: ["Very negative", "Negative", "Mixed", "Positive", "Very positive"],
        }),
        question({
          name: "reports_defect",
          type: "noul",
          instructions: "Does `review` describe a manufacturing defect or something breaking?",
        }),
        question({
          name: "main_topic",
          type: "choice",
          instructions: "What does `review` talk about most?",
          options: [
            { name: "durability", description: "" },
            { name: "comfort", description: "" },
            { name: "performance", description: "" },
            { name: "price", description: "" },
          ],
        }),
      ],
    }),
  },
];

function loadWorkspace(): DecisionWorkspace {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    if (parsed && typeof parsed.state === "string" && Array.isArray(parsed.questions)) {
      return {
        state: parsed.state,
        questions: parsed.questions.map((q: Partial<DecisionQuestion>) => ({
          ...newQuestion(q.type ?? "noul", q.name ?? ""),
          options: [],
          levels: [],
          ...q,
        })),
      };
    }
  } catch {
    // Private mode or bad data.
  }
  return EXAMPLES[0].workspace();
}

function percent(p: number): string {
  return `${Math.round(p * 100)}%`;
}

function Bar({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${highlight ? "bg-blue-500" : "bg-gray-500"}`}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

function legendText(entry: unknown): string {
  return typeof entry === "string" ? entry : JSON.stringify(entry);
}

function AnswerView({ answer }: { answer: unknown }) {
  // An answer in a shape this page does not know is shown as it came.
  if (!isAnswer(answer)) {
    return (
      <pre className="font-mono text-xs text-gray-400 whitespace-pre-wrap break-words">
        {JSON.stringify(answer, null, 2)}
      </pre>
    );
  }

  if (answer.type === "noul") {
    const p = answer.noul;
    const verdict = p >= NOUL_YES ? "Yes" : p <= NOUL_NO ? "No" : "Unsure";
    const color =
      verdict === "Yes" ? "text-emerald-400" : verdict === "No" ? "text-red-400" : "text-amber-400";
    return (
      <div className="space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className={`text-base font-semibold ${color}`}>{verdict}</span>
          <span className="text-xs text-gray-400">P(yes) = {p.toFixed(3)}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <span>no</span>
          <Bar value={p} highlight />
          <span>yes</span>
        </div>
      </div>
    );
  }

  if (answer.type === "choice") {
    const entries = Object.entries(answer.probabilities).sort((a, b) => b[1] - a[1]);
    return (
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-blue-300 font-mono">{answer.choice}</span>
          <span className="text-xs text-gray-400">confidence {percent(answer.confidence)}</span>
        </div>
        <ul className="space-y-1">
          {entries.map(([name, p]) => (
            <li key={name} className="flex items-center gap-2 text-xs">
              <span className="w-32 shrink-0 truncate font-mono text-gray-300" title={name}>
                {name}
              </span>
              <Bar value={p} highlight={name === answer.choice} />
              <span className="w-10 shrink-0 text-right text-gray-400">{percent(p)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const levels = Object.keys(answer.probabilities)
    .map(Number)
    .sort((a, b) => a - b);
  const top = Math.max(...levels, 1);
  const likeliest = levels.reduce(
    (best, l) =>
      (answer.probabilities[String(l)] ?? 0) > (answer.probabilities[String(best)] ?? 0) ? l : best,
    levels[0] ?? 0,
  );
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-base font-semibold text-blue-300">{answer.score.toFixed(2)}</span>
        <span className="text-xs text-gray-500">/ {top}</span>
        <span className="text-xs text-gray-400">confidence {percent(answer.confidence)}</span>
      </div>
      <div className="relative h-1.5 bg-gray-800 rounded-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-400 border-2 border-gray-900"
          style={{ left: `${(answer.score / top) * 100}%` }}
        />
      </div>
      <ul className="space-y-1">
        {levels.map((level) => {
          const p = answer.probabilities[String(level)] ?? 0;
          return (
            <li key={level} className="flex items-center gap-2 text-xs">
              <span className="w-4 shrink-0 text-right font-mono text-gray-500">{level}</span>
              <span
                className="w-44 shrink-0 truncate text-gray-300"
                title={legendText(answer.legend?.[String(level)])}
              >
                {legendText(answer.legend?.[String(level)])}
              </span>
              <Bar value={p} highlight={level === likeliest} />
              <span className="w-10 shrink-0 text-right text-gray-400">{percent(p)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const TYPE_LABEL: Record<QuestionType, string> = {
  choice: "Choice",
  noul: "Noul",
  score: "Score",
};

const TYPE_HINT: Record<QuestionType, string> = {
  choice: "Picks one option and gives a probability for each.",
  noul: "Probability that a condition holds (yes/no).",
  score: "Expected position on ordered levels, lowest first.",
};

function QuestionCard({
  q,
  answer,
  stale,
  onChange,
  onRemove,
}: {
  q: DecisionQuestion;
  /** Undefined when the last run has no answer under this question's name. */
  answer?: unknown;
  stale: boolean;
  onChange: (patch: Partial<DecisionQuestion>) => void;
  onRemove: () => void;
}) {
  const setType = (type: QuestionType) => {
    const blank = newQuestion(type, q.name);
    onChange({
      type,
      options: q.options.length > 0 ? q.options : blank.options,
      levels: q.levels.length > 0 ? q.levels : blank.levels,
    });
  };

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800">
        <select
          value={q.type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          title={TYPE_HINT[q.type]}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200 focus:outline-none"
        >
          {(Object.keys(TYPE_LABEL) as QuestionType[]).map((t) => (
            <option key={t} value={t} className="bg-gray-800">
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <input
          value={q.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="answer_name"
          title="Key for the answer. Not shown to the model."
          className="flex-1 min-w-0 bg-transparent text-sm font-mono text-gray-100 placeholder-gray-600 focus:outline-none"
        />
        <button onClick={onRemove} className="p-1 text-gray-500 hover:text-red-400" title="Remove">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <textarea
          value={q.instructions}
          onChange={(e) => onChange({ instructions: e.target.value })}
          rows={1}
          placeholder={
            q.type === "noul"
              ? "Condition to check, e.g. Is this message about billing?"
              : "Question for the model, e.g. What is the tone of this message?"
          }
          className={`${inputClass} resize-y`}
        />

        {q.type === "choice" && (
          <div className="space-y-1.5">
            {q.options.map((option, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={option.name}
                  onChange={(e) =>
                    onChange({
                      options: q.options.map((o, j) =>
                        j === i ? { ...o, name: e.target.value } : o,
                      ),
                    })
                  }
                  placeholder="option"
                  className={`${inputClass} w-40 shrink-0 font-mono py-1.5`}
                />
                <input
                  value={option.description}
                  onChange={(e) =>
                    onChange({
                      options: q.options.map((o, j) =>
                        j === i ? { ...o, description: e.target.value } : o,
                      ),
                    })
                  }
                  placeholder="What this option means (optional)"
                  className={`${inputClass} py-1.5`}
                />
                <button
                  onClick={() => onChange({ options: q.options.filter((_, j) => j !== i) })}
                  className="p-1 text-gray-500 hover:text-red-400"
                  title="Remove option"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ options: [...q.options, { name: "", description: "" }] })}
              disabled={q.options.length >= MAX_CHOICE_OPTIONS}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-40"
            >
              <Plus size={12} />
              Add option
            </button>
          </div>
        )}

        {q.type === "score" && (
          <div className="space-y-1.5">
            {q.levels.map((level, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-right text-xs font-mono text-gray-500">{i}</span>
                <input
                  value={level}
                  onChange={(e) =>
                    onChange({
                      levels: q.levels.map((l, j) => (j === i ? e.target.value : l)),
                    })
                  }
                  placeholder={
                    i === 0 ? "Lowest level" : i === q.levels.length - 1 ? "Highest level" : "Level"
                  }
                  className={`${inputClass} py-1.5`}
                />
                <button
                  onClick={() => onChange({ levels: q.levels.filter((_, j) => j !== i) })}
                  className="p-1 text-gray-500 hover:text-red-400"
                  title="Remove level"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={() => onChange({ levels: [...q.levels, ""] })}
              disabled={q.levels.length >= MAX_SCORE_LEVELS}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-40"
            >
              <Plus size={12} />
              Add level
            </button>
          </div>
        )}

        {q.type === "noul" && (
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={q.trueMeans}
              onChange={(e) => onChange({ trueMeans: e.target.value })}
              placeholder="Yes means… (optional)"
              className={`${inputClass} py-1.5`}
            />
            <input
              value={q.falseMeans}
              onChange={(e) => onChange({ falseMeans: e.target.value })}
              placeholder="No means… (optional)"
              className={`${inputClass} py-1.5`}
            />
          </div>
        )}

        {answer !== undefined && (
          <div
            className={`border-t border-gray-800 pt-3 ${stale ? "opacity-50" : ""}`}
            title={stale ? "Edited since the last run" : undefined}
          >
            <AnswerView answer={answer} />
          </div>
        )}
      </div>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  const [open, setOpen] = useState(false);
  const text = JSON.stringify(value, null, 2);
  return (
    <div className="border border-gray-800 rounded-lg text-xs">
      <div className="flex items-center">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-1 px-3 py-2 text-gray-400 hover:text-gray-200"
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {title}
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              showToast("success", "Copied");
            } catch {
              showToast("error", "Clipboard unavailable");
            }
          }}
          className="p-2 text-gray-500 hover:text-gray-200"
          title="Copy"
        >
          <Copy size={12} />
        </button>
      </div>
      {open && (
        <pre className="px-3 pb-3 max-h-96 overflow-auto font-mono text-gray-400 whitespace-pre-wrap break-words">
          {text}
        </pre>
      )}
    </div>
  );
}

interface RunResult {
  request: Record<string, unknown>;
  response: SystemOneResponse;
  ms: number;
}

export function DecisionPanel() {
  const { config } = useApp();
  const [workspace, setWorkspace] = useState<DecisionWorkspace>(loadWorkspace);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Ignore quota / privacy-mode errors.
    }
  }, [workspace]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const state = useMemo(() => parseState(workspace.state), [workspace.state]);
  const built = useMemo(
    () => buildSystemOneRequest(workspace, config.decisionModel),
    [workspace, config.decisionModel],
  );
  const requestText = built.body ? JSON.stringify(built.body) : null;
  const ranText = result ? JSON.stringify(result.request) : null;

  const updateQuestion = (uid: string, patch: Partial<DecisionQuestion>) =>
    setWorkspace((w) => ({
      ...w,
      questions: w.questions.map((q) => (q.uid === uid ? { ...q, ...patch } : q)),
    }));

  const addQuestion = (type: QuestionType) =>
    setWorkspace((w) => {
      const taken = new Set(w.questions.map((q) => q.name));
      let n = w.questions.length + 1;
      while (taken.has(`question_${n}`)) n++;
      return { ...w, questions: [...w.questions, newQuestion(type, `question_${n}`)] };
    });

  const run = async () => {
    if (running) return;
    if (!built.body) {
      showToast("error", built.errors[0] ?? "The request is incomplete.");
      return;
    }
    if (!config.decisionBaseUrl.trim()) {
      showToast("error", "Configure the TypeSafe base URL first.");
      return;
    }
    const body = built.body;
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true);
    setError(null);
    const started = performance.now();
    try {
      const response = await runSystemOne(config, body, controller.signal);
      setResult({ request: body, response, ms: Math.round(performance.now() - started) });
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setRunning(false);
    }
  };

  const stale = ranText !== null && ranText !== requestText;
  // A Map, so a question named "constructor" finds no inherited property.
  const answers = new Map(Object.entries(result?.response.answers ?? {}));

  return (
    <div
      className="h-full overflow-y-auto"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run();
      }}
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <section className="space-y-2">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Decide</h2>
              <p className="text-xs text-gray-500">
                Asks a System One model such as Jev typed questions about the state below. Answers
                are probabilities, not generated text.{" "}
                <a
                  href="https://docs.typesafe.ai/primitives"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  How to write questions
                </a>
              </p>
            </div>
            <select
              value=""
              onChange={(e) => {
                const example = EXAMPLES[Number(e.target.value)];
                if (example) {
                  setWorkspace(example.workspace());
                  setResult(null);
                  setError(null);
                }
              }}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
            >
              <option value="" disabled className="bg-gray-800">
                Load example…
              </option>
              {EXAMPLES.map((example, i) => (
                <option key={example.label} value={i} className="bg-gray-800">
                  {example.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-400">State</label>
            <span className="text-[11px] text-gray-500">
              {state.isJson ? "Sent as JSON" : "Sent as text"} · refer to fields as{" "}
              <code className="text-gray-400">`field.path`</code>
            </span>
          </div>
          <textarea
            value={workspace.state}
            onChange={(e) => setWorkspace((w) => ({ ...w, state: e.target.value }))}
            rows={6}
            placeholder="Text or JSON the questions are about"
            className={`${inputClass} font-mono text-xs resize-y`}
          />
          {state.error && <p className="text-[11px] text-amber-400">{state.error}</p>}
        </section>

        <section className="space-y-3">
          <label className="text-xs font-medium text-gray-400">
            Questions{" "}
            <span className="text-gray-500 font-normal">
              (sent together and answered independently)
            </span>
          </label>
          {workspace.questions.map((q) => (
            <QuestionCard
              key={q.uid}
              q={q}
              answer={answers.get(q.name.trim())}
              stale={stale}
              onChange={(patch) => updateQuestion(q.uid, patch)}
              onRemove={() =>
                setWorkspace((w) => ({
                  ...w,
                  questions: w.questions.filter((x) => x.uid !== q.uid),
                }))
              }
            />
          ))}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TYPE_LABEL) as QuestionType[]).map((type) => (
              <button
                key={type}
                onClick={() => addQuestion(type)}
                title={TYPE_HINT[type]}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-200"
              >
                <Plus size={14} />
                {TYPE_LABEL[type]}
              </button>
            ))}
          </div>
        </section>

        <section className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-gray-950/90 backdrop-blur border-t border-gray-800 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {running ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
              >
                <Square size={12} />
                Stop
              </button>
            ) : (
              <button
                onClick={run}
                disabled={!built.body}
                title="Ctrl+Enter"
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-400 rounded-lg text-white"
              >
                <Scale size={14} />
                Decide
              </button>
            )}
            {running && <Loader2 size={14} className="animate-spin text-gray-400" />}
            {result && !running && (
              <span className="text-xs text-gray-400">
                <span className="font-mono text-gray-200">{result.response.model}</span> ·{" "}
                {result.response.usage?.input_tokens ?? "?"} input tokens · {result.ms} ms
                {stale && <span className="text-amber-400"> · edited since this run</span>}
              </span>
            )}
          </div>
          {!built.body && built.errors.length > 0 && (
            <p className="text-xs text-gray-500">{built.errors.join(" ")}</p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>

        {(built.body || result) && (
          <section className="space-y-2">
            {built.body && <JsonBlock title="Request JSON" value={built.body} />}
            {result && <JsonBlock title="Response JSON" value={result.response} />}
          </section>
        )}
      </div>
    </div>
  );
}
