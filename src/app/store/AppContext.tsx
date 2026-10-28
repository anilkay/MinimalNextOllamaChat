"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppConfig, ChatMessage, McpServerConfig, McpTool, ToolCall } from "@/app/lib/types";
import { loadConfig, saveConfig } from "@/app/lib/config";
import { completeChat, streamChat } from "@/app/lib/openai";
import { buildToolRegistry, callMcpTool, listMcpTools } from "@/app/lib/mcp";
import { showToast } from "@/app/lib/toast";

/** Upper bound on model → tool → model rounds for one user message. */
const MAX_TOOL_ROUNDS = 10;

export interface McpServerState {
  status: "loading" | "ready" | "error";
  tools: McpTool[];
  error?: string;
}

interface AppContextValue {
  /** Whether replies are streamed token by token (`/chatstream`) or returned whole (`/`). */
  streaming: boolean;
  config: AppConfig;
  updateConfig: (patch: Partial<AppConfig>) => void;
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string, image: File | null) => Promise<void>;
  stop: () => void;
  clearChat: () => void;
  importChat: (messages: ChatMessage[]) => void;
  /** Tool list / connection status per MCP server id. */
  mcpState: Record<string, McpServerState>;
  refreshMcpServer: (server: McpServerConfig) => void;
  /** Answers a pending tool call approval. */
  resolveToolCall: (callId: string, approved: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

/** Identifies the parts of a server config that change its tool list. */
function serverKey(server: McpServerConfig): string {
  return `${server.url}\n${server.headers}`;
}

export function AppProvider({
  streaming,
  children,
}: {
  streaming: boolean;
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mcpState, setMcpState] = useState<Record<string, McpServerState>>({});
  const abortRef = useRef<AbortController | null>(null);
  const approvalsRef = useRef(new Map<string, (approved: boolean) => void>());
  const loadedKeysRef = useRef(new Map<string, string>());

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const updateConfig = useCallback((patch: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const refreshMcpServer = useCallback(async (server: McpServerConfig) => {
    const key = serverKey(server);
    loadedKeysRef.current.set(server.id, key);
    setMcpState((prev) => ({
      ...prev,
      [server.id]: { status: "loading", tools: prev[server.id]?.tools ?? [] },
    }));
    try {
      const tools = await listMcpTools(server);
      // Ignore the result if the server's URL or headers changed meanwhile.
      if (loadedKeysRef.current.get(server.id) !== key) return;
      setMcpState((prev) => ({ ...prev, [server.id]: { status: "ready", tools } }));
    } catch (err) {
      if (loadedKeysRef.current.get(server.id) !== key) return;
      const error = err instanceof Error ? err.message : "Could not connect";
      setMcpState((prev) => ({ ...prev, [server.id]: { status: "error", tools: [], error } }));
    }
  }, []);

  // Load tools for enabled servers when they are added, enabled or edited.
  useEffect(() => {
    for (const server of config.mcpServers) {
      if (!server.enabled) continue;
      if (loadedKeysRef.current.get(server.id) === serverKey(server)) continue;
      refreshMcpServer(server);
    }
  }, [config.mcpServers, refreshMcpServer]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => setMessages([]), []);

  const importChat = useCallback((imported: ChatMessage[]) => {
    setMessages(imported);
  }, []);

  const resolveToolCall = useCallback((callId: string, approved: boolean) => {
    approvalsRef.current.get(callId)?.(approved);
  }, []);

  const waitForApproval = useCallback(
    (callId: string, signal: AbortSignal) =>
      new Promise<boolean>((resolve) => {
        if (signal.aborted) return resolve(false);
        const onAbort = () => {
          approvalsRef.current.delete(callId);
          resolve(false);
        };
        signal.addEventListener("abort", onAbort, { once: true });
        approvalsRef.current.set(callId, (approved) => {
          approvalsRef.current.delete(callId);
          signal.removeEventListener("abort", onAbort);
          resolve(approved);
        });
      }),
    [],
  );

  const sendMessage = useCallback(
    async (text: string, image: File | null) => {
      if (isStreaming) return;

      const trimmed = text.trim();
      if (!trimmed && !image) return;

      if (!config.baseUrl.trim()) {
        showToast("error", "Configure the API base URL in settings first.");
        return;
      }
      if (!config.model.trim()) {
        showToast("error", "Select a model first.");
        return;
      }

      const images: string[] = [];
      if (image) {
        images.push(await fileToDataUrl(image));
      }

      const userMessage: ChatMessage = {
        id: makeId(),
        role: "user",
        content: trimmed,
        images,
      };

      const toolsByServer: Record<string, McpTool[] | undefined> = {};
      for (const [id, state] of Object.entries(mcpState)) {
        if (state.status === "ready") toolsByServer[id] = state.tools;
      }
      const { tools, routes } = buildToolRegistry(config.mcpServers, toolsByServer);

      const updateMessage = (id: string, fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));
      const updateToolCall = (messageId: string, callId: string, patch: Partial<ToolCall>) =>
        updateMessage(messageId, (m) => ({
          ...m,
          toolCalls: m.toolCalls?.map((c) => (c.id === callId ? { ...c, ...patch } : c)),
        }));

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      const { signal } = controller;
      abortRef.current = controller;

      let history: ChatMessage[] = [...messages, userMessage];
      let assistantId = "";

      try {
        const send = streaming ? streamChat : completeChat;

        for (let round = 0; ; round++) {
          assistantId = makeId();
          const currentId = assistantId;
          let content = "";
          let reasoning = "";
          setMessages((prev) => [
            ...prev,
            { id: currentId, role: "assistant", content: "", reasoning: "" },
          ]);

          const result = await send(
            config,
            history,
            {
              onToken: (token) => {
                content += token;
                updateMessage(currentId, (m) => ({ ...m, content: m.content + token }));
              },
              onReasoning: (token) => {
                reasoning += token;
                updateMessage(currentId, (m) => ({
                  ...m,
                  reasoning: (m.reasoning ?? "") + token,
                }));
              },
              onDone: () => {},
            },
            signal,
            // On the last round offer no tools, so the model has to answer in text.
            round < MAX_TOOL_ROUNDS ? tools : [],
          );

          if (result.toolCalls.length === 0) break;
          if (round >= MAX_TOOL_ROUNDS) {
            updateMessage(currentId, (m) => ({
              ...m,
              error: `Stopped after ${MAX_TOOL_ROUNDS} rounds of tool calls.`,
            }));
            break;
          }

          const calls: ToolCall[] = result.toolCalls.map((c) => {
            const route = routes.get(c.name);
            return {
              id: c.id,
              name: c.name,
              arguments: c.arguments,
              serverId: route?.server.id,
              serverName: route?.server.name,
              toolName: route?.tool.name,
              status: "pending",
            };
          });
          updateMessage(currentId, (m) => ({ ...m, toolCalls: calls.map((c) => ({ ...c })) }));

          for (const call of calls) {
            const finish = (status: ToolCall["status"], output: string) => {
              call.status = status;
              call.result = output;
              updateToolCall(currentId, call.id, { status, result: output });
            };

            const route = routes.get(call.name);
            if (!route) {
              finish("error", `Unknown tool "${call.name}".`);
              continue;
            }

            let args: Record<string, unknown>;
            try {
              const parsed = call.arguments.trim() ? JSON.parse(call.arguments) : {};
              args = parsed && typeof parsed === "object" ? parsed : {};
            } catch {
              finish("error", `Invalid JSON arguments: ${call.arguments}`);
              continue;
            }

            if (!route.server.autoApprove) {
              const approved = await waitForApproval(call.id, signal);
              if (signal.aborted) throw new DOMException("Aborted", "AbortError");
              if (!approved) {
                finish("denied", "The user denied this tool call.");
                continue;
              }
            }

            updateToolCall(currentId, call.id, { status: "running" });
            try {
              const output = await callMcpTool(route.server, route.tool.name, args, signal);
              finish(output.isError ? "error" : "done", output.content || "(no output)");
            } catch (err) {
              if (isAbortError(err)) throw err;
              finish("error", `Tool call failed: ${err instanceof Error ? err.message : err}`);
            }
          }

          history = [
            ...history,
            { id: currentId, role: "assistant", content, reasoning, toolCalls: calls },
          ];
        }
      } catch (err) {
        if (isAbortError(err)) {
          // Leave no call waiting for an answer that will never come.
          setMessages((prev) =>
            prev.map((m) =>
              m.toolCalls?.some((c) => c.status === "pending" || c.status === "running")
                ? {
                    ...m,
                    toolCalls: m.toolCalls.map((c) =>
                      c.status === "pending" || c.status === "running"
                        ? { ...c, status: "denied", result: "Cancelled by the user." }
                        : c,
                    ),
                  }
                : m,
            ),
          );
        } else {
          const message = err instanceof Error ? err.message : "Request failed.";
          const failedId = assistantId;
          updateMessage(failedId, (m) => ({ ...m, error: message }));
          showToast("error", message);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [config, messages, isStreaming, streaming, mcpState, waitForApproval],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      streaming,
      config,
      updateConfig,
      messages,
      isStreaming,
      sendMessage,
      stop,
      clearChat,
      importChat,
      mcpState,
      refreshMcpServer,
      resolveToolCall,
    }),
    [
      streaming,
      config,
      updateConfig,
      messages,
      isStreaming,
      sendMessage,
      stop,
      clearChat,
      importChat,
      mcpState,
      refreshMcpServer,
      resolveToolCall,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
