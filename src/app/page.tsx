'use client';
import { useState } from "react";
import ChatContainer from "./ChatContainer";
import { SelectModel } from "@/app/components/SelectModel";
import Link from "next/link";
import { ChatProvider } from "./ChatContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SliderTemperatureComponent } from "./components/SliderTemperatureComponent";
import { SeedComponent } from "./components/SeedComponent";



export interface ChatHistory {
    message: string;
    sender: string;
    messageNumber: number;
    role: 'user' | 'assistant'
    images: string[] | null
}

export default function Home() {
    const [selectedModel, setSelectedModel] = useState("");
    

    return (
        <ChatProvider>
        <ToastContainer />    
        <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="h-[10vh] flex items-center justify-between px-4 border-b border-gray-700/50">
        <div className="flex flex-col items-center gap-2">
            <Link 
            href="/chatstream"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"

            >
                Chat With Stream 
            </Link>
        </div>
            {/* Orta kısım */}
            <div className="flex flex-col items-center gap-2">
                <SelectModel onSelectAction={setSelectedModel} />
                <SliderTemperatureComponent />
                <SeedComponent />
            </div>
            
            {/* Sağdaki Link */}
            <Link 
                href="/models"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
            >
                Manage Models
            </Link>
        </div>
            <ChatContainer selectedModel={selectedModel} />
        </main>
        </ChatProvider>
    );
}
