import { useState } from "react";
import { useChatStore } from "../stores/useChatStore";

export const SystemPromptComponent: React.FC = () => {
    const systemPrompt = useChatStore((state) => state.systemPrompt);
    const setSystemPrompt = useChatStore((state) => state.setSystemPrompt);
    const systemPromptUsage = useChatStore((state) => state.systemPromptUsage);
    const setSystemPromptUsage = useChatStore((state) => state.setSystemPromptUsage);
    
    const [localSystemPrompt, setLocalSystemPrompt] = useState(systemPrompt);
    const [localSystemPromptUsage, setLocalSystemPromptUsage] = useState(systemPromptUsage);

    const handleSystemPromptUsageChange = (checked: boolean) => {
        setLocalSystemPromptUsage(checked);
        setSystemPromptUsage(checked);
    };

    const handleSystemPromptChange = (value: string) => {
        setLocalSystemPrompt(value);
        setSystemPrompt(value);
    };

    return (
        <div className="p-4 bg-gray-900 text-white rounded shadow-md">
        <label className="flex items-center mb-2 text-gray-300">
            <input
                type="checkbox"
                checked={localSystemPromptUsage}
                onChange={(e) => handleSystemPromptUsageChange(e.target.checked)}
                className="mr-2 accent-blue-500" /> Use System Prompt
        </label>
        {localSystemPromptUsage && (
            <input
                type="text"
                value={localSystemPrompt}
                onChange={(e) => handleSystemPromptChange(e.target.value)}
                placeholder="Enter system prompt"
                className="border border-gray-600 bg-gray-800 text-white rounded p-2"
            />
        )}
    </div>  
    )
}

export default SystemPromptComponent;