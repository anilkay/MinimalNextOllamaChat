"use client"
import Link from 'next/link';
import { useState } from 'react';
import { ChatProvider } from '../ChatContext';
import { SelectModel } from '../components/SelectModel';
import ChatContainerWithStream from './ChatContainerWithStream';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SliderTemperatureComponent } from '../components/SliderTemperatureComponent';

function ChatComponent() {
  const [selectedModel, setSelectedModel] = useState("");

  return (
      <ChatProvider>
      <ToastContainer />
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