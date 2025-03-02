"use client";

import { memo } from "react";
import MessageInput from "./MessageInput";

const SendMessageComponent = memo(function SendMessageComponent({
    onSendChatMessageAction,
}: {
    onSendChatMessageAction: (chatMessage: { message: string; image: File | null }) => Promise<boolean | undefined>
}) {

   


    const sendMessage = async (chatMessage: { message: string; image: File | null }) => {
        if (chatMessage.message.trim() === "") {
            return false;
        }
        const canSend= await onSendChatMessageAction(chatMessage);
        return canSend;
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <MessageInput onSendChatMessageAction={sendMessage}/>
        </div>
    );
});

export { SendMessageComponent };