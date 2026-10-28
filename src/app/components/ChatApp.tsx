"use client";

import { AppProvider } from "@/app/store/AppContext";
import { MainLayout } from "./MainLayout";
import { ChatContainer } from "./ChatContainer";

export default function ChatApp({ streaming }: { streaming: boolean }) {
  return (
    <AppProvider streaming={streaming}>
      <MainLayout>
        <ChatContainer />
      </MainLayout>
    </AppProvider>
  );
}
