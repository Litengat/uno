import { Hand } from "@/components/Hand";
import { useParams } from "react-router";

import { NameDialog } from "./components/NameDialog";

import DndContextProvider from "./components/DndContext";

import { LayedCardstack } from "./components/LayedCardstack";

import { Button } from "./components/ui/button";
import { useWebSocket, WebSocketProvider } from "./WebsocketProvider";

export function Game() {
  const { id } = useParams();
  if (!id) {
    throw new Error("No game ID provided");
  } // Ensure id is a string
  const url = import.meta.env.VITE_WEBSOCKET_URL + id;

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
      <WebSocketProvider url={url}>
        <DndContextProvider>
          <div className="flex justify-center items-center">
            <div className="flex justify-center fixed -bottom-120">
              <Hand />
            </div>
          </div>
          <NameDialog />
          <JoinButton />
          <div className="flex justify-center items-center">
            <div>
              <LayedCardstack />
            </div>
          </div>
        </DndContextProvider>
      </WebSocketProvider>
    </div>
  );
}

function JoinButton() {
  const websocket = useWebSocket();
  return (
    <Button
      onClick={() => {
        websocket.sendEvent("Join", {
          name: "max",
          playerId: "",
        });
      }}
    >
      {" "}
      join
    </Button>
  );
}
