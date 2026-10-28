"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Loader2, Wrench, X } from "lucide-react";
import { ToolCall } from "@/app/lib/types";
import { useApp } from "@/app/store/AppContext";

const STATUS_STYLE: Record<ToolCall["status"], { label: string; className: string }> = {
  pending: { label: "waiting for approval", className: "text-amber-400" },
  running: { label: "running", className: "text-blue-400" },
  done: { label: "done", className: "text-emerald-400" },
  error: { label: "error", className: "text-red-400" },
  denied: { label: "denied", className: "text-gray-500" },
};

function prettyArguments(raw: string): string {
  if (!raw.trim()) return "{}";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function ToolCallCard({ call }: { call: ToolCall }) {
  const { resolveToolCall } = useApp();
  const [showResult, setShowResult] = useState(false);
  const status = STATUS_STYLE[call.status];
  const title = call.toolName
    ? `${call.serverName ?? "?"} › ${call.toolName}`
    : call.name;

  return (
    <div className="my-2 rounded-lg border border-gray-700 bg-gray-900/60 text-xs">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700/70">
        <Wrench size={12} className="text-gray-400 shrink-0" />
        <span className="font-mono text-gray-200 truncate">{title}</span>
        <span className={`ml-auto shrink-0 flex items-center gap-1 ${status.className}`}>
          {call.status === "running" && <Loader2 size={11} className="animate-spin" />}
          {status.label}
        </span>
      </div>

      <pre className="px-3 py-2 overflow-x-auto max-h-48 text-gray-300 font-mono whitespace-pre-wrap break-all">
        {prettyArguments(call.arguments)}
      </pre>

      {call.status === "pending" && (
        <div className="flex gap-2 px-3 pb-3">
          <button
            onClick={() => resolveToolCall(call.id, true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-md text-white"
          >
            <Check size={12} />
            Run
          </button>
          <button
            onClick={() => resolveToolCall(call.id, false)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200"
          >
            <X size={12} />
            Deny
          </button>
        </div>
      )}

      {call.result !== undefined && call.status !== "pending" && (
        <div className="border-t border-gray-700/70">
          <button
            onClick={() => setShowResult((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-gray-200"
          >
            {showResult ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            Result
          </button>
          {showResult && (
            <pre className="px-3 pb-2 overflow-auto max-h-72 text-gray-400 font-mono whitespace-pre-wrap break-words">
              {call.result}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
