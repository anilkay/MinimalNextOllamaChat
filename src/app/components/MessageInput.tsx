"use client";

import { memo, useState, useRef } from "react";

interface MessageInputProps {
    onSendChatMessageAction: (chatMessage: { message: string; image: File | null }) => Promise<boolean | undefined>;
}


const MessageInput = memo(function MessageInput(props: MessageInputProps) {
    const [localInputValue, setLocalInputValue] = useState("");
    const [ image, setImage] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // React Compiler handles function stability automatically
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalInputValue(event.currentTarget.value);
    };

    const sendMessage = async () => {
        const messageToSend = localInputValue;
        setLocalInputValue("");
        const canSend = await props.onSendChatMessageAction({ message: messageToSend, image: image });

        if (canSend) {
            setImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
       
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            setImage(event.target.files[0]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter => send, Shift+Enter => new line
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
        <textarea
            value={localInputValue}
            className="flex-1 w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none border border-gray-700/50"
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
        />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
            <button
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={sendMessage}
                disabled={localInputValue.trim() === ""}
            >
                Send
            </button>
        </>
    );
});

export default MessageInput;
