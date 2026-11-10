import { NextRequest } from "next/server";
import { normalizeBaseUrl } from "./config";

type Upstream =
  | { ok: true; baseUrl: string; headers: Record<string, string> }
  | { ok: false; response: Response };

/**
 * Optional comma-separated host allowlist read from `envName`
 * (e.g. `api.openai.com,host.docker.internal:11434`). When unset, any host is allowed,
 * which is fine for local use but lets anyone who can reach a public deployment make
 * the server send requests to arbitrary hosts.
 */
function allowedHosts(envName: string): string[] {
  return (process.env[envName] ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns an error message when `url`'s host is not in the allowlist, otherwise null. */
export function checkHostAllowed(url: string, envName: string): string | null {
  const allowed = allowedHosts(envName);
  if (allowed.length === 0) return null;
  const { host, hostname } = new URL(url);
  if (allowed.includes(host.toLowerCase()) || allowed.includes(hostname.toLowerCase())) {
    return null;
  }
  return `Host "${host}" is not in ${envName}.`;
}

export function errorResponse(message: string, status: number): Response {
  return Response.json({ error: { message } }, { status });
}

/** Passes an upstream JSON body through. A body that is not JSON usually means a wrong base URL. */
export async function forwardJson(upstream: Response): Promise<Response> {
  try {
    return Response.json(JSON.parse(await upstream.text()));
  } catch {
    return errorResponse("The API endpoint did not return JSON. Check the base URL.", 502);
  }
}

/** Reads the upstream base URL and API key headers sent by the browser. */
export function resolveUpstream(request: NextRequest): Upstream {
  const baseUrl = normalizeBaseUrl(request.headers.get("x-api-base-url") ?? "");
  const apiKey = (request.headers.get("x-api-key") ?? "").trim();

  if (!baseUrl) {
    return { ok: false, response: errorResponse("API base URL is not configured.", 400) };
  }

  const blocked = checkHostAllowed(baseUrl, "ALLOWED_API_HOSTS");
  if (blocked) return { ok: false, response: errorResponse(blocked, 403) };

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

interface ProxyOptions {
  /** Upstream statuses retried with backoff (TypeSafe returns 429 and 529 when busy). */
  retryStatuses?: number[];
  /** Extra headers for the upstream request. */
  headers?: Record<string, string>;
}

const MAX_ATTEMPTS = 3;

function retryDelay(response: Response, attempt: number): number {
  const seconds = Number(response.headers.get("retry-after"));
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds, 10) * 1000;
  return 500 * 2 ** attempt;
}

/**
 * Forwards a JSON POST body to `{baseUrl}{path}`. A body with `stream: true` gets the
 * upstream server-sent events piped back unchanged.
 */
export async function proxyPost(
  request: NextRequest,
  path: string,
  options: ProxyOptions = {},
): Promise<Response> {
  const upstreamConfig = resolveUpstream(request);
  if (!upstreamConfig.ok) return upstreamConfig.response;
  const { baseUrl, headers } = upstreamConfig;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Invalid request body.", 400);
  }
  if (!body.model) return errorResponse("No model specified.", 400);

  let upstream: Response;
  try {
    for (let attempt = 0; ; attempt++) {
      upstream = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { ...headers, ...options.headers },
        body: JSON.stringify(body),
        signal: request.signal,
      });
      if (!options.retryStatuses?.includes(upstream.status) || attempt + 1 >= MAX_ATTEMPTS) {
        break;
      }
      await upstream.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, retryDelay(upstream, attempt)));
    }
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return errorResponse(
      aborted
        ? "Request aborted."
        : "Could not reach the API endpoint. Check the base URL and your network.",
      aborted ? 499 : 502,
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(
      text || JSON.stringify({ error: { message: `Upstream error (${upstream.status})` } }),
      { status: upstream.status, headers: { "Content-Type": "application/json" } },
    );
  }

  if (body.stream === true) {
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  return forwardJson(upstream);
}

/** Azure OpenAI / Azure AI Foundry expect the key in an `api-key` header instead of Bearer. */
function usesApiKeyHeader(mode: string | null, baseUrl: string): boolean {
  if (mode === "api-key") return true;
  if (mode === "bearer") return false;
  const { hostname } = new URL(baseUrl);
  return /\.(azure\.com|azure-api\.net)$/i.test(hostname);
}
