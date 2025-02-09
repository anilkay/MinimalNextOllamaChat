"use client";

import { memo, useCallback, useState } from "react";
import { useChatContext } from "../ChatContext";

interface MessageInputProps {
    onSendChatMessageAction: (chatMessage: { message: string; image: File | null }) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    sendMessage: () => void;
}


const MessageInput = memo(function MessageInput(props: MessageInputProps) {
    const {setInputValue } = useChatContext();
    const [localInputValue, setLocalInputValue] = useState("");

    const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(event.currentTarget.value);
        setLocalInputValue(event.currentTarget.value);
    }, [setInputValue]);

    return (
        <>
        <textarea
            value={localInputValue}
            className="flex-1 w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none border border-gray-700/50"
            onChange={handleChange}
            placeholder="Type your message..."
        />
        <input ref={props.fileInputRef} type="file" accept="image/*" onChange={props.handleFileChange} />
            <button
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={props.sendMessage}
                disabled={localInputValue.trim() === ""}
            >
                Send
            </button>
        </>
    );
});

export default MessageInput;
