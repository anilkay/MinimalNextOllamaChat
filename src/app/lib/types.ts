export type Role = "system" | "user" | "assistant";

export type ReasoningEffort = "off" | "low" | "medium" | "high";

/**
 * How the API key is sent upstream: `Authorization: Bearer` (OpenAI and most providers)
 * or `api-key` (Azure OpenAI / Azure AI Foundry). `auto` picks `api-key` for Azure hosts.
 */
export type AuthHeader = "auto" | "bearer" | "api-key";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Accumulated reasoning/thinking text (display-only, never sent back to the API). */
  reasoning?: string;
  /** Full data URLs for attached images (e.g. data:image/png;base64,...) */
  images?: string[];
  /** Set when an error interrupted generation for this message */
  error?: string;
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
}
