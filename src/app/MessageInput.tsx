"use client";

import { memo, useCallback } from "react";
import { useChatContext } from "./ChatContext";


const MessageInput = memo(function MessageInput() {
    const { inputValue, setInputValue } = useChatContext();

    const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(event.currentTarget.value);
    }, [setInputValue]);

    return (
        <textarea
            value={inputValue}
            className="flex-1 w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none border border-gray-700/50"
            onChange={handleChange}
            placeholder="Type your message..."
        />
    );
});

export default MessageInput;
