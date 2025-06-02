"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { safeJsonParse } from "@/lib/utils";
import { type EventMap } from "@/events/sendEvents";
import { handleEvent } from "@/events/events";
import { authClient } from "@/lib/auth-client";
import { env } from "@/env";

type WebSocketContextType = {
  sendEvent: <K extends keyof EventMap>(
    eventName: K,
    payload: EventMap[K],
  ) => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
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
  const socketRef = useRef<WebSocket | null>(null);
  const [JWT, setJWT] = useState<string>();

  useEffect(() => {
    void authClient.getSession({
      fetchOptions: {
        onSuccess: (ctx) => {
          const jwt = ctx.response.headers.get("set-auth-jwt");
          console.log("JWT inside callback:", jwt);
          if (!jwt) return;
          setJWT(jwt);
        },
      },
    });
  }, []);

  useEffect(() => {
    if (!JWT) {
      return;
    }

    const urlWithJWT = url + "/?token=" + JWT;

    console.log("Connection State: ", socketRef.current?.readyState);
    if (socketRef.current) return;
    console.log("Connecting to WebSocket at", urlWithJWT);
    socketRef.current = new WebSocket(urlWithJWT);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    socketRef.current.onmessage = (event) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const parsed = safeJsonParse(event.data);
      if (parsed.isErr()) {
        console.error("Error parsing event", parsed.error);
        return;
      }
      console.log("Message:", parsed.value);
      const result = handleEvent(parsed.value);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (
        socketRef.current &&
        !(socketRef.current.readyState === socketRef.current.CONNECTING)
      ) {
        console.log("Websocket closes");
        socketRef.current.close();
      }
    };
  }, [url, JWT]);

  const sendEvent = <K extends keyof EventMap>(
    eventName: K,
    payload: EventMap[K],
  ) => {
    const event = {
      type: eventName,
      ...payload,
    };
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(event));
    } else {
      console.warn("WebSocket not open");
    }
  };

  return (
    <WebSocketContext.Provider value={{ sendEvent }}>
      {children}
    </WebSocketContext.Provider>
  );
};
