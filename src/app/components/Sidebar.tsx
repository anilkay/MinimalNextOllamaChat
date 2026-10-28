"use client";

import { useRef } from "react";
import { Download, Upload, Trash2, Sparkles } from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import { ConnectionSettings } from "./ConnectionSettings";
import { TemperatureSlider } from "./TemperatureSlider";
import { SeedControl } from "./SeedControl";
import { SystemPromptControl } from "./SystemPromptControl";
import { ChatMessage } from "@/app/lib/types";
import { showToast } from "@/app/lib/toast";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {children}
    </h2>
  );
}

function ActionButton({
  icon,
  onClick,
  danger,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-all group ${
        danger ? "text-red-400" : "text-gray-200"
      }`}
    >
      <span className={danger ? "text-red-400" : "text-gray-400 group-hover:text-blue-400 transition-colors"}>
        {icon}
      </span>
      <span>{children}</span>
    </button>
  );
}

export function Sidebar() {
  const { messages, importChat, clearChat } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportChat = () => {
    const data = { exportedAt: new Date().toISOString(), messages };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chat.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        const list: unknown = Array.isArray(parsed) ? parsed : parsed?.messages;
        if (!Array.isArray(list)) throw new Error("bad format");
        const imported = list as ChatMessage[];
        importChat(
          imported.map((m) => ({
            ...m,
            id: m.id ?? Math.random().toString(36).slice(2),
          })),
        );
        showToast("success", "Conversation restored");
      } catch {
        showToast("error", "Could not parse the chat file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <aside className="w-72 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800 flex items-center gap-2">
        <Sparkles size={18} className="text-blue-400" />
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Swift Circuit
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <section className="space-y-3">
          <SectionTitle>Connection</SectionTitle>
          <ConnectionSettings />
        </section>

        <section className="space-y-4">
          <SectionTitle>Generation</SectionTitle>
          <TemperatureSlider />
          <SeedControl />
          <SystemPromptControl />
        </section>

        <section className="space-y-2">
          <SectionTitle>Conversation</SectionTitle>
          <ActionButton icon={<Download size={15} />} onClick={exportChat}>
            Save conversation
          </ActionButton>
          <ActionButton icon={<Upload size={15} />} onClick={() => fileRef.current?.click()}>
            Restore conversation
          </ActionButton>
          <ActionButton
            icon={<Trash2 size={15} />}
            onClick={() => {
              clearChat();
              showToast("info", "Conversation cleared");
            }}
            danger
          >
            Clear conversation
          </ActionButton>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={onImport} />
        </section>
      </div>
    </aside>
  );
}
