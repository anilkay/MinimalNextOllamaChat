"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
    inputValue: string;
    setInputValue: (value: string) => void;
    temperature:number,
    setTemperature: (value: number)=> void,
    seedValue:number,
    setSeedValue: (value: number)=> void,
    seedUsage:boolean,
    setSeedUsage: (value: boolean)=> void,
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [inputValue, setInputValue] = useState("");
    const [temperature,setTemperature]=useState(0.7);
    const [seedValue,setSeedValue]=useState(0);
    const [seedUsage,setSeedUsage]=useState(false);

    const contextValue = {
        inputValue,
        setInputValue,
        temperature,
        setTemperature,
        seedValue,
        setSeedValue,
        seedUsage,
        setSeedUsage
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
