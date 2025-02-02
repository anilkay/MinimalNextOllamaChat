"use client"
import { useState } from 'react';
import { ChatProvider } from '../ChatContext';
import ChatContainerWithStream from './ChatContainerWithStream';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FrontMenu } from '../components/FrontMenu';

function ChatComponent() {
  const [selectedModel, setSelectedModel] = useState("");

  return (
      <ChatProvider>
      <ToastContainer />
      <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="h-[10vh] flex items-center justify-between px-4 border-b border-gray-700/50">
      <FrontMenu setSelectedModel={setSelectedModel} leftLinkText="Chat Without Stream" leftLinkHref="/" />
      </div>
          <ChatContainerWithStream selectedModel={selectedModel} />
      </main>
      </ChatProvider>
  );

  
} 

export default ChatComponent;