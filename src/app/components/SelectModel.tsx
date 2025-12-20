"use client"

import {useEffect, useState} from "react";
import {GetModels, Model} from "@/app/Services/OllamaService";
import { useChatContext } from "../ChatContext";
import { ChevronDown, Loader2, Box } from 'lucide-react';

export function SelectModel() {
    const [models, setModels] = useState<Model[]|undefined>([]);
    const [loading, setLoading] = useState(true);
    const [localSelectedModel, setLocalSelectedModel] = useState("");
    const {setSelectedModel} = useChatContext();
    const error= null

    useEffect(() => {
        GetModels().then( (result)=>{
            setLoading(false);
            setModels(result.data?.models)
        })
    }, []);

    const handleSelect = (model: string) => {
        setSelectedModel(model)
        setLocalSelectedModel(model)
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                <span>Loading models...</span>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 text-xs">Error loading models</div>;
    }

    return (
        <div className="relative min-w-[200px]">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <Box size={14} />
            </div>
            <select
                className="w-full appearance-none bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-md 
                         pl-9 pr-8 py-1.5 text-sm border border-gray-700 
                         focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50
                         transition-colors cursor-pointer"
                value={localSelectedModel}
                onChange={(e) => handleSelect(e.target.value)}
            >
                <option value="">Select a Model</option>
                {models?.map((model) => (
                    <option 
                        key={model.model} 
                        value={model.name}
                        className="bg-gray-800 text-gray-200"
                    >
                        {model.name}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown size={14} />
            </div>
        </div>
    );
}
