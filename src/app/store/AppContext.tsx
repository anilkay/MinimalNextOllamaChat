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
import { AppConfig, ChatMessage } from "@/app/lib/types";
import { loadConfig, saveConfig } from "@/app/lib/config";
import { streamChat } from "@/app/lib/openai";
import { showToast } from "@/app/lib/toast";

interface AppContextValue {
  config: AppConfig;
  updateConfig: (patch: Partial<AppConfig>) => void;
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string, image: File | null) => Promise<void>;
  stop: () => void;
  clearChat: () => void;
  importChat: (messages: ChatMessage[]) => void;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(() => loadConfig());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const updateConfig = useCallback((patch: Partial<AppConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => setMessages([]), []);

  const importChat = useCallback((imported: ChatMessage[]) => {
    setMessages(imported);
  }, []);

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

      const assistantId = makeId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        reasoning: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat(
          config,
          [...messages, userMessage],
          {
            onToken: (token) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + token } : m,
                ),
              );
            },
            onReasoning: (token) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, reasoning: (m.reasoning ?? "") + token }
                    : m,
                ),
              );
            },
            onDone: () => {},
          },
          controller.signal,
        );
      } catch (err) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (!isAbort) {
          const message =
            err instanceof Error ? err.message : "Request failed.";
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, error: message } : m)),
          );
          showToast("error", message);
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [config, messages, isStreaming],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      config,
      updateConfig,
      messages,
      isStreaming,
      sendMessage,
      stop,
      clearChat,
      importChat,
    }),
    [config, updateConfig, messages, isStreaming, sendMessage, stop, clearChat, importChat],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
