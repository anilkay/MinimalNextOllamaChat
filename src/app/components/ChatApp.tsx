"use client";

import { usePathname } from "next/navigation";
import { AppProvider } from "@/app/store/AppContext";
import { MainLayout, NAV } from "./MainLayout";
import { ChatContainer } from "./ChatContainer";
import { EmbeddingsPanel } from "./EmbeddingsPanel";
import { DecisionPanel } from "./DecisionPanel";

/**
 * The app shell. The root layout renders it once, so the conversation and loaded MCP
 * tools survive moving between pages; the page shown follows the URL.
 */
export default function ChatApp({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/\/+$/, "") || "/";
  const page = NAV.find((item) => item.href === pathname)?.page;
  // Not one of the app's pages (e.g. the 404 page): show what the route rendered.
  if (!page) return <>{children}</>;

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
