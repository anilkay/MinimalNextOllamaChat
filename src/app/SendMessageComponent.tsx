"use client";

import { useCallback } from "react";
import { memo } from "react";
import { useChatContext } from "./ChatContext";
import MessageInput from "./MessageInput";

const SendMessageComponent = memo(function SendMessageComponent({
    onSendChatMessageAction,
}: {
    onSendChatMessageAction: (chatMessage: string) => void;
}) {
    const { inputValue, setInputValue } = useChatContext();

    const sendMessage = useCallback(() => {
        if (inputValue.trim() !== "") {
            onSendChatMessageAction(inputValue);
            setInputValue("");
        }
    }, [inputValue, onSendChatMessageAction, setInputValue]);

    return (
        <div className="flex flex-col h-full gap-4">
            <MessageInput />
            <button
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={sendMessage}
                disabled={inputValue.trim() === ""}
            >
                Send
            </button>
        </div>
    );
});

export { SendMessageComponent };