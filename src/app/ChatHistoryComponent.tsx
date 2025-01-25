"use client";
import {ChatHistory} from "@/app/page";
import {FC} from "react";

export const ChatHistoryComponent: FC<{ chathistory: ChatHistory[] }> = ({ chathistory }) => {
    return (
        <div className="flex flex-col space-y-4 py-4">
            {chathistory.map((message, index) => (
                <div key={index} className={`flex flex-col ${message.sender === "You" ? "items-end" : "items-start"}`}>
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