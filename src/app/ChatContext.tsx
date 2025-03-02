"use client";

import { createContext, useContext, ReactNode, useRef, useMemo, useState, useCallback } from 'react';
import { ChatHistory } from './page';

interface ChatContextType {
    temperature:() => number,
    setTemperature: (value: number)=> void,
    seedValue:()=>number,
    setSeedValue: (value: number)=> void,
    seedUsage:()=>boolean,
    setSeedUsage: (value: boolean)=> void,
    selectedModel:()=> string,
    setSelectedModel: (value: string)=> void,
    systemPrompt:()=>string,
    setSystemPrompt: (value: string)=> void,
    systemPromptUsage:()=>boolean,
    setSystemPromptUsage: (value: boolean)=> void,
    chatHistory: ChatHistory[],
    setChatHistory: (value: ChatHistory[])=> void
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {

    const temperatureRef= useRef(0.7);
    const seedValueRef=useRef(0);
    const seedUsageRef=useRef(false);
    const selectedModelRef=useRef("")
    const systemPromptRef=useRef("")
    const systemPromptUsageRef=useRef(false)

    const [chatHistory,setChatHistory]=useState<ChatHistory[]>([]);
    

    const setTemperature = useCallback((temperature: number) => {
        temperatureRef.current = temperature;
    }, [temperatureRef]);

    const temperature = useCallback(() => temperatureRef.current, [temperatureRef]);

    const setSelectedModel = useCallback((value: string) => {
            selectedModelRef.current = value
    }, [selectedModelRef]);

    const selectedModel = useCallback(() => selectedModelRef.current, [selectedModelRef]);

    const setSeedUsage = useCallback((value: boolean) => {
        seedUsageRef.current = value;
    }, [seedUsageRef]);

    const seedUsage = useCallback(() => seedUsageRef.current, [seedUsageRef]);

    const setSeedValue = useCallback((value: number) => {
        seedValueRef.current = value;
    }, [seedValueRef]);

    const seedValue = useCallback(() => seedValueRef.current, [seedValueRef]);

    const setSystemPrompt = useCallback((value: string) => {
        systemPromptRef.current = value;
    }, [systemPromptRef]);

    const systemPrompt = useCallback(() => systemPromptRef.current, [systemPromptRef]);

    const setSystemPromptUsage = useCallback((value: boolean) => {
        systemPromptUsageRef.current = value;
    }, [systemPromptUsageRef]);

    const systemPromptUsage = useCallback(() => systemPromptUsageRef.current, [systemPromptUsageRef]);  
    
    const contextValue = useMemo(() => {
        return {
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
            setSystemPromptUsage,
            chatHistory,
            setChatHistory
        };
    }, [chatHistory]);

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
