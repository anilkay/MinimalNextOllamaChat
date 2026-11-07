import { AppConfig } from "./types";
import { configHeaders, extractErrorMessage } from "./openai";

/**
 * TypeSafe System One API (Jev): `POST {baseUrl}/systemone` answers typed questions
 * about a piece of state with probabilities instead of generated text.
 * https://docs.typesafe.ai/api
 */

export type QuestionType = "choice" | "noul" | "score";

export interface ChoiceOption {
  name: string;
  /** Optional; when empty the option name alone is used. */
  description: string;
}

/** A question as edited in the UI. Only the fields for its `type` are sent. */
export interface DecisionQuestion {
  /** Stable React key; not sent. */
  uid: string;
  /** Answer key in the request and response; not shown to the model. */
  name: string;
  type: QuestionType;
  instructions: string;
  options: ChoiceOption[];
  /** Score levels, lowest first. */
  levels: string[];
  trueMeans: string;
  falseMeans: string;
}

export interface DecisionWorkspace {
  /** Plain text, or JSON (an object or array) that is sent as structured state. */
  state: string;
  questions: DecisionQuestion[];
}

export type Answer =
  | { type: "noul"; noul: number }
  | {
      type: "choice";
      choice: string;
      confidence: number;
      probabilities: Record<string, number>;
    }
  | {
      type: "score";
      score: number;
      confidence: number;
      legend: Record<string, unknown>;
      probabilities: Record<string, number>;
    };

export interface SystemOneResponse {
  model: string;
  answers: Record<string, Answer>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

export const MAX_CHOICE_OPTIONS = 255;
export const MAX_SCORE_LEVELS = 10;

/** Parses the state as JSON when it looks like an object or array, else keeps the text. */
export function parseState(raw: string): { value: unknown; isJson: boolean; error?: string } {
  const trimmed = raw.trim();
  if (!/^[[{]/.test(trimmed)) return { value: raw, isJson: false };
  try {
    return { value: JSON.parse(trimmed), isJson: true };
  } catch (err) {
    return {
      value: raw,
      isJson: false,
      error: `Looks like JSON but does not parse (${err instanceof Error ? err.message : err}). It will be sent as text.`,
    };
  }
}

/** Builds the request body, or returns what is missing. */
export function buildSystemOneRequest(
  workspace: DecisionWorkspace,
  model: string,
): { body?: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  if (!model.trim()) errors.push("Select a model.");
  if (!workspace.state.trim()) errors.push("State is empty.");
  if (workspace.questions.length === 0) errors.push("Add at least one question.");

  const questions: Record<string, unknown> = {};
  for (const [i, q] of workspace.questions.entries()) {
    const name = q.name.trim();
    const label = name || `Question ${i + 1}`;
    if (!name) {
      errors.push(`${label}: give it a name.`);
      continue;
    }
    if (name in questions) {
      errors.push(`${label}: the name is used twice.`);
      continue;
    }
    const instructions = q.instructions.trim() ? { instructions: q.instructions.trim() } : {};

    if (q.type === "choice") {
      const options = q.options.filter((o) => o.name.trim());
      const names = options.map((o) => o.name.trim());
      if (options.length === 0) errors.push(`${label}: add at least one option.`);
      if (options.length > MAX_CHOICE_OPTIONS) {
        errors.push(`${label}: at most ${MAX_CHOICE_OPTIONS} options.`);
      }
      if (new Set(names).size !== names.length) errors.push(`${label}: option names repeat.`);
      questions[name] = {
        type: "choice",
        ...instructions,
        criteria: Object.fromEntries(
          options.map((o) => [o.name.trim(), o.description.trim() || null]),
        ),
      };
    } else if (q.type === "score") {
      const levels = q.levels.map((l) => l.trim());
      if (levels.length < 2) errors.push(`${label}: add at least two levels.`);
      if (levels.length > MAX_SCORE_LEVELS) {
        errors.push(`${label}: at most ${MAX_SCORE_LEVELS} levels.`);
      }
      if (levels.some((l) => !l)) errors.push(`${label}: every level needs a description.`);
      questions[name] = { type: "score", ...instructions, criteria: levels };
    } else {
      const criteria: Record<string, string> = {};
      if (q.trueMeans.trim()) criteria.true = q.trueMeans.trim();
      if (q.falseMeans.trim()) criteria.false = q.falseMeans.trim();
      if (!q.instructions.trim() && !criteria.true) {
        errors.push(`${label}: describe the condition to check.`);
      }
      questions[name] = {
        type: "noul",
        ...instructions,
        ...(Object.keys(criteria).length > 0 ? { criteria } : {}),
      };
    }
  }

  if (errors.length > 0) return { errors };
  return {
    body: { model: model.trim(), state: parseState(workspace.state).value, questions },
    errors,
  };
}

export async function runSystemOne(
  config: AppConfig,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<SystemOneResponse> {
  const response = await fetch("/api/systemone", {
    method: "POST",
    headers: {
      ...configHeaders({
        baseUrl: config.decisionBaseUrl,
        apiKey: config.decisionApiKey,
        authHeader: "bearer",
      }),
      "x-typesafe-long-context": String(config.decisionLongContext),
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw new Error(await extractErrorMessage(response));
  const data = (await response.json()) as SystemOneResponse;
  if (!data || typeof data.answers !== "object") {
    throw new Error("Unexpected response from the System One API.");
  }
  return data;
}
