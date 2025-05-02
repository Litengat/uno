import { Hand } from "@/components/Hand";
import { useParams } from "react-router";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { NameDialog } from "./components/NameDialog";

import DndContextProvider from "./components/DndContext";

import { LayedCardstack } from "./components/LayedCardstack";
import { useHandStore } from "./state";
import { Card } from "./types";
import { useEffect } from "react";

export function Game() {
  const { id } = useParams();
  if (!id) {
    throw new Error("No game ID provided");
  } // Ensure id is a string
  const hand = useHandStore((state) => state.Hand);
  const setHand = useHandStore((state) => state.setHand);

  const cards: Card[] = Array.from({ length: 10 }, (_, i) => ({
    id: crypto.randomUUID(),
    color: "red",
    type: "number",
    number: i,
  }));
  useEffect(() => {
    setHand(cards);
  }, []);

  // const { sendMessage, lastMessage, readyState } = useWebSocket(
  //   `ws://localhost:5173/websocket/${id}`,
  //   {
  //     onOpen: () => console.log("WebSocket connection opened"),
  //     onClose: () => console.log("WebSocket connection closed"),
  //     onError: (event) => console.error("WebSocket error:", event),
  //     shouldReconnect: (closeEvent) => true,
  //   }
  // );

  return (
    <div>
      <DndContextProvider>
        <div className="flex justify-center items-center">
          <div className="flex justify-center fixed -bottom-120">
            <Hand />
          </div>
        </div>
        <NameDialog />
        <div className="flex justify-center items-center">
          <div>
            <LayedCardstack />
          </div>
        </div>
      </DndContextProvider>
    </div>
  );
}
