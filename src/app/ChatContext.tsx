"use client";

import { createContext, useContext, useState, ReactNode, useRef } from 'react';

interface ChatContextType {
    inputValue: () => string;
    setInputValue: (value: string) => void;
    temperature:number,
    setTemperature: (value: number)=> void,
    seedValue:number,
    setSeedValue: (value: number)=> void,
    seedUsage:boolean,
    setSeedUsage: (value: boolean)=> void,
    selectedModel:string,
    setSelectedModel: (value: string)=> void,
    systemPrompt:string,
    setSystemPrompt: (value: string)=> void,
    systemPromptUsage:boolean,
    setSystemPromptUsage: (value: boolean)=> void,
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
    //const [inputValue, setInputValue] = useState("");
    const inputValueRef= useRef("");
    const [temperature,setTemperature]=useState(0.7);
    const [seedValue,setSeedValue]=useState(0);
    const [seedUsage,setSeedUsage]=useState(false);
    const [selectedModel,setSelectedModel]=useState("");
    const [systemPrompt,setSystemPrompt]=useState("");
    const [systemPromptUsage,setSystemPromptUsage]=useState(false);

    const setInputValue= (inputValue:string)=> {
        inputValueRef.current=inputValue
    }

    const inputValue= ()=> inputValueRef.current;
    
    const contextValue = {
        inputValue,
        setInputValue,
        temperature,
        setTemperature,
        seedValue,
        setSeedValue,
        seedUsage,
        setSeedUsage,
        selectedModel,
        setSelectedModel,
        systemPrompt,
        setSystemPrompt,
        systemPromptUsage,
        setSystemPromptUsage
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
