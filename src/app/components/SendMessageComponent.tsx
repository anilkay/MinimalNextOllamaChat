"use client";

import {useRef, useState } from "react";
import { memo } from "react";
import { useChatContext } from "../ChatContext";
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


    const sendMessage = () => {
        if (inputValue().trim() !== "") {
            onSendChatMessageAction({ message: inputValue(), image });
            setInputValue("");
            setImage(null);
            if (fileInputRef.current !== null) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <MessageInput onSendChatMessageAction={sendMessage} fileInputRef={fileInputRef} handleFileChange={handleFileChange} sendMessage={sendMessage} />
        </div>
    );
});

export { SendMessageComponent };