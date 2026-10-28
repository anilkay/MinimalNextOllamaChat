export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  /** Full data URLs for attached images (e.g. data:image/png;base64,...) */
  images?: string[];
  /** Set when an error interrupted generation for this message */
  error?: string;
}

export interface AppConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  seed: number;
  useSeed: boolean;
  systemPrompt: string;
  useSystemPrompt: boolean;
}
