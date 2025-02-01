"use client";

import { memo, useRef, useState, useCallback, useEffect } from "react";
import { ChatHistoryComponent } from "../components/ChatHistoryComponent";
import { ChatHistory } from "../page";
import { SendMessageComponent } from "../components/SendMessageComponent";
import { ChatMessageResponse, OptionsType, toBase64 } from '../Services/OllamaService';
import { toast } from 'react-toastify';
import { showToast } from "../utils/ToastUtils";
import { useChatContext } from "../ChatContext";

const MemoizedChatHistory = memo(ChatHistoryComponent);
const MemoizedSendMessage = memo(SendMessageComponent);

interface ChatContainerProps {
    selectedModel: string;
}

function ChatContainerWithStream({ selectedModel }: ChatContainerProps) {
    const chatHistory = useRef<ChatHistory[]>([]);
    const messageCount = useRef(0);
    const [chatUpdate, setChatUpdate] = useState(0);
    const {temperature,seedValue,seedUsage}=useChatContext()

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

        const options:OptionsType={temperature:temperature};
        
        if(seedUsage){
            options["seed"]=seedValue;
        }

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              options: options,
              model: selectedModel,  // or your preferred model
              messages: [
                {
                  role: 'user',
                  content: message,
                  images: images
                },
              ],
              stream: true, // Enable streaming
            }),
          });
          if(!response.body){
            return;
          }

          console.log(response);
          console.log("status",response.status)

          if(response.status!=200){
            const errorResponse=await response.json() as ChatMessageResponse

            chatHistory.current.push({
              message: "Error making chat request",
              sender:"Ollama",
              messageNumber: messageCount.current,
              role: "assistant",
              images: null
            });

            messageCount.current += 1;
            setChatUpdate((prev) => prev + 1);
            return;
          }

          const reader = response.body.getReader();
          let accumulatedMessage = '';
          chatHistory.current.push({
            message: accumulatedMessage,
            sender:"Ollama",
            messageNumber: messageCount.current,
            role: "assistant",
            images: null
          });
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            // Convert the Uint8Array to text
            const chunk = new TextDecoder().decode(value);
            
            // Parse the JSON chunks (each line is a separate JSON object)
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
              try {
                const parsedChunk = JSON.parse(line);
                if (parsedChunk.message?.content) {
                  accumulatedMessage += parsedChunk.message.content;
                  chatHistory.current.at(-1)!.message = accumulatedMessage;
                  setChatUpdate((prev) => prev + 1);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
         
          messageCount.current += 1;
          setChatUpdate((prev) => prev + 1);
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

export default memo(ChatContainerWithStream);
