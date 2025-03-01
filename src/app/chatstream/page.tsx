"use client"
import { ChatProvider } from '../ChatContext';
import UnifiedChatContainer from '../UnifiedChatContainer';
import 'react-toastify/dist/ReactToastify.css';
import { MainLayout } from '../components/MainLayout';

function ChatComponent() {
    return (
        <ChatProvider>
            <MainLayout leftLinkText="Chat Without Stream" leftLinkHref="/">
                <UnifiedChatContainer useStreaming={true} />
            </MainLayout>
        </ChatProvider>
    );
}

export default ChatComponent;