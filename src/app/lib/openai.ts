import { AppConfig, ChatMessage } from "./types";
import { normalizeBaseUrl } from "./config";

export type ConnectionConfig = Pick<AppConfig, "baseUrl" | "apiKey" | "authHeader">;

function configHeaders(config: ConnectionConfig): Record<string, string> {
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

type OpenAiMessage = { role: string; content: unknown; [key: string]: unknown };

/** Converts internal messages into OpenAI-compatible chat messages. */
function toOpenAiMessages(messages: ChatMessage[], config: AppConfig) {
  const out: OpenAiMessage[] = [];
  if (config.useSystemPrompt && config.systemPrompt.trim()) {
    out.push({ role: "system", content: config.systemPrompt });
  }
  for (const m of messages) {
    // Only finished calls can be replayed: each needs a matching tool result message.
    const calls = (m.toolCalls ?? []).filter(
      (c) => c.status === "done" || c.status === "error" || c.status === "denied",
    );
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
function argumentsToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
}

function makeCallId(): string {
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
  if (!response.body) {
    throw new Error("Empty response from server");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // Tool calls arrive in fragments keyed by `index`; the arguments string is split across chunks.
  const calls: RawToolCall[] = [];
  const result = (): ChatResult => ({
    toolCalls: calls
      .filter((c) => c && c.name)
      .map((c) => ({ ...c, id: c.id || makeCallId() })),
  });

  /** Handles one SSE line; returns true when the stream signalled `[DONE]`. */
  const handleLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return false;
    const data = trimmed.slice(5).trim();
    if (data === "[DONE]") return true;
    try {
      const json = JSON.parse(data);
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
    } catch {
      // Ignore non-JSON keep-alive lines.
    }
    return false;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (handleLine(line)) {
        callbacks.onDone();
        return result();
      }
    }
  }
  // The stream may end without a trailing newline (or without `[DONE]`).
  buffer += decoder.decode();
  if (buffer) handleLine(buffer);
  callbacks.onDone();
  return result();
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
  const items: Array<{ id?: string }> = Array.isArray(data?.data) ? data.data : [];
  return items
    .map((m) => m.id)
    .filter((id): id is string => typeof id === "string");
}

async function extractErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (json?.error?.message) return json.error.message;
    if (typeof json?.message === "string") return json.message;
  } catch {
    // Response body was not JSON.
  }
  return text || `Request failed (${response.status})`;
}
