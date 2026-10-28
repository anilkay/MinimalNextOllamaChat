"use client";

import { useApp } from "@/app/store/AppContext";

export function SystemPromptControl() {
  const { config, updateConfig } = useApp();

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={config.useSystemPrompt}
          onChange={(e) => updateConfig({ useSystemPrompt: e.target.checked })}
          className="accent-blue-500"
        />
        System prompt
      </label>
      {config.useSystemPrompt && (
        <textarea
          value={config.systemPrompt}
          onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
          rows={3}
          placeholder="You are a helpful assistant."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-y"
        />
      )}
    </div>
  );
}
