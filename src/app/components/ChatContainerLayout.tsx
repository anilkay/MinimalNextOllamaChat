import React, { memo } from 'react';
import ChatHistoryComponent  from './ChatHistoryComponent';
import { SendMessageComponent } from './SendMessageComponent';
import { ChatHistory } from '../page';

interface ChatLayoutProps {
    chatHistory: ChatHistory[]; 
    sendMessage: (message: { message: string; image: File | null }) => Promise<boolean | undefined> | Promise<boolean>; 
    chatUpdate: number; 
}

const MemoizedChatHistory = memo(ChatHistoryComponent);
const MemoizedSendMessage = memo(SendMessageComponent);

const ChatContainerLayout: React.FC<ChatLayoutProps> = ({ chatHistory, sendMessage, chatUpdate }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="h-[60vh] overflow-y-auto bg-gradient-to-b from-gray-800/50 via-gray-900/50 to-gray-800/50">
                <div className="max-w-3xl mx-auto px-4">
                    <MemoizedChatHistory chathistory={chatHistory} key={chatUpdate} />
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-gray-900 via-gray-800 to-gray-900/90 border-t border-gray-700/50 p-4 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto h-full">
                    <MemoizedSendMessage onSendChatMessageAction={sendMessage} />
                </div>
            </div>
        </div>
    );
};

export default ChatContainerLayout;