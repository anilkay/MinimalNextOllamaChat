"use client";

import dynamic from "next/dynamic";

// Settings live in localStorage, so render only on the client to avoid a
// hydration mismatch between the server defaults and the stored config.
export const ClientChatApp = dynamic(() => import("./ChatApp"), {
  ssr: false,
  loading: () => <div className="h-screen bg-gray-950" />,
});
