import { NextRequest } from "next/server";
import { normalizeBaseUrl } from "@/app/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = normalizeBaseUrl(request.headers.get("x-api-base-url") ?? "");
  const apiKey = (request.headers.get("x-api-key") ?? "").trim();

  if (!baseUrl) {
    return Response.json(
      { error: { message: "API base URL is not configured." } },
      { status: 400 },
    );
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

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
