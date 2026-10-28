"use client";

import { useState } from "react";
import { Bot, Check, Copy, User } from "lucide-react";
import { ChatMessage } from "@/app/lib/types";
import { Markdown } from "./Markdown";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const showTyping = !isUser && !message.content && !message.error;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isUser ? "bg-blue-600" : "bg-emerald-600"
        }`}
      >
        {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-white" />}
      </div>

      <div className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm ${
            isUser
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-100 border border-gray-700"
          }`}
        >
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- base64 data-URL preview
                <img key={i} src={src} alt="attachment" className="max-h-40 rounded-lg" />
              ))}
            </div>
          )}

          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : showTyping ? (
            <span className="inline-flex items-center gap-1 py-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:120ms]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:240ms]" />
            </span>
          ) : (
            <Markdown content={message.content} />
          )}

          {message.error && <p className="mt-2 text-xs text-red-400">{message.error}</p>}
        </div>

        {!isUser && message.content && (
          <button
            onClick={copy}
            className="mt-1 p-1 text-gray-500 hover:text-gray-300 transition-colors"
            title="Copy"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        )}
      </div>
    </div>
  );
}
