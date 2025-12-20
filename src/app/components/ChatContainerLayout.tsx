import React from 'react';
import ChatHistoryComponent  from './ChatHistoryComponent';
import { SendMessageComponent } from './SendMessageComponent';
import { ChatHistory } from '../page';

interface ChatLayoutProps {
    chatHistory: ChatHistory[]; 
    sendMessage: (message: { message: string; image: File | null }) => Promise<boolean | undefined> | Promise<boolean>; 
    chatUpdate: number; 
}

const ChatContainerLayout: React.FC<ChatLayoutProps> = ({ chatHistory, sendMessage, chatUpdate }) => {
    return (
        <div className="flex flex-col h-full relative">
            {/* Chat History Area - Grows to fill space */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    <ChatHistoryComponent chathistory={chatHistory} key={chatUpdate} />
                </div>
            </div>
            
            {/* Input Area - Fixed at bottom */}
            <div className="flex-shrink-0 bg-gray-900 border-t border-gray-800 p-4">
                <div className="max-w-3xl mx-auto">
                    <SendMessageComponent onSendChatMessageAction={sendMessage} />
                </div>
            </div>
        </div>
    );
};

export default ChatContainerLayout;