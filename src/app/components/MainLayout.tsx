"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ModelSelect } from "./ModelSelect";
import { useApp } from "@/app/store/AppContext";
import { Page } from "@/app/lib/types";

export const NAV: { page: Page; href: string; label: string }[] = [
  { page: "chat", href: "/", label: "Chat" },
  { page: "chatstream", href: "/chatstream", label: "Stream" },
  { page: "embeddings", href: "/embeddings", label: "Embeddings" },
  { page: "decide", href: "/decide", label: "Decide" },
];

function HeaderModelSelect({ page }: { page: Page }) {
  const { config, updateConfig } = useApp();
  if (page === "decide") {
    return (
      <ModelSelect
        key="decision"
        connection={{
          baseUrl: config.decisionBaseUrl,
          apiKey: config.decisionApiKey,
          authHeader: "bearer",
        }}
        value={config.decisionModel}
        onChange={(decisionModel) => updateConfig({ decisionModel })}
      />
    );
  }
  const connection = {
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    authHeader: config.authHeader,
  };
  if (page === "embeddings") {
    return (
      <ModelSelect
        connection={connection}
        value={config.embeddingModel}
        onChange={(embeddingModel) => updateConfig({ embeddingModel })}
      />
    );
  }
  return (
    <ModelSelect
      connection={connection}
      value={config.model}
      onChange={(model) => updateConfig({ model })}
    />
  );
}

export function MainLayout({ page, children }: { page: Page; children: React.ReactNode }) {
  const { clearChat } = useApp();
  const isChat = page === "chat" || page === "chatstream";

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <ToastContainer theme="dark" position="bottom-right" />

      <Sidebar page={page} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between gap-3 px-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <HeaderModelSelect page={page} />
          <div className="flex items-center gap-2 min-w-0">
            <nav className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-0.5 overflow-x-auto">
              {NAV.map((item) => (
                <Link
                  key={item.page}
                  href={item.href}
                  className={`px-3 py-1 text-sm rounded-md whitespace-nowrap transition-colors ${
                    item.page === page
                      ? "bg-gray-700 text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {isChat && (
              <button
                onClick={clearChat}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-200 whitespace-nowrap transition-colors"
              >
                <Plus size={14} />
                New chat
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}
