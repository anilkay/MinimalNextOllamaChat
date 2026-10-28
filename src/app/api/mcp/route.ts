import { NextRequest } from "next/server";
import { checkHostAllowed, errorResponse } from "@/app/lib/upstream";
import { toolResultToText, withMcpClient } from "@/app/lib/mcpClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface McpRequestBody {
  action?: unknown;
  url?: unknown;
  headers?: unknown;
  name?: unknown;
  arguments?: unknown;
}

function parseHeaders(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, v] of Object.entries(value)) {
    if (typeof v === "string") out[key] = v;
  }
  return out;
}

/**
 * Proxies MCP requests to HTTP MCP servers.
 * - `{ action: "list", url, headers }` → `{ tools: [{ name, description, inputSchema }] }`
 * - `{ action: "call", url, headers, name, arguments }` → `{ content, isError }`
 */
export async function POST(request: NextRequest) {
  let body: McpRequestBody;
  try {
    body = (await request.json()) as McpRequestBody;
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!/^https?:\/\//i.test(url)) {
    return errorResponse("MCP server URL must start with http:// or https://.", 400);
  }
  try {
    new URL(url);
  } catch {
    return errorResponse("MCP server URL is not valid.", 400);
  }

  const blocked = checkHostAllowed(url, "ALLOWED_MCP_HOSTS");
  if (blocked) return errorResponse(blocked, 403);

  const headers = parseHeaders(body.headers);

  try {
    if (body.action === "list") {
      const tools = await withMcpClient(url, headers, request.signal, async (client) => {
        const all = [];
        let cursor: string | undefined;
        do {
          const page = await client.listTools(cursor ? { cursor } : undefined, {
            signal: request.signal,
          });
          all.push(...page.tools);
          cursor = page.nextCursor;
        } while (cursor);
        return all;
      });
      return Response.json({
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description ?? "",
          inputSchema: t.inputSchema,
        })),
      });
    }

    if (body.action === "call") {
      if (typeof body.name !== "string" || !body.name) {
        return errorResponse("No tool name specified.", 400);
      }
      const args =
        body.arguments && typeof body.arguments === "object"
          ? (body.arguments as Record<string, unknown>)
          : {};
      const name = body.name;
      const result = await withMcpClient(url, headers, request.signal, (client) =>
        client.callTool({ name, arguments: args }, undefined, { signal: request.signal }),
      );
      return Response.json({
        content: toolResultToText(result),
        isError: result.isError === true,
      });
    }

    return errorResponse('Unknown action. Use "list" or "call".', 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : "MCP request failed.";
    return errorResponse(`MCP server error: ${message}`, 502);
  }
}
