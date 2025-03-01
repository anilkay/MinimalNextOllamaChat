import React, { memo } from "react";
import { ChatHistory } from "../page";
import { useChatContext } from "../ChatContext";

export const RestoreChatHistory= () => {

    const { setChatHistory } = useChatContext();

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const chatHistory: ChatHistory[] = JSON.parse(text);
                setChatHistory(chatHistory);
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
            
            <label htmlFor="file-upload" className="bg-blue-500 text-white text-sm px-4 py-2 rounded cursor-pointer">
                Restore Chat History
            </label>
        </div>
    );
};

export default  memo(RestoreChatHistory);