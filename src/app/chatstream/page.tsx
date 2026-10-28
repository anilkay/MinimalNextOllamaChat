"use client";

import { ClientChatApp } from "@/app/components/ClientChatApp";

export default function ChatStream() {
  return <ClientChatApp streaming={true} />;
}
