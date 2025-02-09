import { useChatContext } from "../ChatContext"

export const SystemPromptComponent: React.FC = () => {
    const { systemPrompt, setSystemPrompt, systemPromptUsage, setSystemPromptUsage } = useChatContext();

    return (
        <div className="p-4 bg-gray-900 text-white rounded shadow-md">
        <label className="flex items-center mb-2 text-gray-300">
            <input
                type="checkbox"
                checked={systemPromptUsage}
                onChange={(e) => setSystemPromptUsage(e.target.checked)}
                className="mr-2 accent-blue-500"
            />
            Use System Prompt
        </label>
        {systemPromptUsage && (
            <input
                type="text"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Enter system prompt"
                className="border border-gray-600 bg-gray-800 text-white rounded p-2"
            />
        )}
    </div>  
    )
}