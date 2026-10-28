import { NextRequest } from "next/server";
import { normalizeBaseUrl } from "./config";

type Upstream =
  | { ok: true; baseUrl: string; headers: Record<string, string> }
  | { ok: false; response: Response };

/**
 * Optional comma-separated host allowlist (e.g. `api.openai.com,host.docker.internal:11434`).
 * When unset, any host is allowed, which is fine for local use but lets anyone who can
 * reach a public deployment make the server send requests to arbitrary hosts.
 */
function allowedHosts(): string[] {
  return (process.env.ALLOWED_API_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: { message } }, { status });
}

/** Reads the upstream base URL and API key headers sent by the browser. */
export function resolveUpstream(request: NextRequest): Upstream {
  const baseUrl = normalizeBaseUrl(request.headers.get("x-api-base-url") ?? "");
  const apiKey = (request.headers.get("x-api-key") ?? "").trim();

  if (!baseUrl) {
    return { ok: false, response: errorResponse("API base URL is not configured.", 400) };
  }

  const allowed = allowedHosts();
  if (allowed.length > 0) {
    const { host, hostname } = new URL(baseUrl);
    if (!allowed.includes(host.toLowerCase()) && !allowed.includes(hostname.toLowerCase())) {
      return {
        ok: false,
        response: errorResponse(`Host "${host}" is not in ALLOWED_API_HOSTS.`, 403),
      };
    }
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    if (usesApiKeyHeader(request.headers.get("x-api-auth-header"), baseUrl)) {
      headers["api-key"] = apiKey;
    } else {
      headers.Authorization = `Bearer ${apiKey}`;
    }
  }
  return { ok: true, baseUrl, headers };
}

/** Azure OpenAI / Azure AI Foundry expect the key in an `api-key` header instead of Bearer. */
function usesApiKeyHeader(mode: string | null, baseUrl: string): boolean {
  if (mode === "api-key") return true;
  if (mode === "bearer") return false;
  const { hostname } = new URL(baseUrl);
  return /\.(azure\.com|azure-api\.net)$/i.test(hostname);
}
