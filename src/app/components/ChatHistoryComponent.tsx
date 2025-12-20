"use client";
import {ChatHistory} from "@/app/page";
import {FC} from "react";
import { User, Bot } from 'lucide-react';

const ChatHistoryComponent: FC<{ chathistory: ChatHistory[] }> = ({ chathistory }) => {
    
    if (chathistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
                <Bot size={48} className="mb-4 opacity-20" />
                <p>Start a conversation...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6 py-4">
            {chathistory.map((message) => (
                <div key={message.messageNumber+message.role} className={`flex gap-4 ${message.sender === "You" ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === "You" ? "bg-blue-600" : "bg-emerald-600"
                    }`}>
                        {message.sender === "You" ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[80%] ${message.sender === "You" ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 font-medium">{message.sender}</span>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                            message.sender === "You" 
                                ? "bg-blue-600 text-white rounded-tr-none" 
                                : "bg-gray-800 text-gray-100 border border-gray-700 rounded-tl-none"
                        }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ChatHistoryComponent;