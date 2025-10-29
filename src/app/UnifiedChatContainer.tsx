// src/app/UnifiedChatContainer.tsx
"use client";

import { memo, useState } from "react";
import { useChatContext } from "./ChatContext";
import { showToast } from "./utils/ToastUtils";
import ChatContainerLayout from "./components/ChatContainerLayout";
import { IsModelSelected } from "./utils/ChatControlUtils";
import { chatService } from "./Services/ChatService";

interface UnifiedChatContainerProps {
  useStreaming: boolean;
}

function UnifiedChatContainer({ useStreaming }: Readonly<UnifiedChatContainerProps>) {
  const [chatUpdate, setChatUpdate] = useState(0);
  
  const {
    temperature,
    seedValue,
    seedUsage,
    selectedModel,
    systemPrompt,
    systemPromptUsage,
    chatHistory: contextChatHistory
  } = useChatContext();

  // Derive chat history from context - no need for local state
  const chatHistory = chatService.setChatHistory(contextChatHistory);

  // Message update handler - trigger re-render when messages update
  // React Compiler handles function stability automatically
  const handleMessageUpdate = () => {
    setChatUpdate(prev => prev + 1);
  };

  // Send message handler
  // React Compiler handles function stability automatically
  const sendMessage = async({ 
    message, 
    image 
  }: { 
    message: string; 
    image: File | null 
  }) => {
    if (!IsModelSelected(selectedModel())) {
      showToast('error', "Please select a model first");
      return false;
    }

    const chatOptions = {
      temperature: temperature(),
      seedValue: seedValue(),
      seedUsage: seedUsage(),
      selectedModel: selectedModel(),
      systemPrompt: systemPrompt(),
      systemPromptUsage: systemPromptUsage()
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

export default memo(UnifiedChatContainer);