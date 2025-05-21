import { Hand } from "@/components/Hand";
import { useParams } from "react-router";
import { api } from "../convex/_generated/api";
import { NameDialog } from "./components/NameDialog";

import DndContextProvider from "./components/DndContext";
import { ConvexReactClient, useQuery, useMutation } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { LayedCardstack } from "./components/LayedCardstack";

import { Button } from "./components/ui/button";

import Drawcard from "./components/Drawcard";
import OtherPlayer from "./components/OtherPlayer";

import { useState } from "react";
import { Id } from "convex/_generated/dataModel";
import { useGame } from "./hooks/useGame";

export function Game() {
  const gameId = useGame();
  const game = useQuery(api.game.getGame, { gameId });

  const players = game?.players[0];
  const [openNameDialog, setOpenNameDialog] = useState(true);

  const convex = new ConvexReactClient(
    import.meta.env.VITE_CONVEX_URL as string
  );

  return (
    <div>
      <ConvexAuthProvider client={convex}>
        <DndContextProvider>
          <div className="flex justify-center items-center">
            <div className="flex justify-center fixed -bottom-120 z-10">
              <Hand />
            </div>
          </div>
          <NameDialog open={openNameDialog} setOpen={setOpenNameDialog} />
          <StartButton />
          {/* <div className=" absolute w-screen h-screen"> */}
          <div className="flex justify-center items-center">
            <div className="flex gap-30">
              <Drawcard />
              <LayedCardstack />
            </div>

            <Otherplayers />
          </div>
        </DndContextProvider>
      </ConvexAuthProvider>
    </div>
  );
}

function StartButton() {
  const gameId = useGame();
  const startGameMutation = useMutation(api.game.startGame);
  return (
    <Button
      onClick={() => {
        void startGameMutation({ gameId });
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
  const gameId = useGame();
  const players = useQuery(api.game.listPlayers, { gameId });

  console.log(players);
  return (
    <div className="absolute left-0 top-0 right-0 bottom-0 w-screen h-screen -z-1">
      {playerPostions.map((player, i) => (
        <div className={`absolute ${playerPostions[i].pos}`}>
          <OtherPlayer player={player} rotation={playerPostions[i].rot} />
        </div>
      ))}
    </div>
  );
}
