import React from "react";
import { ChatHistory } from "../page";
import { useChatContext } from "../ChatContext";
import { Upload } from "lucide-react";

interface ExportedChatData {
    chatHistory: ChatHistory[];
    systemPrompt?: string;
    systemPromptUsage?: boolean;
}

export const RestoreChatHistory= () => {

    const { setChatHistory, setSystemPrompt, setSystemPromptUsage } = useChatContext();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parsedData = JSON.parse(text);
                
                // Check if it's the new format (object with chatHistory property)
                if (parsedData.chatHistory && Array.isArray(parsedData.chatHistory)) {
                    const data = parsedData as ExportedChatData;
                    setChatHistory(data.chatHistory);
                    
                    // Restore system prompt if present
                    if (data.systemPrompt !== undefined) {
                        setSystemPrompt(data.systemPrompt);
                    }
                    if (data.systemPromptUsage !== undefined) {
                        setSystemPromptUsage(data.systemPromptUsage);
                    }
                } else if (Array.isArray(parsedData)) {
                    // Handle old format (just an array of messages)
                    const chatHistory: ChatHistory[] = parsedData;
                    setChatHistory(chatHistory);
                } else {
                    const errorMsg = "Invalid format: Expected an array of messages or object with chatHistory property";
                    console.error(errorMsg);
                    throw new Error(errorMsg);
                }
            } catch (error) {
                console.error("Error parsing JSON file:", error);
            }
        };

        reader.readAsText(file);
    };

    return (
        <div>
            <input 
                type="file" 
                accept=".json" 
                onChange={handleFileUpload} 
                className="hidden" 
                id="file-upload"
            />
            
            <label 
                htmlFor="file-upload" 
                className="flex items-center gap-2 w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-200 transition-all group cursor-pointer"
                title="Restore conversation from JSON"
            >
                <Upload size={16} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
                <span>Restore Conversation</span>
            </label>
        </div>
    );
};

export default RestoreChatHistory;