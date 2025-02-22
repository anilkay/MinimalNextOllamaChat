"use client"
import { ChatProvider } from '../ChatContext';
import ChatContainerWithStream from './ChatContainerWithStream';
import 'react-toastify/dist/ReactToastify.css';
import { MainLayout } from '../components/MainLayout';

function ChatComponent() {

  return (
    <ChatProvider>
    <MainLayout leftLinkText="Chat Without Stream" leftLinkHref="/">
    <ChatContainerWithStream />
   </MainLayout>
   </ChatProvider>
  );

  
} 

export default ChatComponent;