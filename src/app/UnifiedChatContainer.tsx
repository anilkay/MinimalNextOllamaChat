// src/app/UnifiedChatContainer.tsx
"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "./stores/useChatStore";
import { showToast } from "./utils/ToastUtils";
import ChatContainerLayout from "./components/ChatContainerLayout";
import { IsModelSelected } from "./utils/ChatControlUtils";
import { ChatHistory } from "@/types/chat";
import { chatService } from "./Services/ChatService";

interface UnifiedChatContainerProps {
  useStreaming: boolean;
}

function UnifiedChatContainer({ useStreaming }: Readonly<UnifiedChatContainerProps>) {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [chatUpdate, setChatUpdate] = useState(0);
  
  // Only subscribe to chatHistory since we need to react to changes
  const contextChatHistory = useChatStore((state) => state.chatHistory);

  // Initialize from context when component mounts
  useEffect(() => {
    const history = chatService.setChatHistory(contextChatHistory);
    setTimeout(() => setChatHistory(history), 0); // Asyncronous update
  }, [contextChatHistory]);

  // Message update handler
  const handleMessageUpdate = () => {
    setChatHistory(chatService.getChatHistory());
    setChatUpdate(prev => prev + 1);
  };

  // Send message handler
  const sendMessage = async({ 
    message, 
    image 
  }: { 
    message: string; 
    image: File | null 
  }) => {
    // Read values from store only when needed, without subscribing
    const state = useChatStore.getState();
    
    if (!IsModelSelected(state.selectedModel)) {
      showToast('error', "Please select a model first");
      return false;
    }

    const chatOptions = {
      temperature: state.temperature,
      seedValue: state.seedValue,
      seedUsage: state.seedUsage,
      selectedModel: state.selectedModel,
      systemPrompt: state.systemPrompt,
      systemPromptUsage: state.systemPromptUsage
    };

    let success = false;

    if (useStreaming) {
      success = await chatService.sendMessageWithStream(
        message,
        image,
        chatOptions,
        () => handleMessageUpdate(),
        () => handleMessageUpdate()
      );
    } else {
      success = await chatService.sendMessage(
        message,
        image,
        chatOptions,
        () => handleMessageUpdate()
      );
    }

    return success;
  };

  return (
    <ChatContainerLayout 
      chatHistory={chatHistory} 
      sendMessage={sendMessage} 
      chatUpdate={chatUpdate} 
    />
  );
}

export default UnifiedChatContainer;