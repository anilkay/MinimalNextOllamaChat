'use client';
import ChatContainer from "./ChatContainer";
import { ChatProvider } from "./ChatContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FrontMenu } from "./components/FrontMenu";



export interface ChatHistory {
    message: string;
    sender: string;
    messageNumber: number;
    role: 'user' | 'assistant'
    images: string[] | null
}

export default function Home() {
    

    return (
        <ChatProvider>
        <ToastContainer />    
        <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="h-[10vh] flex items-center justify-between px-4 border-b border-gray-700/50">
        <FrontMenu leftLinkText="Chat With Stream" leftLinkHref="/chatstream" />
        </div>
            <ChatContainer />
        </main>
        </ChatProvider>
    );
}
