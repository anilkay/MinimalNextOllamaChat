"use client";

import { useEffect, useState } from 'react';
import { GetModels, Model, PullModel, DeleteModel } from '../Services/OllamaService';
import Link from 'next/link';
import { ArrowLeft, Download, Trash2, RefreshCw, HardDrive, Box, Loader2 } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ModelsPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullModelName, setPullModelName] = useState('');
    const [pullStatus, setPullStatus] = useState('');
    const [isPulling, setIsPulling] = useState(false);

    useEffect(() => {
        fetchModels();
    }, []);

    const fetchModels = async () => {
        try {
            const result = await GetModels();
            setModels(result.data?.models || []);
        } catch (error) {
            console.error('Error loading models:', error);
            toast.error("Failed to load models");
        } finally {
            setLoading(false);
        }
    };

    const refreshModels = async () => {
        setIsRefreshing(true);
        try {
            const result = await GetModels();
            setModels(result.data?.models || []);
            toast.success("Models list updated");
        } catch (error) {
            console.error('Error refreshing models:', error);
            toast.error("Failed to refresh models");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handlePullModel = async () => {
        if (!pullModelName.trim()) return;

        setIsPulling(true);
        setPullStatus('Pulling model...');
        try {
            const result = await PullModel(pullModelName);

            if (result.error) {
                throw new Error('Pull model request failed');
            }

            setPullStatus('Model pulled successfully!');
            toast.success(`Model ${pullModelName} pulled successfully`);
            setPullModelName('');
            await refreshModels();
        } catch (error) {
            setPullStatus('Error pulling model');
            console.error('Error pulling model:', error);
            toast.error(`Failed to pull model ${pullModelName}`);
        } finally {
            setIsPulling(false);
            setTimeout(() => setPullStatus(''), 3000);
        }
    };

    const handleDeleteModel = async (modelName: string) => {
        if (!confirm(`Are you sure you want to delete ${modelName}?`)) return;

        try {
            const result = await DeleteModel(modelName);

            if (result.error) {
                throw new Error('Delete model request failed');
            }
            toast.success(`Model ${modelName} deleted`);
            await refreshModels();
        } catch (error) {
            console.error('Error deleting model:', error);
            toast.error(`Failed to delete model ${modelName}`);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
            <ToastContainer theme="dark" />
            
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            title="Back to Chat"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Box className="text-blue-500" />
                            Model Management
                        </h1>
                    </div>
                    <button 
                        onClick={refreshModels}
                        disabled={isRefreshing}
                        className={`p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Refresh List"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                
                {/* Pull Model Section */}
                <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden shadow-lg">
                    <div className="p-6 border-b border-gray-800 bg-gray-900/50">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                            <Download size={18} className="text-emerald-500" />
                            Pull New Model
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Download new models from the Ollama library</p>
                    </div>
                    <div className="p-6">
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={pullModelName}
                                    onChange={(e) => setPullModelName(e.target.value)}
                                    placeholder="e.g., llama3, mistral, codellama"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-4 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                                    onKeyDown={(e) => e.key === 'Enter' && handlePullModel()}
                                />
                            </div>
                            <button
                                onClick={handlePullModel}
                                disabled={!pullModelName.trim() || isPulling}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
                            >
                                {isPulling ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                {isPulling ? 'Pulling...' : 'Pull'}
                            </button>
                        </div>
                        {pullStatus && (
                            <div className={`mt-4 text-sm p-3 rounded-lg ${pullStatus.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {pullStatus}
                            </div>
                        )}
                    </div>
                </section>

                {/* Installed Models Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                            <HardDrive size={18} className="text-purple-500" />
                            Installed Models
                            <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full ml-2">
                                {models.length}
                            </span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                            <p>Loading installed models...</p>
                        </div>
                    ) : models.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900 rounded-xl border border-gray-800 border-dashed">
                            <Box size={48} className="mx-auto text-gray-700 mb-4" />
                            <p className="text-gray-400">No models installed yet.</p>
                            <p className="text-sm text-gray-600 mt-2">Use the input above to pull your first model.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {models.map((model) => (
                                <div
                                    key={model.name}
                                    className="group bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-200 group-hover:text-blue-400 transition-colors">
                                                {model.name}
                                            </h3>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 font-mono">
                                                <span className="bg-gray-950 px-2 py-1 rounded border border-gray-800">
                                                    {formatSize(model.size)}
                                                </span>
                                                <span>{model.details?.family || 'Unknown family'}</span>
                                                <span>{model.details?.parameter_size || ''}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-gray-950 rounded-lg text-gray-600">
                                            <Box size={20} />
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-end pt-4 border-t border-gray-800/50 mt-2">
                                        <button
                                            onClick={() => handleDeleteModel(model.name)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete Model"
                                        >
                                            <Trash2 size={16} />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
