"use client";
import { Hand } from "@/components/Hand";

import { NameDialog } from "@/components/NameDialog";

import DndContextProvider from "@/components/DndContext";

import { LayedCardstack } from "@/components/LayedCardstack";

import { Button } from "@/components/ui/button";
import {
  useWebSocket,
  WebSocketProvider,
} from "@/components/WebsocketProvider";

import { useParams } from "next/navigation";

import Drawcard from "@/components/Drawcard";
import OtherPlayer from "@/components/OtherPlayer";
import { useGameStore, usePlayerStore } from "@/app/state";
import { useState } from "react";
import { env } from "@/env";

export default function Game() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    throw new Error("No game ID provided");
  } // Ensure id is a string

  const url = env.NEXT_PUBLIC_API_URL + "/websocket/" + id;

  const [openNameDialog, setOpenNameDialog] = useState(true);

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
          <div className="flex items-center justify-center">
            <div className="fixed -bottom-120 z-10 flex justify-center">
              <Hand />
            </div>
          </div>
          <NameDialog open={openNameDialog} setOpen={setOpenNameDialog} />
          <StartButton />
          {/* <div className=" absolute w-screen h-screen"> */}
          <div className="flex items-center justify-center">
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
  const websocket = useWebSocket();
  return (
    <Button
      onClick={() => {
        websocket.sendEvent("StartGame", {});
      }}
    >
      {" "}
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

  console.log(players);
  return (
    <div className="absolute top-0 right-0 bottom-0 left-0 -z-1 h-screen w-screen">
      {otherplayers.map((player, i) => (
        <div key={player.id} className={`absolute ${playerPostions[i]?.pos}`}>
          <OtherPlayer player={player} rotation={playerPostions[i]?.rot ?? 0} />
        </div>
      ))}
    </div>
  );
}
