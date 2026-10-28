export type Role = "system" | "user" | "assistant";

export type ReasoningEffort = "off" | "low" | "medium" | "high";

/**
 * How the API key is sent upstream: `Authorization: Bearer` (OpenAI and most providers)
 * or `api-key` (Azure OpenAI / Azure AI Foundry). `auto` picks `api-key` for Azure hosts.
 */
export type AuthHeader = "auto" | "bearer" | "api-key";

export type ToolCallStatus = "pending" | "running" | "done" | "error" | "denied";

/** A tool call the model made, with its outcome. Stored on the assistant message that made it. */
export interface ToolCall {
  /** Upstream tool call id, echoed back as `tool_call_id`. */
  id: string;
  /** Function name the model used (`<server>__<tool>`). */
  name: string;
  /** JSON-encoded arguments as produced by the model. */
  arguments: string;
  serverId?: string;
  serverName?: string;
  toolName?: string;
  status: ToolCallStatus;
  /** Text sent back to the model as the tool message. */
  result?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Accumulated reasoning/thinking text (display-only, never sent back to the API). */
  reasoning?: string;
  /** Full data URLs for attached images (e.g. data:image/png;base64,...) */
  images?: string[];
  /** Tool calls requested by the model in this assistant turn. */
  toolCalls?: ToolCall[];
  /** Set when an error interrupted generation for this message */
  error?: string;
}

/** An HTTP MCP server the user added (Streamable HTTP, with SSE fallback). */
export interface McpServerConfig {
  id: string;
  name: string;
  url: string;
  /** Extra request headers, one `Name: value` per line (e.g. `Authorization: Bearer …`). */
  headers: string;
  enabled: boolean;
  /** Run this server's tools without asking first. */
  autoApprove: boolean;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AppConfig {
  baseUrl: string;
  apiKey: string;
  authHeader: AuthHeader;
  model: string;
  temperature: number;
  seed: number;
  useSeed: boolean;
  systemPrompt: string;
  useSystemPrompt: boolean;
  reasoningEffort: ReasoningEffort;
  mcpServers: McpServerConfig[];
}
