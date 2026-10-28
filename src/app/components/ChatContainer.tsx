"use client";

import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function ChatContainer() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <MessageList />
      </div>
      <div className="flex-shrink-0 border-t border-gray-800 bg-gray-900/50 p-4">
        <div className="max-w-3xl mx-auto">
          <MessageInput />
        </div>
      </div>
    </div>
  );
}
