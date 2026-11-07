import { ConnectionConfig, configHeaders, extractErrorMessage } from "./openai";

export interface EmbeddingResult {
  /** The model that answered, as reported by the server. */
  model: string;
  /** One vector per input, in input order. */
  vectors: number[][];
  promptTokens?: number;
}

/** Calls `POST {baseUrl}/embeddings` with several inputs at once. */
export async function createEmbeddings(
  connection: ConnectionConfig,
  model: string,
  inputs: string[],
  dimensions: number,
  signal?: AbortSignal,
): Promise<EmbeddingResult> {
  const response = await fetch("/api/embeddings", {
    method: "POST",
    headers: configHeaders(connection),
    body: JSON.stringify({
      model,
      input: inputs,
      ...(dimensions > 0 ? { dimensions } : {}),
    }),
    signal,
  });
  if (!response.ok) throw new Error(await extractErrorMessage(response));

  const data = await response.json();
  const items: Array<{ embedding?: unknown; index?: number }> = Array.isArray(data?.data)
    ? data.data
    : [];
  const vectors = [...items]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((item) => item.embedding);
  if (vectors.length !== inputs.length || !vectors.every(isNumberArray)) {
    throw new Error("The server did not return one embedding per input.");
  }
  return {
    model: typeof data.model === "string" ? data.model : model,
    vectors,
    promptTokens: data.usage?.prompt_tokens,
  };
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((n) => typeof n === "number");
}

export function norm(v: number[]): number {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
}

/** Cosine similarity; 0 when either vector is all zeros. */
export function cosine(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < length; i++) dot += a[i] * b[i];
  const denominator = norm(a) * norm(b);
  return denominator === 0 ? 0 : dot / denominator;
}
