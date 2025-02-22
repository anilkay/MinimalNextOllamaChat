"use client";

import { memo, useCallback, useRef, useState, useEffect } from "react";
import { MakeChatRequest, toBase64 } from "./Services/OllamaService";
import { ChatHistory } from "./page";
import { useChatContext } from "./ChatContext";
import { showToast } from "./utils/ToastUtils";
import ChatContainerLayout from "./components/ChatContainerLayout";




function ChatContainer() {
    const chatHistory = useRef<ChatHistory[]>([]);
    const messageCount = useRef(0);
    const [chatUpdate, setChatUpdate] = useState(0);
    const {temperature,seedValue,seedUsage,selectedModel,systemPrompt,systemPromptUsage}=useChatContext()

    const sendMessage = useCallback(async({ message, image }: { message: string; image: File | null }) => {
        if (!selectedModel) {
            showToast('error', "Please select a model first");
            return;
        }

        let images:string[] |null |undefined=null
        
        if(image){
            images=[]
            const base64Image=await toBase64(image);
            images.push(base64Image);
        }

        chatHistory.current.push({
            message: message,
            sender: "You",
            messageNumber: messageCount.current,
            role: "user",
            images: images,
        });
        setChatUpdate((prev) => prev + 1);

        

        MakeChatRequest(
            temperature(),
            seedUsage(),
            seedValue(),
            systemPromptUsage(),
            systemPrompt(),
            selectedModel(),
            chatHistory.current,
        ).then(function (result) {
            if(result.error){
                chatHistory.current.push({
                    message: "Error making chat request",
                    sender: "assistant",
                    messageNumber: messageCount.current,
                    role: "user",
                    images: null
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
                role: 'assistant',
                images:null
            });
            messageCount.current += 1;
            setChatUpdate((prev) => prev + 1);
        });
    }, [selectedModel, temperature, seedUsage, seedValue, systemPromptUsage, systemPrompt]);

    useEffect(() => {
        chatHistory.current = [];
        messageCount.current = 0;
        setChatUpdate(0);
    }, [selectedModel]);

    return (
        <ChatContainerLayout chatHistory={chatHistory.current} sendMessage={sendMessage} chatUpdate={chatUpdate} />
    );
}

export default memo(ChatContainer);
