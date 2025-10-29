"use client";

import MessageInput from "./MessageInput";

// React Compiler handles component optimization automatically
const SendMessageComponent = function SendMessageComponent({
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
};

export { SendMessageComponent };