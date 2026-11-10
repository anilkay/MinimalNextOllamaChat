import { AppConfig, ChatMessage, ToolCall } from "./types";
import { normalizeBaseUrl } from "./config";

export type ConnectionConfig = Pick<AppConfig, "baseUrl" | "apiKey" | "authHeader">;

export function configHeaders(config: ConnectionConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-base-url": normalizeBaseUrl(config.baseUrl),
    "x-api-key": config.apiKey.trim(),
    "x-api-auth-header": config.authHeader,
  };
}

/** An OpenAI-style function definition offered to the model. */
export interface ChatTool {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

/** A tool call as returned by the model, before it is matched to an MCP server. */
export interface RawToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ChatResult {
  toolCalls: RawToolCall[];
}

/** A parsed server-sent event payload. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- provider payloads are loosely typed
export type SseEvent = Record<string, any>;

type OpenAiMessage = { role: string; content: unknown; [key: string]: unknown };

/** Calls that can be replayed to the model: each one has a result to send back. */
export function finishedCalls(m: ChatMessage): ToolCall[] {
  return (m.toolCalls ?? []).filter(
    (c) => c.status === "done" || c.status === "error" || c.status === "denied",
  );
}

/** Converts internal messages into OpenAI-compatible chat messages. */
function toOpenAiMessages(messages: ChatMessage[], config: AppConfig) {
  const out: OpenAiMessage[] = [];
  if (config.useSystemPrompt && config.systemPrompt.trim()) {
    out.push({ role: "system", content: config.systemPrompt });
  }
  for (const m of messages) {
    // Only finished calls can be replayed: each needs a matching tool result message.
    const calls = finishedCalls(m);
    if (m.role === "assistant" && calls.length > 0) {
      out.push({
        role: "assistant",
        content: m.content || null,
        tool_calls: calls.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.name, arguments: c.arguments || "{}" },
        })),
      });
      for (const c of calls) {
        out.push({ role: "tool", tool_call_id: c.id, content: c.result ?? "" });
      }
      continue;
    }
    // Aborted or failed replies can be left empty; many APIs reject empty assistant turns.
    if (m.role === "assistant" && !m.content.trim()) continue;
    if (m.images && m.images.length > 0) {
      out.push({
        role: m.role,
        content: [
          { type: "text", text: m.content },
          ...m.images.map((img) => ({ type: "image_url", image_url: { url: img } })),
        ],
      });
    } else {
      out.push({ role: m.role, content: m.content });
    }
  }
  return out;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onReasoning?: (token: string) => void;
  onDone: () => void;
}

function buildChatBody(
  config: AppConfig,
  messages: ChatMessage[],
  stream: boolean,
  tools: ChatTool[],
) {
  const reasoning = config.reasoningEffort !== "off";
  return {
    model: config.model,
    messages: toOpenAiMessages(messages, config),
    // Reasoning models (o-series, GPT-5) reject any non-default temperature.
    ...(reasoning
      ? { reasoning_effort: config.reasoningEffort }
      : { temperature: config.temperature }),
    stream,
    ...(config.useSeed ? { seed: config.seed } : {}),
    ...(tools.length > 0 ? { tools } : {}),
  };
}

/** Some providers send arguments as an object instead of a JSON string. */
export function argumentsToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
}

/** Some providers report a failure inside a 200 body or mid-stream as `{error: …}`. */
function payloadError(json: SseEvent | null | undefined): string | null {
  const error = json?.error;
  if (!error) return null;
  if (typeof error === "string") return error;
  return typeof error.message === "string" ? error.message : JSON.stringify(error);
}

export function makeCallId(): string {
  return `call_${Math.random().toString(36).slice(2, 12)}`;
}

/** Sends a non-streaming request and delivers the full reply through the same callbacks. */
export async function completeChat(
  config: AppConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  tools: ChatTool[] = [],
): Promise<ChatResult> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: configHeaders(config),
    body: JSON.stringify(buildChatBody(config, messages, false, tools)),
    signal,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const data = await response.json();
  const failure = payloadError(data);
  if (failure) throw new Error(failure);
  const message = data?.choices?.[0]?.message;
  const content = message?.content;
  const reasoning = message?.reasoning_content ?? message?.reasoning ?? message?.thinking;
  if (typeof reasoning === "string" && reasoning && callbacks.onReasoning) {
    callbacks.onReasoning(reasoning);
  }
  if (typeof content === "string") callbacks.onToken(content);
  callbacks.onDone();

  const rawCalls: Array<{ id?: string; function?: { name?: string; arguments?: unknown } }> =
    Array.isArray(message?.tool_calls) ? message.tool_calls : [];
  return {
    toolCalls: rawCalls
      .filter((c) => typeof c.function?.name === "string" && c.function.name)
      .map((c) => ({
        id: c.id || makeCallId(),
        name: c.function!.name!,
        arguments: argumentsToString(c.function?.arguments),
      })),
  };
}

