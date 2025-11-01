"use client"
import UnifiedChatContainer from '../UnifiedChatContainer';
import 'react-toastify/dist/ReactToastify.css';
import { MainLayout } from '../components/MainLayout';

function ChatComponent() {
    return (
        <MainLayout leftLinkText="Chat Without Stream" leftLinkHref="/">
            <UnifiedChatContainer useStreaming={true} />
        </MainLayout>
    );
}

export default ChatComponent;