"use client";

import { memo } from "react";
import MessageInput from "./MessageInput";

const SendMessageComponent = memo(function SendMessageComponent({
    onSendChatMessageAction,
}: {
    onSendChatMessageAction: (chatMessage: { message: string; image: File | null }) => void;
}) {

   


    const sendMessage = (chatMessage: { message: string; image: File | null }) => {
        if (chatMessage.message.trim() !== "") {
            onSendChatMessageAction(chatMessage);
            return true;
        }
        return false;
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <MessageInput onSendChatMessageAction={sendMessage}/>
        </div>
    );
});

export { SendMessageComponent };