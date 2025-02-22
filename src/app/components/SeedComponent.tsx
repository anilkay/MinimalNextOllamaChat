import { useState } from "react";
import { useChatContext } from "../ChatContext";

export function SeedComponent() {
    const {seedUsage, setSeedUsage,seedValue, setSeedValue} = useChatContext();
    const [localSeedValue, setLocalSeedValue] = useState(seedValue);
    const [localSeedUsage, setLocalSeedUsage] = useState(seedUsage);

    const handleSeedUsageChange = (checked: boolean) => {
        setLocalSeedUsage(checked);
        setSeedUsage(checked);
    };

    const handleSeedValueChange = (value: number) => {
        setLocalSeedValue(value);
        setSeedValue(value);
    };

return (
    <div className="p-4 bg-gray-900 text-white rounded shadow-md">
    <label className="flex items-center mb-2 text-gray-300">
        <input
            type="checkbox"
            checked={localSeedUsage}
            onChange={(e) => handleSeedUsageChange(e.target.checked)}
            className="mr-2 accent-blue-500" /> Use Seed
    </label>
    {localSeedUsage && (
        <input
            type="number"
            value={localSeedValue}
            onChange={(e) => handleSeedValueChange(Number(e.target.value))}
            placeholder="Enter seed value"
            className="border border-gray-600 bg-gray-800 text-white rounded p-2" />
    )}
</div>
)
}