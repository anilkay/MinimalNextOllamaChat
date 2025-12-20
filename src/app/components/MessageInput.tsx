"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';

interface MessageInputProps {
    onSendChatMessageAction: (chatMessage: { message: string; image: File | null }) => Promise<boolean | undefined>;
}

const MessageInput = function MessageInput(props: MessageInputProps) {
    const [localInputValue, setLocalInputValue] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [localInputValue]);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalInputValue(event.currentTarget.value);
    };

    const clearImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const sendMessage = async () => {
        if (!localInputValue.trim() && !image) return;

        const messageToSend = localInputValue;
        const imageToSend = image;
        
        // Optimistic clear
        setLocalInputValue("");
        clearImage();
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        const canSend = await props.onSendChatMessageAction({ message: messageToSend, image: imageToSend });

        if (!canSend) {
            // Restore if failed (optional, but good UX)
            setLocalInputValue(messageToSend);
            setImage(imageToSend);
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            const file = event.target.files[0];
            setImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            sendMessage();
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 transition-all duration-200">
            {/* Image Preview Area */}
            {imagePreview && (
                <div className="px-4 pt-4 pb-2 relative">
                    <div className="relative inline-block">
                        <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="h-20 w-auto rounded-lg border border-gray-600 object-cover"
                        />
                        <button 
                            onClick={clearImage}
                            className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1 hover:bg-red-500 transition-colors shadow-md"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex items-end gap-2 p-3">
                {/* File Input Button */}
                <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden"
                />
                <button
                    onClick={triggerFileInput}
                    className={`p-2 rounded-lg transition-colors ${
                        image 
                        ? 'text-blue-400 bg-blue-400/10 hover:bg-blue-400/20' 
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                    }`}
                    title="Attach image"
                >
                    {image ? <ImageIcon size={20} /> : <Paperclip size={20} />}
                </button>

                {/* Text Input */}
                <textarea
                    ref={textareaRef}
                    value={localInputValue}
                    className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-sm focus:outline-none resize-none py-2 max-h-[200px] overflow-y-auto"
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                />

                {/* Send Button */}
                <button
                    className={`p-2 rounded-lg transition-all duration-200 ${
                        localInputValue.trim() || image
                            ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                    onClick={sendMessage}
                    disabled={!localInputValue.trim() && !image}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
