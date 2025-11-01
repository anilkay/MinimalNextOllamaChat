"use client";

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ChatHistory } from '@/types/chat';

interface ChatStore {
  // State
  temperature: number;
  seedValue: number;
  seedUsage: boolean;
  selectedModel: string;
  systemPrompt: string;
  systemPromptUsage: boolean;
  chatHistory: ChatHistory[];
  
  // Actions
  setTemperature: (value: number) => void;
  setSeedValue: (value: number) => void;
  setSeedUsage: (value: boolean) => void;
  setSelectedModel: (value: string) => void;
  setSystemPrompt: (value: string) => void;
  setSystemPromptUsage: (value: boolean) => void;
  setChatHistory: (value: ChatHistory[]) => void;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        temperature: 0.7,
        seedValue: 0,
        seedUsage: false,
        selectedModel: "",
        systemPrompt: "",
        systemPromptUsage: false,
        chatHistory: [],
        
        // Actions
        setTemperature: (value) => set({ temperature: value }),
        setSeedValue: (value) => set({ seedValue: value }),
        setSeedUsage: (value) => set({ seedUsage: value }),
        setSelectedModel: (value) => set({ selectedModel: value }),
        setSystemPrompt: (value) => set({ systemPrompt: value }),
        setSystemPromptUsage: (value) => set({ systemPromptUsage: value }),
        setChatHistory: (value) => set({ chatHistory: value }),
      }),
      {
        name: 'chat-storage', // name of item in localStorage
      }
    ),
    {
      name: 'ChatStore', // name for devtools
    }
  )
);
