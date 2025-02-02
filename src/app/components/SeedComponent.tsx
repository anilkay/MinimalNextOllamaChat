import { useChatContext } from "../ChatContext";

export function SeedComponent() {
    const {seedUsage, setSeedUsage,seedValue, setSeedValue} = useChatContext();
return (
    <div className="p-4 bg-gray-900 text-white rounded shadow-md">
    <label className="flex items-center mb-2 text-gray-300">
        <input
            type="checkbox"
            checked={seedUsage}
            onChange={(e) => setSeedUsage(e.target.checked)}
            className="mr-2 accent-blue-500"
        />
        Use Seed
    </label>
    {seedUsage && (
        <input
            type="number"
            value={seedValue}
            onChange={(e) => setSeedValue(Number(e.target.value))}
            placeholder="Enter seed value"
            className="border border-gray-600 bg-gray-800 text-white rounded p-2"
        />
    )}
</div>
)
}