"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
    inputValue: string;
    setInputValue: (value: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [inputValue, setInputValue] = useState("");

    const contextValue = {
        inputValue,
        setInputValue
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
}