export async function streamChat(
  config: AppConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  tools: ChatTool[] = [],
): Promise<ChatResult> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: configHeaders(config),
    body: JSON.stringify(buildChatBody(config, messages, true, tools)),
    signal,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  // Tool calls arrive in fragments keyed by `index`; the arguments string is split across chunks.
  const calls: RawToolCall[] = [];

  await readSse(response, (json) => {
    const failure = payloadError(json);
    if (failure) throw new Error(failure);
    const delta = json.choices?.[0]?.delta;
    const content = delta?.content;
    const reasoning = delta?.reasoning_content ?? delta?.reasoning ?? delta?.thinking;
    if (typeof content === "string") callbacks.onToken(content);
    if (typeof reasoning === "string" && callbacks.onReasoning) {
      callbacks.onReasoning(reasoning);
    }
    if (Array.isArray(delta?.tool_calls)) {
      for (const [position, tc] of (delta.tool_calls as Array<Record<string, unknown>>).entries()) {
        const index = typeof tc.index === "number" ? tc.index : position;
        const call = (calls[index] ??= { id: "", name: "", arguments: "" });
        const fn = tc.function as { name?: string; arguments?: unknown } | undefined;
        if (typeof tc.id === "string" && tc.id) call.id = tc.id;
        // The name comes whole in the first fragment; some servers repeat it later.
        if (fn?.name && !call.name) call.name = fn.name;
        call.arguments += argumentsToString(fn?.arguments);
      }
    }
  });

  callbacks.onDone();
  return {
    toolCalls: calls.filter((c) => c && c.name).map((c) => ({ ...c, id: c.id || makeCallId() })),
  };
}

/**
 * Reads a server-sent event stream and passes each JSON `data:` payload to `onEvent`
 * until the stream ends or sends `[DONE]`. Errors thrown by `onEvent` propagate.
 */
export async function readSse(
  response: Response,
  onEvent: (json: SseEvent) => void,
): Promise<void> {
  if (!response.body) throw new Error("Empty response from server");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  /** Handles one SSE line; returns true when the stream signalled `[DONE]`. */
  const handleLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return false;
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") return true;
    let json: unknown;
    try {
      json = JSON.parse(data);
    } catch {
      return false; // Ignore non-JSON keep-alive lines.
    }
    if (json && typeof json === "object") onEvent(json as SseEvent);
    return false;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (handleLine(line)) return;
      }
    }
    // The stream may end without a trailing newline (or without `[DONE]`).
    buffer += decoder.decode();
    if (buffer) handleLine(buffer);
  } finally {
    reader.cancel().catch(() => {});
  }
}

export async function listModels(
  config: ConnectionConfig,
  signal?: AbortSignal,
): Promise<string[]> {
  const response = await fetch("/api/models", {
    method: "GET",
    headers: configHeaders(config),
    signal,
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  const data = await response.json();
  // OpenAI: `{data: [{id}]}`; TypeSafe: `{models: [{name}]}`.
  const items: Array<{ id?: string; name?: string }> = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.models)
      ? data.models
      : [];
  return items.map((m) => m.id ?? m.name).filter((id): id is string => typeof id === "string");
}

export async function extractErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (json?.error?.message) return json.error.message;
    // Ollama's native routes and some proxies send `{error: "…"}`.
    if (typeof json?.error === "string") return json.error;
    if (typeof json?.message === "string") return json.message;
    // FastAPI-style errors (TypeSafe): `{detail: "…"}` or `{detail: [{loc, msg}]}`.
    if (typeof json?.detail === "string") return json.detail;
    if (Array.isArray(json?.detail)) {
      return json.detail
        .map((d: { loc?: unknown[]; msg?: string }) => {
          const where = Array.isArray(d.loc) ? d.loc.filter((p) => p !== "body").join(".") : "";
          return where ? `${where}: ${d.msg}` : d.msg;
        })
        .join("; ");
    }
  } catch {
    // Response body was not JSON.
  }
  return text || `Request failed (${response.status})`;
}
