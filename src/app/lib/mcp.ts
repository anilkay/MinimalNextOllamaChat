import { McpServerConfig, McpTool } from "./types";
import { ChatTool } from "./openai";

/** Parses the `Name: value` header lines the user typed for a server. */
export function parseHeaderLines(text: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const name = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (name && value) headers[name] = value;
  }
  return headers;
}

async function mcpRequest<T>(body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message ?? `MCP request failed (${response.status})`);
  }
  return data as T;
}

export async function listMcpTools(
  server: McpServerConfig,
  signal?: AbortSignal,
): Promise<McpTool[]> {
  const data = await mcpRequest<{ tools: McpTool[] }>(
    { action: "list", url: server.url, headers: parseHeaderLines(server.headers) },
    signal,
  );
  return Array.isArray(data.tools) ? data.tools : [];
}

export async function callMcpTool(
  server: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ content: string; isError: boolean }> {
  return mcpRequest(
    {
      action: "call",
      url: server.url,
      headers: parseHeaderLines(server.headers),
      name: toolName,
      arguments: args,
    },
    signal,
  );
}

/** Where a function name offered to the model routes to. */
export interface ToolRoute {
  server: McpServerConfig;
  tool: McpTool;
}

function slug(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_") || "tool";
}

/**
 * Builds the function list for the model from every enabled server's tools.
 * Names are `<server>__<tool>`, limited to the 64 characters OpenAI allows, and made
 * unique so two servers can expose tools with the same name.
 */
export function buildToolRegistry(
  servers: McpServerConfig[],
  toolsByServer: Record<string, McpTool[] | undefined>,
): { tools: ChatTool[]; routes: Map<string, ToolRoute> } {
  const tools: ChatTool[] = [];
  const routes = new Map<string, ToolRoute>();

  for (const server of servers) {
    if (!server.enabled) continue;
    for (const tool of toolsByServer[server.id] ?? []) {
      const base = `${slug(server.name).slice(0, 20)}__${slug(tool.name)}`.slice(0, 64);
      let name = base;
      for (let n = 2; routes.has(name); n++) {
        name = `${base.slice(0, 60)}_${n}`;
      }
      // `$schema` and similar meta keys are rejected by some providers.
      const { $schema: _schema, ...parameters } = tool.inputSchema ?? {};
      void _schema;
      routes.set(name, { server, tool });
      tools.push({
        type: "function",
        function: {
          name,
          description: tool.description || tool.name,
          parameters: { type: "object", properties: {}, ...parameters },
        },
      });
    }
  }
  return { tools, routes };
}
