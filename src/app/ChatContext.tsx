"use client";

import { createContext, useContext, ReactNode, useRef, useMemo } from 'react';

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
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
    //const [inputValue, setInputValue] = useState("");
    const temperatureRef= useRef(0.7);
    const seedValueRef=useRef(0);
    const seedUsageRef=useRef(false);
    const selectedModelRef=useRef("")
    const systemPromptRef=useRef("")
    const systemPromptUsageRef=useRef(false)
    

    const setTemperature= (temperature:number)=> {
        temperatureRef.current=temperature
    }

    const temperature= ()=> temperatureRef.current;

   const setSelectedModel= (value: string)=> {
            selectedModelRef.current=value
    }
    
    const selectedModel=()=> selectedModelRef.current;

    const setSeedUsage= (value: boolean)=> {
        seedUsageRef.current=value
    }
    
    const seedUsage=()=> seedUsageRef.current;

    const setSeedValue= (value: number)=> {
        seedValueRef.current=value
    }
    
    const seedValue=()=> seedValueRef.current;

    const setSystemPrompt= (value: string)=> {
        systemPromptRef.current=value
    }
    
    const systemPrompt=()=> systemPromptRef.current;

    const setSystemPromptUsage= (value: boolean)=> {
        systemPromptUsageRef.current=value
    }
    
    const systemPromptUsage=()=> systemPromptUsageRef.current;
    
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
            setSystemPromptUsage
        };
    }, []);

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
