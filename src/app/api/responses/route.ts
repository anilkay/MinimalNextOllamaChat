import { NextRequest } from "next/server";
import { proxyPost } from "@/app/lib/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return proxyPost(request, "/responses");
}
