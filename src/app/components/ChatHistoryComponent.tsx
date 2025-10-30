"use client";
import {ChatHistory} from "@/app/page";
import {FC} from "react";
import { useChatContext } from "../ChatContext";

const exportChatHistory = (chatHistory: ChatHistory[], systemPrompt: string, systemPromptUsage: boolean) => {
    const exportData = {
        chatHistory,
        systemPrompt: systemPromptUsage ? systemPrompt : undefined,
        systemPromptUsage
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatHistory.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const ChatHistoryComponent: FC<{ chathistory: ChatHistory[] }> = ({ chathistory }) => {
    const { systemPrompt, systemPromptUsage } = useChatContext();
    return (
        <div className="flex flex-col space-y-4 py-4">
            <button 
                onClick={() => exportChatHistory(chathistory, systemPrompt(), systemPromptUsage())} 
                className="bg-blue-500 text-gray-200 rounded-lg px-4 py-2 hover:bg-blue-600 transition duration-200 ease-in-out dark:bg-gray-700 dark:hover:bg-gray-600"
                aria-label="Save Conversation"
            >
                📥 Save Conversation
            </button>
            {chathistory.map((message) => (
                <div key={message.messageNumber+message.role} className={`flex flex-col ${message.sender === "You" ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400">{message.sender}</span>
                    </div>
                    <div className={`max-w-[80%] px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm ${
                        message.sender === "You" 
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none" 
                            : "bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-tl-none"
                    }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatHistoryComponent;