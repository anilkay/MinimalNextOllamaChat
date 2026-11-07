import { NextRequest } from "next/server";
import { proxyPost } from "@/app/lib/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** TypeSafe System One (Jev): `POST {baseUrl}/systemone`, retried on 429 / 529. */
export async function POST(request: NextRequest) {
  const longContext = request.headers.get("x-typesafe-long-context") === "true";
  return proxyPost(request, "/systemone", {
    retryStatuses: [429, 529],
    headers: longContext ? { "TypeSafe-Danger-Zone-Long-Context": "true" } : {},
  });
}
