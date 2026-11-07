"use client";

import { KeyRound, Server } from "lucide-react";
import { useApp } from "@/app/store/AppContext";
import { SecretInput } from "./ConnectionSettings";

/** Connection to TypeSafe's System One API (Jev), separate from the chat connection. */
export function DecisionSettings() {
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
          value={config.decisionBaseUrl}
          onChange={(e) => updateConfig({ decisionBaseUrl: e.target.value })}
          placeholder="https://api.typesafe.ai/v1"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
          <KeyRound size={12} />
          API Key
        </label>
        <SecretInput
          value={config.decisionApiKey}
          onChange={(decisionApiKey) => updateConfig({ decisionApiKey })}
          placeholder="TypeSafe API key"
        />
        <p className="text-[11px] text-gray-500">
          From the{" "}
          <a
            href="https://console.typesafe.ai"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            TypeSafe console
          </a>
          . Stored locally in your browser and sent only to this app&apos;s server.
        </p>
      </div>

      <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={config.decisionLongContext}
          onChange={(e) => updateConfig({ decisionLongContext: e.target.checked })}
          className="accent-blue-500 mt-0.5"
        />
        <span>
          Long context
          <span className="block text-[11px] text-gray-500">
            Raises the limit from 64k to 262k tokens. Slower and less accurate.
          </span>
        </span>
      </label>
    </div>
  );
}
