"use client";

import { memo, useRef, useState, useCallback, useEffect } from "react";
import { ChatHistory } from "../page";
import { ChatMessageMessageRequest, ChatMessageResponse, GetApiEndpoint, OptionsType, toBase64 } from '../Services/OllamaService';
import { showToast } from "../utils/ToastUtils";
import { useChatContext } from "../ChatContext";
import ChatContainerLayout from "../components/ChatContainerLayout";

function ChatContainerWithStream() {
    const chatHistory = useRef<ChatHistory[]>([]);
    const messageCount = useRef(0);
    const messages = useRef<ChatMessageMessageRequest[]>([]);
    const [chatUpdate, setChatUpdate] = useState(0);
    const {temperature,seedValue,seedUsage,selectedModel,systemPrompt,systemPromptUsage}=useChatContext()

    const sendMessage = useCallback(async({ message, image }: { message: string; image: File | null }) => {
        if (!selectedModel()) {
            showToast('error', "Please select a model first");
            return false;
        }

        console.log("Selected model",selectedModel())

        let images:string[] |null |undefined=null
        
        if(image){
            images=[]
            const base64Image=await toBase64(image);
            images.push(base64Image);
        }

        
        if(systemPromptUsage()){
            messages.current.unshift({role:"system",content:systemPrompt(),images:null});
        }


        chatHistory.current.push({
            message: message,
            sender: "You",
            messageNumber: messageCount.current,
            role: "user",
            images: images,
        });
        setChatUpdate((prev) => prev + 1);

        const options:OptionsType={temperature:temperature()};

        if(seedUsage()){
            options["seed"]=seedValue();
        }

        messages.current.push( 
          {
            role: 'user',
            content: message,
            images: images
          },
        )

        const ollamaEndpoint=GetApiEndpoint();
        const response = await fetch(ollamaEndpoint+'/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              options: options,
              model: selectedModel(),  // or your preferred model
              messages:messages.current,
              stream: true, // Enable streaming
            }),
          });
          if(!response.body){
            return false;
          }


          if(response.status!=200){
            const errorResponse=await response.json() as ChatMessageResponse

            chatHistory.current.push({
              message: "Error making chat request "+errorResponse.message,
              sender:"Ollama",
              messageNumber: messageCount.current,
              role: "assistant",
              images: null
            });

            messageCount.current += 1;
            setChatUpdate((prev) => prev + 1);
            return true;
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
    }, [selectedModel,temperature,seedValue,seedUsage,systemPrompt,systemPromptUsage]);

    useEffect(() => {
        chatHistory.current = [];
        messageCount.current = 0;
        setChatUpdate(0);
    }, [selectedModel]);

    return (
            <ChatContainerLayout chatHistory={chatHistory.current} sendMessage={sendMessage} chatUpdate={chatUpdate} />
    );
}

export default memo(ChatContainerWithStream);
