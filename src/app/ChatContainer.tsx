"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { MakeChatRequest, toBase64 } from "./Services/OllamaService";
import { useChatContext } from "./ChatContext";
import { showToast } from "./utils/ToastUtils";
import ChatContainerLayout from "./components/ChatContainerLayout";
import { IsModelSelected } from "./utils/ChatControlUtils";
import { ChatHistory } from "./page";




function ChatContainer() {
    const chatHistoryRef = useRef<ChatHistory[]>([]);
    const messageCount = useRef(0);
    const [chatUpdate, setChatUpdate] = useState(0);
    const {temperature,seedValue,
        seedUsage,selectedModel,
        systemPrompt,systemPromptUsage,
        chatHistory
    }=useChatContext()

     useEffect(() => {
         chatHistoryRef.current = chatHistory
         setChatUpdate((prev) => prev + 1);
         if(chatHistoryRef.current.length>0){
            const lastMessage=chatHistoryRef.current[chatHistoryRef.current.length-1];
            messageCount.current=lastMessage.messageNumber+1
        }
     }, [chatHistory]);

    const sendMessage = useCallback(async({ message, image }: { message: string; image: File | null }) => {
        if (!IsModelSelected(selectedModel()))  {
            showToast('error', "Please select a model first");
            return;
        }

        let images:string[] |null |undefined=null
        
        if(image){
            images=[]
            const base64Image=await toBase64(image);
            images.push(base64Image);
        }

        chatHistoryRef.current.push({
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
            chatHistoryRef.current,
        ).then(function (result) {
            if(result.error){
                chatHistoryRef.current.push({
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
            chatHistoryRef.current.push({
                message: chatMessageResponse?.content ?? "",
                sender: chatResponseModel ?? "",
                messageNumber: messageCount.current,
                role: 'assistant',
                images:null
            });
            messageCount.current += 1;
            setChatUpdate((prev) => prev + 1);
        });
    }, []);


    return (
        <ChatContainerLayout chatHistory={chatHistoryRef.current} sendMessage={sendMessage} chatUpdate={chatUpdate} />
    );
}

export default memo(ChatContainer);
