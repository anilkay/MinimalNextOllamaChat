"use client";

import { useApp } from "@/app/store/AppContext";

export function ThinkingControl() {
  const { config, updateConfig } = useApp();

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={config.useThinking}
          onChange={(e) => updateConfig({ useThinking: e.target.checked })}
          className="accent-blue-500"
        />
        Thinking
      </label>
      <p className="text-[11px] text-gray-500">
        Sends <code className="text-gray-400">enable_thinking</code> for thinking-capable models
        (DeepSeek, Qwen, …).
      </p>
    </div>
  );
}
