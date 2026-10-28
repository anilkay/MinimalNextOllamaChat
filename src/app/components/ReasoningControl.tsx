"use client";

import { useApp } from "@/app/store/AppContext";
import { ReasoningEffort } from "@/app/lib/types";

const OPTIONS: { value: ReasoningEffort; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function ReasoningControl() {
  const { config, updateConfig } = useApp();

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-400">Reasoning effort</label>
      <select
        value={config.reasoningEffort}
        onChange={(e) =>
          updateConfig({ reasoningEffort: e.target.value as ReasoningEffort })
        }
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
      >
        {OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-gray-800 text-gray-200"
          >
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-[11px] text-gray-500">
        Sends <code className="text-gray-400">reasoning_effort</code> for reasoning models
        (OpenAI o-series, GPT-5, …).
      </p>
    </div>
  );
}
