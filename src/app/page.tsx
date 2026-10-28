"use client";

import { AppProvider } from "@/app/store/AppContext";
import { MainLayout } from "@/app/components/MainLayout";
import { ChatContainer } from "@/app/components/ChatContainer";

export default function Home() {
  return (
    <AppProvider>
      <MainLayout>
        <ChatContainer />
      </MainLayout>
    </AppProvider>
  );
}
