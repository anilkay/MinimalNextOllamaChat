import { useChatContext } from "../ChatContext";

export function SeedComponent() {
    const {seedUsage, setSeedUsage,seedValue, setSeedValue} = useChatContext();
return (
    <div>
        <label>
            <input
                type="checkbox"
                checked={seedUsage}
                onChange={(e) => setSeedUsage(e.target.checked)}
            />
            Use Seed
        </label>
        {seedUsage && (
            <input
                type="number"
                value={seedValue}
                onChange={(e) => setSeedValue(Number(e.target.value))}
                placeholder="Enter seed value"
            />
        )}
    </div>
);
}