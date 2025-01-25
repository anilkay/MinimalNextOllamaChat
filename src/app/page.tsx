'use client';
import { useState } from "react";
import ChatContainer from "./ChatContainer";
import { SelectModel } from "@/app/SelectModel";
import Link from "next/link";

export interface ChatHistory {
    message: string;
    sender: string;
    messageNumber: number;
}

export default function Home() {
    const [selectedModel, setSelectedModel] = useState("");

    return (
        <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
            <div className="h-[10vh] flex items-center justify-between px-4 border-b border-gray-700/50">
                <SelectModel onSelectAction={setSelectedModel} />
                <Link 
                    href="/models"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
                >
                    Manage Models
                </Link>
            </div>
            <ChatContainer selectedModel={selectedModel} />
        </main>
    );
}
