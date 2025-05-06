import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { safeJsonParse } from "@/lib/utils";
import { Eventmanager } from "@/events/EventManager";
import z from "zod";
import { useCardStackStore, useHandStore, usePlayerStore } from "@/state";
import { CardSchema } from "@/types";
import { EventMap } from "@/events/sendEvents";

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
  const eventManager = new Eventmanager();

  const addPlayer = usePlayerStore((state) => state.addPlayer);
  const addCard = useHandStore((state) => state.addCard);
  const addCardStackCard = useCardStackStore((state) => state.addCardStackCard);
  const decreaseplayerCards = usePlayerStore(
    (state) => state.decreaseplayerCards
  );
  const updatePlayerCards = usePlayerStore((state) => state.updatePlayerCards);
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
      const result = eventManager.run(parsed.value);

      if (result.isErr()) {
        console.error("Error running event", result.error);
      }
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

  eventManager.register({
    type: "PlayerJoined",
    schema: z.object({
      type: z.literal("PlayerJoined"),
      playerId: z.string(),
      name: z.string(),
      numberOfCards: z.number(),
    }),
    func: (event) => {
      addPlayer({
        id: event.playerId,
        name: event.name,
        numberOfCards: event.numberOfCards,
      });
    },
  });

  eventManager.register({
    type: "CardDrawn",
    schema: z.object({
      type: z.literal("CardDrawn"),
      card: CardSchema,
    }),
    func: (event) => {
      addCard(event.card);
    },
  });

  eventManager.register({
    type: "CardLaidDown",
    schema: z.object({
      type: z.literal("CardLaidDown"),
      playerId: z.string(),
      card: CardSchema,
    }),
    func: (event) => {
      addCardStackCard(event.card);
      decreaseplayerCards(event.playerId);
    },
  });
  eventManager.register({
    type: "UpdateCardCount",
    schema: z.object({
      type: z.literal("UpdateCardCount"),
      playerId: z.string(),
      numberOfCards: z.number(),
    }),
    func: (event) => {
      updatePlayerCards(event.playerId, event.numberOfCards);
    },
  });

  return (
    <WebSocketContext.Provider value={{ sendEvent }}>
      {children}
    </WebSocketContext.Provider>
  );
};
