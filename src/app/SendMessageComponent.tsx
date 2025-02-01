"use client";

import { useCallback, useRef, useState } from "react";
import { memo } from "react";
import { useChatContext } from "./ChatContext";
import MessageInput from "./MessageInput";

const SendMessageComponent = memo(function SendMessageComponent({
    onSendChatMessageAction,
}: {
    onSendChatMessageAction: (chatMessage: { message: string; image: File | null }) => void;
}) {
    const { inputValue, setInputValue } = useChatContext();
    const [image, setImage] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setImage(event.target.files[0]);
        }
    };

    const sendMessage = useCallback(() => {
        if (inputValue.trim() !== "") {
            onSendChatMessageAction({ message: inputValue, image });
            setInputValue("");
            setImage(null);
            if (fileInputRef.current !== null) {
                fileInputRef.current.value = "";
            }
        }
    }, [inputValue, onSendChatMessageAction, image]);

    return (
        <div className="flex flex-col h-full gap-4">
            <MessageInput />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
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