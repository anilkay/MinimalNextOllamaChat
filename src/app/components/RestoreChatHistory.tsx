import React from "react";
import { ChatHistory } from "../page";
import { useChatStore } from "../stores/useChatStore";

interface ExportedChatData {
    chatHistory: ChatHistory[];
    systemPrompt?: string;
    systemPromptUsage?: boolean;
}

export const RestoreChatHistory= () => {

    const setChatHistory = useChatStore((state) => state.setChatHistory);
    const setSystemPrompt = useChatStore((state) => state.setSystemPrompt);
    const setSystemPromptUsage = useChatStore((state) => state.setSystemPromptUsage);

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
        <div className=" p-4 flex flex-col items-center gap-1">
            <input 
                type="file" 
                accept=".json" 
                onChange={handleFileUpload} 
                className="hidden" 
                id="file-upload"
            />
            
            <label htmlFor="file-upload" className="bg-gradient-to-b from-blue-600 to-blue-800 
               text-white text-sm px-4 py-2 rounded cursor-pointer">
                <span className="text-gray-200">Restore Chat History</span>
            </label>
        </div>
    );
};

export default RestoreChatHistory;