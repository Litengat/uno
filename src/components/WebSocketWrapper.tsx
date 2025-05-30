"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

// Dynamically import the WebSocketProvider to prevent SSR issues
const WebSocketProvider = dynamic(
  () =>
    import("./WebsocketProvider").then((mod) => ({
      default: mod.WebSocketProvider,
    })),
  {
    ssr: false,
    loading: () => <div>Connecting to game...</div>,
  },
);

interface WebSocketWrapperProps {
  url: string;
  children: ReactNode;
}

export const WebSocketWrapper: React.FC<WebSocketWrapperProps> = ({
  url,
  children,
}) => {
  return <WebSocketProvider url={url}>{children}</WebSocketProvider>;
};
