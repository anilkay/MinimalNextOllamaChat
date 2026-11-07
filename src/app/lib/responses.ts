import { AppConfig, ChatMessage } from "./types";
import {
  ChatResult,
  ChatTool,
  RawToolCall,
  SseEvent,
  StreamCallbacks,
  argumentsToString,
  configHeaders,
  extractErrorMessage,
  finishedCalls,
  makeCallId,
  readSse,
} from "./openai";

/**
 * OpenAI Responses API (`POST {baseUrl}/responses`), used when the connection's API
 * style is "responses". Requests are stateless: the whole conversation is sent as
 * `input` each time and `store` is off, the same as with Chat Completions.
 */

type InputItem = Record<string, unknown>;

/** Converts internal messages into Responses API input items. */
function toResponsesInput(messages: ChatMessage[]): InputItem[] {
  const input: InputItem[] = [];
  for (const m of messages) {
    if (m.role === "assistant") {
      // Aborted or failed replies can be left empty; skip those turns.
      if (m.content.trim()) input.push({ role: "assistant", content: m.content });
      const calls = finishedCalls(m);
      for (const c of calls) {
        input.push({
          type: "function_call",
          call_id: c.id,
          name: c.name,
          arguments: c.arguments || "{}",
        });
      }
      for (const c of calls) {
        input.push({ type: "function_call_output", call_id: c.id, output: c.result ?? "" });
      }
      continue;
    }
    if (m.images && m.images.length > 0) {
      input.push({
        role: m.role,
        content: [
          { type: "input_text", text: m.content },
          ...m.images.map((img) => ({ type: "input_image", image_url: img })),
        ],
      });
    } else {
      input.push({ role: m.role, content: m.content });
    }
  }
  return input;
}

function buildResponsesBody(
  config: AppConfig,
  messages: ChatMessage[],
  stream: boolean,
  tools: ChatTool[],
) {
  const reasoning = config.reasoningEffort !== "off";
  const instructions =
    config.useSystemPrompt && config.systemPrompt.trim() ? config.systemPrompt : undefined;
  return {
    model: config.model,
    input: toResponsesInput(messages),
    ...(instructions ? { instructions } : {}),
    // Reasoning models reject a non-default temperature, as with Chat Completions.
    ...(reasoning
      ? { reasoning: { effort: config.reasoningEffort, summary: "auto" } }
      : { temperature: config.temperature }),
    stream,
    store: false,
    // Responses API tools are flat and strict by default; MCP schemas are rarely strict-ready.
    ...(tools.length > 0
      ? {
          tools: tools.map((t) => ({
            type: "function",
            name: t.function.name,
            description: t.function.description,
            parameters: t.function.parameters,
            strict: false,
          })),
        }
      : {}),
  };
}

/**
 * Posts to `/api/responses`. Some accounts and servers refuse reasoning summaries; in
 * that case the request is sent again without asking for one.
 */
async function postResponses(
  config: AppConfig,
  body: ReturnType<typeof buildResponsesBody>,
  signal: AbortSignal,
): Promise<Response> {
  const send = (payload: object) =>
    fetch("/api/responses", {
      method: "POST",
      headers: configHeaders(config),
      body: JSON.stringify(payload),
      signal,
    });

  let response = await send(body);
  if (!response.ok && response.status === 400 && "reasoning" in body) {
    const message = await extractErrorMessage(response.clone());
    if (/summar/i.test(message)) {
      response = await send({ ...body, reasoning: { effort: body.reasoning.effort } });
    }
  }
  if (!response.ok) throw new Error(await extractErrorMessage(response));
  return response;
}

function toRawCall(item: SseEvent): RawToolCall {
  return {
    id: item.call_id || item.id || makeCallId(),
    name: typeof item.name === "string" ? item.name : "",
    arguments: argumentsToString(item.arguments),
  };
}

export async function completeResponses(
  config: AppConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  tools: ChatTool[] = [],
): Promise<ChatResult> {
  const response = await postResponses(
    config,
    buildResponsesBody(config, messages, false, tools),
    signal,
  );
  const data = await response.json();
  if (data?.error?.message) throw new Error(data.error.message);

  let text = "";
  let reasoning = "";
  const toolCalls: RawToolCall[] = [];
  for (const item of Array.isArray(data?.output) ? (data.output as SseEvent[]) : []) {
    if (item.type === "message") {
      for (const part of Array.isArray(item.content) ? item.content : []) {
        if (part.type === "output_text") text += part.text ?? "";
        else if (part.type === "refusal") text += part.refusal ?? "";
      }
    } else if (item.type === "reasoning") {
      // OpenAI returns a summary; open-weight servers (gpt-oss) return the full text.
      const parts = [
        ...(Array.isArray(item.summary) ? item.summary : []),
        ...(Array.isArray(item.content) ? item.content : []),
      ];
      for (const part of parts) {
        if (typeof part.text === "string") reasoning += (reasoning ? "\n\n" : "") + part.text;
      }
    } else if (item.type === "function_call") {
      toolCalls.push(toRawCall(item));
    }
  }

  if (reasoning && callbacks.onReasoning) callbacks.onReasoning(reasoning);
  if (text) callbacks.onToken(text);
  callbacks.onDone();
  return { toolCalls: toolCalls.filter((c) => c.name) };
}

export async function streamResponses(
  config: AppConfig,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  tools: ChatTool[] = [],
): Promise<ChatResult> {
  const response = await postResponses(
    config,
    buildResponsesBody(config, messages, true, tools),
    signal,
  );

  // Function calls are output items; their arguments stream as separate delta events.
  const calls = new Map<number | string, RawToolCall>();
  const keyOf = (json: SseEvent) =>
    typeof json.output_index === "number" ? json.output_index : String(json.item_id ?? "");

  await readSse(response, (json) => {
    switch (json.type) {
      case "response.output_text.delta":
      case "response.refusal.delta":
        if (typeof json.delta === "string") callbacks.onToken(json.delta);
        break;
      case "response.reasoning_summary_text.delta":
      case "response.reasoning_text.delta":
        if (typeof json.delta === "string") callbacks.onReasoning?.(json.delta);
        break;
      case "response.reasoning_summary_part.added":
        if (typeof json.summary_index === "number" && json.summary_index > 0) {
          callbacks.onReasoning?.("\n\n");
        }
        break;
      case "response.output_item.added":
      case "response.output_item.done":
        if (json.item?.type === "function_call") {
          const call = toRawCall(json.item);
          const existing = calls.get(keyOf(json));
          // `added` usually has empty arguments; keep what the deltas built until `done`.
          if (existing && !call.arguments) call.arguments = existing.arguments;
          calls.set(keyOf(json), call);
        }
        break;
      case "response.function_call_arguments.delta": {
        const call = calls.get(keyOf(json));
        if (call && typeof json.delta === "string") call.arguments += json.delta;
        break;
      }
      case "response.function_call_arguments.done": {
        const call = calls.get(keyOf(json));
        if (call && typeof json.arguments === "string") call.arguments = json.arguments;
        break;
      }
      case "response.failed":
        throw new Error(json.response?.error?.message ?? "The response failed.");
      case "error":
        throw new Error(json.message ?? json.error?.message ?? "The stream reported an error.");
    }
  });

  callbacks.onDone();
  return {
    toolCalls: [...calls.entries()]
      .sort(([a], [b]) => (typeof a === "number" && typeof b === "number" ? a - b : 0))
      .map(([, call]) => call)
      .filter((c) => c.name),
  };
}
