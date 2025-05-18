import { Hand } from "@/components/Hand";
import { useParams } from "react-router";

import { NameDialog } from "./components/NameDialog";

import DndContextProvider from "./components/DndContext";

import { LayedCardstack } from "./components/LayedCardstack";

import { Button } from "./components/ui/button";
import {
  useWebSocket,
  WebSocketProvider,
} from "@/components/WebsocketProvider";
import Drawcard from "./components/Drawcard";
import OtherPlayer from "./components/OtherPlayer";
import { useGameStore, usePlayerStore } from "./state";
import { useState } from "react";
import { WS } from "./ws/ws";

export function Game() {
  const { id } = useParams();
  if (!id) {
    throw new Error("No game ID provided");
  } // Ensure id is a string

  const url = import.meta.env.VITE_WEBSOCKET_URL + id;

  const [openNameDialog, setOpenNameDialog] = useState(true);

  return (
    <div>
      <WebSocketProvider url={url}>
        <DndContextProvider>
          <div className="flex justify-center items-center">
            <div className="flex justify-center fixed -bottom-120 z-10">
              <Hand />
            </div>
          </div>
          <NameDialog open={openNameDialog} setOpen={setOpenNameDialog} />
          <StartButton />

          <div className="flex justify-center items-center">
            <div className="flex gap-30">
              <Drawcard />
              <LayedCardstack />
            </div>

            <Otherplayers />
          </div>
        </DndContextProvider>
      </WebSocketProvider>
    </div>
  );
}

function StartButton() {
  const mrcp = useWebSocket();
  const yourId = useGameStore((state) => state.yourId);

  return (
    <Button
      onClick={async () => {
        if (!mrcp || !yourId) return;
        await mrcp.meta.startGame({ playerid: yourId });
      }}
    >
      Start
    </Button>
  );
}

const playerPostions = [
  { pos: "top-[15%] left-10", rot: 110 },
  { pos: "top-[75%] left-10", rot: 70 },
  { pos: "top-[15%] right-10", rot: -110 },
  { pos: "top-[15%] right-10", rot: -70 },
];

function Otherplayers() {
  const players = usePlayerStore((store) => store.players);
  const yourId = useGameStore((store) => store.yourId);
  const otherplayers = players.filter((p) => p.id !== yourId).slice(0, 4);

  return (
    <div className="absolute left-0 top-0 right-0 bottom-0 w-screen h-screen -z-1">
      {otherplayers.map((player, i) => (
        <div className={`absolute ${playerPostions[i].pos}`}>
          <OtherPlayer player={player} rotation={playerPostions[i].rot} />
        </div>
      ))}
    </div>
  );
}
