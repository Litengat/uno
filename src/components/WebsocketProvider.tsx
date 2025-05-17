import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
  useState,
} from "react";

import { WSClient } from "@/ws/ws.client";
import { clientRouter } from "@/ws/routes";
import { serverRouter } from "../../worker/route";
import { createMRPCClient, inferClientType } from "../../worker/mrpc/mini-trpc";

type WebSocketContextType = inferClientType<typeof serverRouter>;

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

interface WebSocketProviderProps {
  url: string;
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  url,
  children,
}) => {
  const socketRef = useRef<WSClient | null>(null);
  const [mrpc, setMrpc] = useState<WebSocketContextType | null>(null);

  useEffect(() => {
    if (!url) return;

    console.log("Initializing WebSocket connection...");
    socketRef.current = new WSClient(clientRouter, {
      url: url,
      reconnect: true,
      onOpen: () => {
        console.log("Connected to server");
        // Create the MRPC client after connection is established
        const client = createMRPCClient<typeof serverRouter>(
          serverRouter,
          <TInput, TOutput>(path: string[], input: TInput) => {
            if (!socketRef.current) {
              throw new Error("WebSocket client not initialized");
            }
            return socketRef.current.callServer(path, input);
          }
        );
        setMrpc(client);
      },
      onClose: () => console.log("Disconnected from server"),
      onError: (error) => console.error("WebSocket error:", error),
      onNotification: (notification) => {
        console.log(
          `Server notification: ${notification.event}`,
          notification.payload
        );
      },
    });

    // Connect to the server
    socketRef.current.connect();

    return () => {
      socketRef.current?.disconnect();
      setMrpc(null);
    };
  }, [url]);

  if (!mrpc) {
    return null; // or a loading state
  }

  return (
    <WebSocketContext.Provider value={mrpc}>
      {children}
    </WebSocketContext.Provider>
  );
};
