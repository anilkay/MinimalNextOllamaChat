"use client";

import { memo, useCallback, useRef, useState, useEffect } from "react";
import { ChatHistoryComponent } from "./ChatHistoryComponent";
import { SendMessageComponent } from "./SendMessageComponent";
import { ChatMessageWithRoles, MakeChatRequest } from "./Services/OllamaService";
import { ChatHistory } from "./page";
import { useChatContext } from "./ChatContext";

const MemoizedChatHistory = memo(ChatHistoryComponent);
const MemoizedSendMessage = memo(SendMessageComponent);

interface ChatContainerProps {
    selectedModel: string;
}

function ChatContainer({ selectedModel }: ChatContainerProps) {
    const chatHistory = useRef<ChatHistory[]>([]);
    const messageCount = useRef(0);
    const [chatUpdate, setChatUpdate] = useState(0);
    const {temperature}=useChatContext()

    const sendMessage = useCallback((message: string) => {
        if (!selectedModel) {
            alert("Please select a model first");
            return;
        }

        chatHistory.current.push({
            message: message,
            sender: "You",
            messageNumber: messageCount.current,
            role: "user"
        });
        setChatUpdate((prev) => prev + 1);

        MakeChatRequest(
            temperature,
            selectedModel,
            chatHistory.current.map((history) =>  
            {
              const chatResponseModel:ChatMessageWithRoles= {message:history.message,role:history.role}
              return chatResponseModel
            })
        ).then(function (result) {
            console.log(result);
            if(result.error){
                chatHistory.current.push({
                    message: "Error making chat request",
                    sender: "assistant",
                    messageNumber: messageCount.current,
                    role: "user"
                })
                messageCount.current += 1;
                setChatUpdate((prev) => prev + 1);
                return;
            }
            
            const chatMessageResponse = result.data?.message;
            const chatResponseModel = result.data?.model;
            chatHistory.current.push({
                message: chatMessageResponse?.content ?? "",
                sender: chatResponseModel ?? "",
                messageNumber: messageCount.current,
                role: 'assistant'
            });
            messageCount.current += 1;
            setChatUpdate((prev) => prev + 1);
        });
    }, [selectedModel]);

    useEffect(() => {
        chatHistory.current = [];
        messageCount.current = 0;
        setChatUpdate(0);
    }, [selectedModel]);

    return (
            <div className="flex flex-col h-full">
                <div className="h-[60vh] overflow-y-auto bg-gradient-to-b from-gray-800/50 via-gray-900/50 to-gray-800/50">
                    <div className="max-w-3xl mx-auto px-4">
                        <MemoizedChatHistory chathistory={chatHistory.current} key={chatUpdate} />
                    </div>
                </div>
                <div className="fixed bottom-0 left-0 right-0 h-[30vh] bg-gradient-to-t from-gray-900 via-gray-800 to-gray-900/90 border-t border-gray-700/50 p-4 backdrop-blur-sm">
                    <div className="max-w-3xl mx-auto h-full">
                        <MemoizedSendMessage onSendChatMessageAction={sendMessage} />
                    </div>
                </div>
            </div>
    );
}

export default memo(ChatContainer);
