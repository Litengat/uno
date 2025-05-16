import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";

import { WSClient } from "@/ws/ws.client";
import { clientRouter } from "@/ws/routes";
import { serverRouter } from "../../worker/route";
import { inferClientType } from "worker/mrpc/mini-trpc";

type WebSocketContextType = inferClientType<typeof serverRouter>;

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocket = (): WebSocketContextType => {
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
  const mrpc = useRef<inferClientType<typeof serverRouter> | null>(null);

  useEffect(() => {
    socketRef.current = new WSClient(clientRouter, {
      url: url,
      reconnect: true,
      onOpen: () => console.log("Connected to server"),
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

    // Create a typed client for calling server procedures
    mrpc.current = socketRef.current.createTypedServerCaller(serverRouter);
  }, [url]);

  return (
    <WebSocketContext.Provider value={mrpc.current ?? undefined}>
      {children}
    </WebSocketContext.Provider>
  );
};
