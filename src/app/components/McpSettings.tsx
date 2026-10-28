"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import { McpServerConfig } from "@/app/lib/types";

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

function ServerRow({ server }: { server: McpServerConfig }) {
  const { config, updateConfig, mcpState, refreshMcpServer } = useApp();
  const [expanded, setExpanded] = useState(false);
  const state = mcpState[server.id];

  const update = (patch: Partial<McpServerConfig>) =>
    updateConfig({
      mcpServers: config.mcpServers.map((s) => (s.id === server.id ? { ...s, ...patch } : s)),
    });

  const remove = () =>
    updateConfig({ mcpServers: config.mcpServers.filter((s) => s.id !== server.id) });

  let status: React.ReactNode = <span className="text-gray-500">off</span>;
  if (server.enabled) {
    if (!state || state.status === "loading") {
      status = <Loader2 size={12} className="animate-spin text-gray-400" />;
    } else if (state.status === "error") {
      status = <span className="text-red-400">error</span>;
    } else {
      status = (
        <span className="text-emerald-400">
          {state.tools.length} tool{state.tools.length === 1 ? "" : "s"}
        </span>
      );
    }
  }

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-lg">
      <div className="flex items-center gap-2 px-2 py-2">
        <input
          type="checkbox"
          checked={server.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
          className="accent-blue-500"
          title={server.enabled ? "Disable server" : "Enable server"}
        />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 min-w-0 flex items-center gap-1 text-left text-sm text-gray-200"
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span className="truncate">{server.name}</span>
        </button>
        <span className="text-[11px] shrink-0">{status}</span>
        <button
          onClick={() => refreshMcpServer(server)}
          disabled={!server.enabled}
          className="p-1 text-gray-400 hover:text-white disabled:opacity-40"
          title="Reconnect and reload tools"
        >
          <RefreshCw size={12} />
        </button>
        <button onClick={remove} className="p-1 text-gray-400 hover:text-red-400" title="Remove">
          <Trash2 size={12} />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 text-[11px]">
          <p className="text-gray-500 break-all">{server.url}</p>
          <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={server.autoApprove}
              onChange={(e) => update({ autoApprove: e.target.checked })}
              className="accent-blue-500"
            />
            Run tools without asking
          </label>
          {server.autoApprove && (
            <p className="text-amber-400/80">
              Tools from this server run as soon as the model asks. Only enable this for
              servers whose tools can&apos;t change or send anything.
            </p>
          )}
          {state?.status === "error" && <p className="text-red-400 break-words">{state.error}</p>}
          {state?.status === "ready" && state.tools.length > 0 && (
            <ul className="space-y-1">
              {state.tools.map((tool) => (
                <li key={tool.name} className="text-gray-300" title={tool.description}>
                  <code className="text-blue-300">{tool.name}</code>
                  {tool.description && (
                    <span className="text-gray-500"> — {tool.description.split("\n")[0]}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function McpSettings() {
  const { config, updateConfig } = useApp();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setAdding(false);
    setName("");
    setUrl("");
    setHeaders("");
    setError(null);
  };

  const add = () => {
    const trimmedUrl = url.trim();
    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    } catch {
      setError("Enter a full http:// or https:// URL.");
      return;
    }
    const server: McpServerConfig = {
      id: makeId(),
      name: name.trim() || new URL(trimmedUrl).hostname,
      url: trimmedUrl,
      headers,
      enabled: true,
      autoApprove: false,
    };
    updateConfig({ mcpServers: [...config.mcpServers, server] });
    reset();
  };

  return (
    <div className="space-y-2">
      {config.mcpServers.length === 0 && !adding && (
        <p className="text-[11px] text-gray-500">
          Add an HTTP MCP server to let the model call its tools. The model must support tool
          calling.
        </p>
      )}

      {config.mcpServers.map((server) => (
        <ServerRow key={server.id} server={server} />
      ))}

      {adding ? (
        <div className="space-y-2 bg-gray-800/60 border border-gray-700 rounded-lg p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. github)"
            className={inputClass}
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/mcp"
            className={inputClass}
          />
          <textarea
            value={headers}
            onChange={(e) => setHeaders(e.target.value)}
            placeholder={"Optional headers, one per line\nAuthorization: Bearer …"}
            rows={2}
            className={`${inputClass} resize-none font-mono text-xs`}
          />
          {error && <p className="text-[11px] text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={add}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
            >
              Add
            </button>
            <button
              onClick={reset}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 border-dashed rounded-lg text-sm text-gray-300"
        >
          <Plus size={14} />
          Add MCP server
        </button>
      )}
    </div>
  );
}
