"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Server } from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import { ApiStyle, AuthHeader } from "@/app/lib/types";

/** A password field with a show/hide toggle, for API keys. */
export function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 pr-9 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      />
      <button
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
        title={show ? "Hide key" : "Show key"}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

export function ConnectionSettings({ showChatApi = true }: { showChatApi?: boolean }) {
  const { config, updateConfig } = useApp();

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
          <Server size={12} />
          Base URL
        </label>
        <input
          type="text"
          value={config.baseUrl}
          onChange={(e) => updateConfig({ baseUrl: e.target.value })}
          placeholder="https://api.openai.com/v1"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
        <p className="text-[11px] text-gray-500">
          Any OpenAI-compatible endpoint (OpenAI, OpenRouter, Groq, LM Studio, Ollama /v1, …).
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
          <KeyRound size={12} />
          API Key
        </label>
        <SecretInput
          value={config.apiKey}
          onChange={(apiKey) => updateConfig({ apiKey })}
          placeholder="sk-…"
        />
        <p className="text-[11px] text-gray-500">
          Stored locally in your browser and sent only to this app&apos;s server.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400">Key header</label>
        <select
          value={config.authHeader}
          onChange={(e) => updateConfig({ authHeader: e.target.value as AuthHeader })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        >
          <option value="auto" className="bg-gray-800 text-gray-200">
            Auto
          </option>
          <option value="bearer" className="bg-gray-800 text-gray-200">
            Authorization: Bearer
          </option>
          <option value="api-key" className="bg-gray-800 text-gray-200">
            api-key (Azure / Foundry)
          </option>
        </select>
        <p className="text-[11px] text-gray-500">
          Auto uses <code className="text-gray-400">api-key</code> for *.azure.com hosts, Bearer
          otherwise.
        </p>
      </div>

      {showChatApi && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400">Chat API</label>
          <select
            value={config.apiStyle}
            onChange={(e) => updateConfig({ apiStyle: e.target.value as ApiStyle })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="chat" className="bg-gray-800 text-gray-200">
              Chat Completions
            </option>
            <option value="responses" className="bg-gray-800 text-gray-200">
              Responses
            </option>
          </select>
          <p className="text-[11px] text-gray-500">
            <code className="text-gray-400">
              {config.apiStyle === "responses" ? "/responses" : "/chat/completions"}
            </code>
            . Responses is supported by OpenAI, Azure / Foundry, Ollama, LM Studio and vLLM.
          </p>
        </div>
      )}
    </div>
  );
}
