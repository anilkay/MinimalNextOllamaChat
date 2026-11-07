"use client";

import { AppProvider } from "@/app/store/AppContext";
import { Page } from "@/app/lib/types";
import { MainLayout } from "./MainLayout";
import { ChatContainer } from "./ChatContainer";
import { EmbeddingsPanel } from "./EmbeddingsPanel";
import { DecisionPanel } from "./DecisionPanel";

export default function ChatApp({ page }: { page: Page }) {
  return (
    <AppProvider streaming={page === "chatstream"}>
      <MainLayout page={page}>
        {page === "embeddings" ? (
          <EmbeddingsPanel />
        ) : page === "decide" ? (
          <DecisionPanel />
        ) : (
          <ChatContainer />
        )}
      </MainLayout>
    </AppProvider>
  );
}
