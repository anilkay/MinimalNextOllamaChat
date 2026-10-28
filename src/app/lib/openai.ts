import { AppConfig, ChatMessage } from "./types";
import { normalizeBaseUrl } from "./config";

function configHeaders(baseUrl: string, apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-api-base-url": normalizeBaseUrl(baseUrl),
    "x-api-key": apiKey.trim(),
  };
}

/** Converts internal messages into OpenAI-compatible chat messages. */
function toOpenAiMessages(messages: ChatMessage[], config: AppConfig) {
  const out: Array<{ role: string; content: unknown }> = [];
  if (config.useSystemPrompt && config.systemPrompt.trim()) {
    out.push({ role: "system", content: config.systemPrompt });
  }
  for (const m of messages) {
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

export async function streamChat(
  config: AppConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const body = {
    model: config.model,
    messages: toOpenAiMessages(messages, config),
    temperature: config.temperature,
    stream: true,
    ...(config.useSeed ? { seed: config.seed } : {}),
    ...(config.useThinking ? { enable_thinking: true } : {}),
  };

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: configHeaders(config.baseUrl, config.apiKey),
    body: JSON.stringify(body),
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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") {
        callbacks.onDone();
        return;
      }
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
    }
  }
  callbacks.onDone();
}

export async function listModels(
  config: Pick<AppConfig, "baseUrl" | "apiKey">,
): Promise<string[]> {
  const response = await fetch("/api/models", {
    method: "GET",
    headers: configHeaders(config.baseUrl, config.apiKey),
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
