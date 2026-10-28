"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ModelSelect } from "./ModelSelect";
import { useApp } from "@/app/store/AppContext";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { clearChat, streaming } = useApp();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <ToastContainer theme="dark" position="bottom-right" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <ModelSelect />
          <div className="flex items-center gap-2">
            <Link
              href={streaming ? "/" : "/chatstream"}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-200 transition-colors"
            >
              <MessageSquare size={14} />
              {streaming ? "Chat Without Stream" : "Chat With Stream"}
            </Link>
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-200 transition-colors"
            >
              <Plus size={14} />
              New chat
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0">{children}</main>
      </div>
    </div>
  );
}
