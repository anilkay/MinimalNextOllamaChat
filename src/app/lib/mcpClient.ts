import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/** Tool results longer than this are cut so one call can't flood the model's context. */
const MAX_RESULT_CHARS = 50_000;

function newClient(): Client {
  return new Client({ name: "minimalnextollamachat", version: "0.1.8" });
}

/**
 * Connects to an HTTP MCP server, runs `fn`, and closes the connection.
 * Tries Streamable HTTP first and falls back to the older HTTP+SSE transport.
 */
export async function withMcpClient<T>(
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
  fn: (client: Client) => Promise<T>,
): Promise<T> {
  const target = new URL(url);
  const requestInit: RequestInit = { headers };

  let client = newClient();
  try {
    await client.connect(new StreamableHTTPClientTransport(target, { requestInit }), {
      signal,
    });
  } catch (streamableError) {
    if (signal.aborted) throw streamableError;
    await client.close().catch(() => {});
    client = newClient();
    try {
      await client.connect(new SSEClientTransport(target, { requestInit }), { signal });
    } catch {
      // Report the Streamable HTTP error: it is the transport current servers use.
      throw streamableError;
    }
  }

  try {
    return await fn(client);
  } finally {
    await client.close().catch(() => {});
  }
}

interface ContentItem {
  type: string;
  text?: string;
  mimeType?: string;
  uri?: string;
  resource?: { uri?: string; text?: string; mimeType?: string };
}

/** Flattens an MCP tool result into the plain text sent back to the model as the tool message. */
export function toolResultToText(result: Record<string, unknown>): string {
  const items = Array.isArray(result.content) ? (result.content as ContentItem[]) : [];
  const parts = items.map((item) => {
    switch (item.type) {
      case "text":
        return item.text ?? "";
      case "image":
        return `[image ${item.mimeType ?? ""} omitted]`;
      case "audio":
        return `[audio ${item.mimeType ?? ""} omitted]`;
      case "resource":
        return item.resource?.text ?? `[resource ${item.resource?.uri ?? ""}]`;
      case "resource_link":
        return `[resource link ${item.uri ?? ""}]`;
      default:
        return `[${item.type} content omitted]`;
    }
  });

  let text = parts.join("\n");
  if (!text && result.structuredContent !== undefined) {
    text = JSON.stringify(result.structuredContent);
  }
  // Servers on the 2024-10-07 protocol return `toolResult` instead of `content`.
  if (!text && result.toolResult !== undefined) {
    text =
      typeof result.toolResult === "string"
        ? result.toolResult
        : JSON.stringify(result.toolResult);
  }
  if (text.length > MAX_RESULT_CHARS) {
    text = `${text.slice(0, MAX_RESULT_CHARS)}\n[truncated ${text.length - MAX_RESULT_CHARS} characters]`;
  }
  return text;
}
