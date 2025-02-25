"use client";

import { memo, useRef, useState, useCallback, useEffect } from "react";
import { ChatHistory } from "../page";
import { ChatMessageMessageRequest, ChatMessageResponse, GetApiEndpoint, OptionsType, toBase64 } from '../Services/OllamaService';
import { showToast } from "../utils/ToastUtils";
import { useChatContext } from "../ChatContext";
import ChatContainerLayout from "../components/ChatContainerLayout";
import { IsModelSelected, IsSystemPromptAppended } from "../utils/ChatControlUtils";

function ChatContainerWithStream() {
    const chatHistoryRef = useRef<ChatHistory[]>([]);
    const messageCount = useRef(0);
    const messages = useRef<ChatMessageMessageRequest[]>([]);
    const [chatUpdate, setChatUpdate] = useState(0);
    const {temperature,seedValue,seedUsage,selectedModel,systemPrompt,systemPromptUsage,chatHistory}=useChatContext()

    useEffect(() => {
         chatHistoryRef.current = chatHistory
         setChatUpdate((prev) => prev + 1);
         if(chatHistoryRef.current.length>0){
            const lastMessage=chatHistoryRef.current[chatHistoryRef.current.length-1];
            messageCount.current=lastMessage.messageNumber+1
            //Chat Hisstory'deki son mesajları messages'a ekleyebiliriz
            messages.current=chatHistoryRef.current.map((chatHistory:ChatHistory)=>{return {role:chatHistory.role,content:chatHistory.message,images:chatHistory.images}})
        }
     }, [chatHistory]);

    const sendMessage = useCallback(async({ message, image }: { message: string; image: File | null }) => {
        if (!IsModelSelected(selectedModel())) {
            showToast('error', "Please select a model first");
            return false;
        }

        const getImages=async()=>{
            if(!image){
                return null;
            }
            let images:string[] |null |undefined=[]
            const base64Image=await toBase64(image);
            images.push(base64Image);
            return images;
        }


        const images= await getImages();

        
        if(IsSystemPromptAppended(messages.current,systemPromptUsage())){
            messages.current.unshift({role:"system",content:systemPrompt(),images:null});
        }


        chatHistoryRef.current.push({
            message: message,
            sender: "You",
            messageNumber: messageCount.current,
            role: "user",
            images: images,
        });
        setChatUpdate((prev) => prev + 1);

        const options:OptionsType={temperature:temperature()};

        const addSeedUsageToOptions=()=>{
            if(!seedUsage()){
                return;
            }
            options["seed"]=seedValue();
        }


        addSeedUsageToOptions();

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

            chatHistoryRef.current.push({
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
          chatHistoryRef.current.push({
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
                  chatHistoryRef.current.at(-1)!.message = accumulatedMessage;
                  setChatUpdate((prev) => prev + 1);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }

          messages.current.push({
            content:accumulatedMessage,
            role: "assistant",
            images: images
          })
        
          messageCount.current += 1;
          setChatUpdate((prev) => prev + 1);
    }, [selectedModel,temperature,seedValue,seedUsage,systemPrompt,systemPromptUsage,chatHistory]);



    return (
            <ChatContainerLayout chatHistory={chatHistoryRef.current} sendMessage={sendMessage} chatUpdate={chatUpdate} />
    );
}

export default memo(ChatContainerWithStream);
