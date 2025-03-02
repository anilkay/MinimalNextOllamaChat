// src/app/Services/ChatService.ts
import { ChatHistory } from "../page";
import { 
  ChatMessageMessageRequest, 
  ChatMessageResponse, 
  GetApiEndpoint,
  MakeChatRequest as makeNonStreamingRequest,
  OptionsType,
  toBase64
} from "./OllamaService";
import { IsSystemPromptAppended } from "../utils/ChatControlUtils";

// Unified interface for chat options
export interface ChatOptions {
  temperature: number;
  seedValue: number;
  seedUsage: boolean;
  selectedModel: string;
  systemPrompt: string;
  systemPromptUsage: boolean;
}

// Message handler types
export type MessageHandler = (message: string) => void;
export type ChatCompletionHandler = () => void;

// Unified class to handle both streaming and non-streaming chats
export class ChatService {
  private messagesHistory: ChatMessageMessageRequest[] = [];
  private chatHistory: ChatHistory[] = [];
  private messageCount = 0;
    
  // Reset chat service state
  public reset() {
    this.messagesHistory = [];
    this.chatHistory = [];
    this.messageCount = 0;
  }
  
  // Set existing chat history
  public setChatHistory(history: ChatHistory[]) {
    this.chatHistory = [...history];
    if (this.chatHistory.length > 0) {
      const lastMessage = this.chatHistory[this.chatHistory.length - 1];
      this.messageCount = lastMessage.messageNumber + 1;
      
      // Convert ChatHistory to ChatMessageMessageRequest format
      this.messagesHistory = this.chatHistory.map(chat => ({
        role: chat.role,
        content: chat.message,
        images: chat.images
      }));
    }
    
    return [...this.chatHistory];
  }
  
  // Get current chat history
  public getChatHistory(): ChatHistory[] {
    return [...this.chatHistory];
  }
  
  // Process image file to base64
  private async prepareImage(image: File | null): Promise<string[] | null> {
    if (!image) return null;
    
    const images: string[] = [];
    const base64Image = await toBase64(image);
    images.push(base64Image);
    return images;
  }
  
  // Add user message to chat history
  private addUserMessage(message: string, images: string[] | null): void {
    this.chatHistory.push({
      message,
      sender: "You",
      messageNumber: this.messageCount,
      role: "user",
      images
    });
    
    this.messagesHistory.push({
      role: "user",
      content: message,
      images
    });
  }
  
  // Prepare options for API request
  private prepareOptions(chatOptions: ChatOptions): OptionsType {
    const options: OptionsType = { temperature: chatOptions.temperature };
    
    if (chatOptions.seedUsage) {
      options.seed = chatOptions.seedValue;
    }
    
    return options;
  }
  
  // Add system prompt if needed
  private addSystemPromptIfNeeded(chatOptions: ChatOptions): void {
    if (IsSystemPromptAppended(this.messagesHistory, chatOptions.systemPromptUsage)) {
      this.messagesHistory.unshift({
        role: "system",
        content: chatOptions.systemPrompt,
        images: null
      });
    }
  }
  
  // Send message with streaming response
  public async sendMessageWithStream(
    message: string, 
    image: File | null, 
    chatOptions: ChatOptions,
    onMessageUpdate: MessageHandler,
    onComplete: ChatCompletionHandler
  ): Promise<boolean> {
    try {
      const images = await this.prepareImage(image);
      this.addUserMessage(message, images);
      
      this.addSystemPromptIfNeeded(chatOptions);
      const options = this.prepareOptions(chatOptions);
      
      // Initialize empty assistant message
      let accumulatedMessage = '';
      this.chatHistory.push({
        message: accumulatedMessage,
        sender: "Ollama",
        messageNumber: this.messageCount,
        role: "assistant",
        images: null
      });
      
      onMessageUpdate(accumulatedMessage);
      
      const ollamaEndpoint = GetApiEndpoint();
      const response = await fetch(`${ollamaEndpoint}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options,
          model: chatOptions.selectedModel,
          messages: this.messagesHistory,
          stream: true
        })
      });
      
      if (!response.body) {
        throw new Error("No response body");
      }
      
      if (response.status !== 200) {
        const errorResponse = await response.json() as ChatMessageResponse;
        this.chatHistory[this.chatHistory.length - 1].message = 
          `Error making chat request: ${errorResponse.message}`;
        onMessageUpdate(this.chatHistory[this.chatHistory.length - 1].message);
        this.messageCount += 1;
        return true;
      }
      
      const reader = response.body.getReader();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const parsedChunk = JSON.parse(line);
            if (parsedChunk.message?.content) {
              accumulatedMessage += parsedChunk.message.content;
              this.chatHistory[this.chatHistory.length - 1].message = accumulatedMessage;
              onMessageUpdate(accumulatedMessage);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
      
      this.messagesHistory.push({
        content: accumulatedMessage,
        role: "assistant",
        images: null
      });
      
      this.messageCount += 1;
      onComplete();
      return true;
    } catch (error) {
      console.error('Error in streaming chat:', error);
      return false;
    }
  }
  
  // Send message with non-streaming response
  public async sendMessage(
    message: string, 
    image: File | null, 
    chatOptions: ChatOptions,
    onMessageUpdate: MessageHandler
  ): Promise<boolean> {
    try {
      const images = await this.prepareImage(image);
      this.addUserMessage(message, images);
      onMessageUpdate(message);
      
      this.addSystemPromptIfNeeded(chatOptions);
      
      const result = await makeNonStreamingRequest(
        chatOptions.temperature,
        chatOptions.seedUsage,
        chatOptions.seedValue,
        chatOptions.systemPromptUsage,
        chatOptions.systemPrompt,
        chatOptions.selectedModel,
        this.chatHistory // This is a bit of a mismatch - should be converted from this.messagesHistory
      );
      
      if (result.error) {
        this.chatHistory.push({
          message: "Error making chat request",
          sender: "assistant",
          messageNumber: this.messageCount,
          role: "user",
          images: null
        });
        this.messageCount += 1;
        onMessageUpdate("Error making chat request");
        return false;
      }
      
      const chatMessageResponse = result.data?.message;
      const chatResponseModel = result.data?.model;
      
      this.chatHistory.push({
        message: chatMessageResponse?.content ?? "",
        sender: chatResponseModel ?? "",
        messageNumber: this.messageCount,
        role: 'assistant',
        images: null
      });
      
      this.messagesHistory.push({
        content: chatMessageResponse?.content ?? "",
        role: "assistant",
        images: null
      });
      
      this.messageCount += 1;
      onMessageUpdate(chatMessageResponse?.content ?? "");
      return true;
    } catch (error) {
      console.error('Error in non-streaming chat:', error);
      return false;
    }
  }
}

// Singleton instance
export const chatService = new ChatService();