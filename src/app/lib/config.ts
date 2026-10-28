import { AppConfig } from "./types";

const STORAGE_KEY = "minimalnextollamachat.config";

export const DEFAULT_CONFIG: AppConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  authHeader: "auto",
  model: "",
  temperature: 0.7,
  seed: 0,
  useSeed: false,
  systemPrompt: "",
  useSystemPrompt: false,
  reasoningEffort: "off",
  mcpServers: [],
};

const LOCAL_HOST_PATTERN =
  /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\]|host\.docker\.internal|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[^.:/]+\.local)(:\d+)?(\/|$)/i;

/**
 * Normalizes a user-supplied base URL into an OpenAI-compatible root:
 * trims slashes, adds the protocol when missing (http for local hosts,
 * https otherwise), and appends `/v1` only when no path was given.
 */
export function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) {
    url = `${LOCAL_HOST_PATTERN.test(url) ? "http" : "https"}://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/" || parsed.pathname === "") url += "/v1";
  } catch {
    return "";
  }
  return url;
}

export function loadConfig(): AppConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CONFIG };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AppConfig> & {
      useThinking?: boolean;
    };
    const config: AppConfig = { ...DEFAULT_CONFIG, ...parsed };
    if (!Array.isArray(config.mcpServers)) config.mcpServers = [];
    // Migrate the older `useThinking` boolean to a reasoning effort level.
    if (!parsed.reasoningEffort && parsed.useThinking) {
      config.reasoningEffort = "medium";
    }
    return config;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: AppConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}
