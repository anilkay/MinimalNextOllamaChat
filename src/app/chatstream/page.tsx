"use client"
import Link from 'next/link';
import { useState } from 'react';
import ChatContainer from '../ChatContainer';
import { ChatProvider } from '../ChatContext';
import { SelectModel } from '../SelectModel';
import { SliderTemperatureComponent } from '../Services/SliderTemperatureComponent';
import ChatContainerWithStream from './ChatContainerWithStream';

function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (userInput:string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tinyllama',  // or your preferred model
          messages: [
            {
              role: 'user',
              content: userInput,
            },
          ],
          stream: true, // Enable streaming
        }),
      });
      if(!response.body){
        return;
      }
      const reader = response.body.getReader();
      let accumulatedMessage = '';

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
              setCurrentMessage(accumulatedMessage);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }

      // Add the complete message to messages array
      setCurrentMessage('');
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedModel, setSelectedModel] = useState("");
    

  return (
      <ChatProvider>
      <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="h-[10vh] flex items-center justify-between px-4 border-b border-gray-700/50">
      <div className="flex flex-col items-center gap-2">
      <Link 
            href="/"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"

            >
                Chat Without Stream 
            </Link>
          </div>
          {/* Orta kısım */}
          <div className="flex flex-col items-center gap-2">
              <SelectModel onSelectAction={setSelectedModel} />
              <SliderTemperatureComponent />
          </div>
          
          {/* Sağdaki Link */}
          <Link 
              href="/models"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
          >
              Manage Models
          </Link>
      </div>
          <ChatContainerWithStream selectedModel={selectedModel} />
      </main>
      </ChatProvider>
  );

  
} 

export default ChatComponent;