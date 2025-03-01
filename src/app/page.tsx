'use client';
import { ChatProvider } from "./ChatContext";
import UnifiedChatContainer from "./UnifiedChatContainer";
import 'react-toastify/dist/ReactToastify.css';
import { MainLayout } from "./components/MainLayout";

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
            <MainLayout leftLinkText="Chat With Stream" leftLinkHref="/chatstream">
                <UnifiedChatContainer useStreaming={false} />
            </MainLayout>
        </ChatProvider>
    );
}