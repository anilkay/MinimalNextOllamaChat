"use client"
import { ChatProvider } from '../ChatContext';
import ChatContainerWithStream from './ChatContainerWithStream';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FrontMenu } from '../components/FrontMenu';
import { LeftMenu } from '../components/LeftMenu';

function ChatComponent() {

  return (
    <ChatProvider>
    <ToastContainer />
    <main className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="flex">
            <div className="w-1/6"> {/* Adjust width as needed */}
                <LeftMenu />
            </div>
            <div className="flex-1"> {/* This will take the remaining space */}
                <div className="h-[10vh] flex items-center justify-between px-4 border-b border-gray-700/50">
                    <FrontMenu leftLinkText="Chat Without Stream" leftLinkHref="/" />
                </div>
                <ChatContainerWithStream />
            </div>
        </div>
    </main>
</ChatProvider>
  );

  
} 

export default ChatComponent;