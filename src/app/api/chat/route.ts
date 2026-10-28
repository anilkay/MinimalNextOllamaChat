import { NextRequest } from "next/server";
import { resolveUpstream } from "@/app/lib/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const upstreamConfig = resolveUpstream(request);
  if (!upstreamConfig.ok) return upstreamConfig.response;
  const { baseUrl, headers } = upstreamConfig;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: { message: "Invalid request body." } },
      { status: 400 },
    );
  }

  if (!body.model) {
    return Response.json(
      { error: { message: "No model specified." } },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: request.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return Response.json(
      {
        error: {
          message: aborted
            ? "Request aborted."
            : "Could not reach the API endpoint. Check the base URL and your network.",
        },
      },
      { status: aborted ? 499 : 502 },
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

  const data = await upstream.json();
  return Response.json(data);
}
