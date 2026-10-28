"use client";

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import { MessageBubble } from "./MessageBubble";

export function MessageList() {
  const { messages } = useApp();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 px-6">
        <Bot size={48} className="mb-4 opacity-20" />
        <p className="text-sm">Configure your connection and start a conversation.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
