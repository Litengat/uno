import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { safeJsonParse } from "@/lib/utils";
import { EventMap } from "@/events/sendEvents";
import { handleEvent } from "@/events/events";
type WebSocketContextType = {
  sendEvent: <K extends keyof EventMap>(
    eventName: K,
    payload: EventMap[K]
  ) => void;
};

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
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket(url);

    socketRef.current.onopen = () => {
      console.log("WebSocket connected");
    };

    (socketRef.current.onmessage = (event) => {
      const parsed = safeJsonParse(event.data);
      if (parsed.isErr()) {
        console.error("Error parsing event", parsed.error);
        return;
      }
      const result = handleEvent(parsed.value);
    }),
      (socketRef.current.onclose = () => {
        console.log("WebSocket disconnected");
      });

    return () => {
      socketRef.current?.close();
    };
  }, [url]);

  const sendEvent = <K extends keyof EventMap>(
    eventName: K,
    payload: EventMap[K]
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
