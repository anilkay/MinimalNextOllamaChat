"use client";

import { useApp } from "@/app/store/AppContext";

export function SeedControl() {
  const { config, updateConfig } = useApp();

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={config.useSeed}
          onChange={(e) => updateConfig({ useSeed: e.target.checked })}
          className="accent-blue-500"
        />
        Use seed
      </label>
      {config.useSeed && (
        <input
          type="number"
          value={config.seed}
          onChange={(e) => updateConfig({ seed: Number(e.target.value) })}
          placeholder="Seed value"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
        />
      )}
    </div>
  );
}
