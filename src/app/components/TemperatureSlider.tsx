"use client";

import { useApp } from "@/app/store/AppContext";

export function TemperatureSlider() {
  const { config, updateConfig } = useApp();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-400">Temperature</label>
        <span className="text-xs font-mono text-gray-300">{config.temperature.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={2}
        step={0.01}
        value={config.temperature}
        onChange={(e) => updateConfig({ temperature: Number(e.target.value) })}
        className="w-full accent-blue-500"
      />
    </div>
  );
}
