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

/** Converts internal messages into OpenAI-compatible chat messages. */
function toOpenAiMessages(messages: ChatMessage[], config: AppConfig) {
  const out: Array<{ role: string; content: unknown }> = [];
  if (config.useSystemPrompt && config.systemPrompt.trim()) {
    out.push({ role: "system", content: config.systemPrompt });
  }
  for (const m of messages) {
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

function buildChatBody(config: AppConfig, messages: ChatMessage[], stream: boolean) {
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
  };
}

/** Sends a non-streaming request and delivers the full reply through the same callbacks. */
export async function completeChat(
  config: AppConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: configHeaders(config),
    body: JSON.stringify(buildChatBody(config, messages, false)),
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
}

export async function streamChat(
  config: AppConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: configHeaders(config),
    body: JSON.stringify(buildChatBody(config, messages, true)),
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
        return;
      }
    }
  }
  // The stream may end without a trailing newline (or without `[DONE]`).
  buffer += decoder.decode();
  if (buffer) handleLine(buffer);
  callbacks.onDone();
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
