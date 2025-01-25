"use client";

import { useState, useEffect } from 'react';
import { GetModels, Model, PullModel, DeleteModel } from '../Services/OllamaService';
import Link from 'next/link';

export default function ModelsPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [pullModelName, setPullModelName] = useState('');
    const [pullStatus, setPullStatus] = useState('');

    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            const result = await GetModels();
            setModels(result.data?.models || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading models:', error);
            setLoading(false);
        }
    };

    const handlePullModel = async () => {
        if (!pullModelName.trim()) return;
        
        setPullStatus('Pulling model...');
        try {
            await PullModel(pullModelName);
            setPullStatus('Model pulled successfully!');
            loadModels(); // Refresh model list
            setPullModelName('');
        } catch (error) {
            setPullStatus('Error pulling model');
            console.error('Error pulling model:', error);
        }
    };

    const handleDeleteModel = async (modelName: string) => {
        if (!confirm(`Are you sure you want to delete ${modelName}?`)) return;
        
        try {
            await DeleteModel(modelName);
            loadModels(); // Refresh model list
        } catch (error) {
            console.error('Error deleting model:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Model Management</h1>
                    <Link 
                        href="/"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200"
                    >
                        Back to Chat
                    </Link>
                </div>

                {/* Pull Model Section */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-lg shadow-lg mb-8 border border-gray-700/50">
                    <h2 className="text-xl font-semibold mb-4">Pull New Model</h2>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={pullModelName}
                            onChange={(e) => setPullModelName(e.target.value)}
                            placeholder="Enter model name (e.g., llama2)"
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button
                            onClick={handlePullModel}
                            disabled={!pullModelName.trim()}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50"
                        >
                            Pull Model
                        </button>
                    </div>
                    {pullStatus && (
                        <p className="mt-2 text-sm text-gray-300">{pullStatus}</p>
                    )}
                </div>

                {/* Installed Models Section */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-lg shadow-lg border border-gray-700/50">
                    <h2 className="text-xl font-semibold mb-4">Installed Models</h2>
                    {loading ? (
                        <p>Loading models...</p>
                    ) : models.length === 0 ? (
                        <p>No models installed</p>
                    ) : (
                        <div className="grid gap-4">
                            {models.map((model) => (
                                <div
                                    key={model.name}
                                    className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/30"
                                >
                                    <div>
                                        <h3 className="font-semibold">{model.name}</h3>
                                        <p className="text-sm text-gray-400">Size: {model.size}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteModel(model.name)}
                                        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
