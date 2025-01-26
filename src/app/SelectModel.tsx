"use client"

import {useEffect, useState} from "react";
import {GetModels, Model} from "@/app/Services/OllamaService";

export function SelectModel({ onSelectAction }: { onSelectAction: (model: string) => void }) {
    const [models, setModels] = useState<Model[]|undefined>([]);
    const [loading, setLoading] = useState(true);
    const [selectedModel, setSelectedModel] = useState("")
    const error= null

    useEffect(() => {
        GetModels().then( (result)=>{
            setLoading(false);
            setModels(result.data?.models)
        })
    }, []);

    const handleSelect = (model: string) => {
        setSelectedModel(model)
        onSelectAction(model);
    };

    return (
        <div className="select-model-container w-full max-w-md mx-auto">
            {loading ? (
                <p className="text-gray-400">Yükleniyor...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <select
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg 
                             px-4 py-2 text-sm border border-gray-700/50 
                             focus:outline-none focus:ring-2 focus:ring-blue-500/50
                             shadow-lg backdrop-blur-sm"
                    value={selectedModel}
                    onChange={(e) => handleSelect(e.target.value)}
                >
                    <option value="">Model Seçin</option>
                    {models?.map((model) => (
                        <option 
                            key={model.model} 
                            value={model.name}
                            className="bg-gray-800"
                        >
                            {model.name}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
