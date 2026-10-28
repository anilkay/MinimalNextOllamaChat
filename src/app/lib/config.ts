import { AppConfig } from "./types";

const STORAGE_KEY = "swift-circuit.config";

export const DEFAULT_CONFIG: AppConfig = {
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "",
  temperature: 0.7,
  seed: 0,
  useSeed: false,
  systemPrompt: "",
  useSystemPrompt: false,
};

/**
 * Normalizes a user-supplied base URL into an OpenAI-compatible root:
 * trims slashes, adds the protocol when missing, and appends `/v1` when absent.
 */
export function normalizeBaseUrl(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  if (!url) return "";
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  if (!url.endsWith("/v1")) url += "/v1";
  return url;
}

export function loadConfig(): AppConfig {
  if (typeof window === "undefined") return { ...DEFAULT_CONFIG };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<AppConfig>) };
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
