import { NextRequest } from "next/server";
import { resolveUpstream } from "@/app/lib/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const upstreamConfig = resolveUpstream(request);
  if (!upstreamConfig.ok) return upstreamConfig.response;
  const { baseUrl, headers } = upstreamConfig;

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/models`, {
      headers,
      signal: request.signal,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: { message: "Could not reach the API endpoint. Check the base URL and your network." } },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(
      text || JSON.stringify({ error: { message: `Upstream error (${upstream.status})` } }),
      { status: upstream.status, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = await upstream.json();
  return Response.json(data);
}
