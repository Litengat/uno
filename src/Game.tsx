import { Hand } from "@/components/Hand";
import { useParams } from "react-router";
import { api } from "../convex/_generated/api";

import DndContextProvider from "./components/DndContext";
import { ConvexReactClient, useQuery, useMutation } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { LayedCardstack } from "./components/LayedCardstack";

import { Button } from "./components/ui/button";

import Drawcard from "./components/Drawcard";
import OtherPlayer from "./components/OtherPlayer";

import { useState } from "react";

import { useGame } from "./hooks/useGame";
import { catchError } from "./handelErrors";

/**
 * Renders the main game interface, including player hand, controls, and game area.
 *
 * Integrates drag-and-drop context and displays components for drawing cards, laying cards, and viewing other players. Provides buttons to start or join the game.
 */
export function Game() {
  const gameId = useGame();
  const game = useQuery(api.game.getGame, { gameId });

  const convex = new ConvexReactClient(
    import.meta.env.VITE_CONVEX_URL as string
  );

  return (
    <div>
      <DndContextProvider>
        <div className="flex justify-center items-center">
          <div className="flex justify-center fixed -bottom-120 z-10">
            <Hand />
          </div>
        </div>
        {/* <NameDialog open={openNameDialog} setOpen={setOpenNameDialog} /> */}
        <StartButton />
        <JoinBotton />
        {/* <div className=" absolute w-screen h-screen"> */}
        <div className="flex justify-center items-center">
          <div className="flex gap-30">
            <Drawcard />
            <LayedCardstack />
          </div>

          <Otherplayers />
        </div>
      </DndContextProvider>
    </div>
  );
}

/**
 * Renders a button that starts the game when clicked.
 *
 * Initiates the start game mutation for the current game using the game ID from {@link useGame}.
 */
function StartButton() {
  const gameId = useGame();
  const startGameMutation = useMutation(api.game.startGame);
  return (
    <Button
      onClick={() => {
        catchError(startGameMutation({ gameId }));
      }}
    >
      {" "}
      Start
    </Button>
  );
}
/**
 * Renders a button that allows the user to join the current game.
 *
 * When clicked, triggers a mutation to join the game associated with the current game ID.
 */
function JoinBotton() {
  const gameId = useGame();
  const JoinMutation = useMutation(api.game.joinGame);
  return (
    <Button
      onClick={() => {
        catchError(JoinMutation({ gameId }));
      }}
    >
      {" "}
      Join
    </Button>
  );
}
const playerPostions = [
  { pos: "top-[15%] left-10", rot: 110 },
  { pos: "top-[75%] left-10", rot: 70 },
  { pos: "top-[15%] right-10", rot: -110 },
  { pos: "top-[15%] right-10", rot: -70 },
];

/**
 * Renders all other players in the game, positioning and rotating each player according to predefined layout settings.
 *
 * @returns A container with `OtherPlayer` components for each player in the game, or nothing if no players are loaded.
 */
function Otherplayers() {
  const gameId = useGame();
  const players = useQuery(api.game.listPlayers, { gameId });

  if (!players) return;

  console.log(players);
  return (
    <div className="absolute left-0 top-0 right-0 bottom-0 w-screen h-screen -z-1">
      {players.map((player, i) => (
        <div className={`absolute ${playerPostions[i].pos}`}>
          <OtherPlayer player={player} rotation={playerPostions[i].rot} />
        </div>
      ))}
    </div>
  );
}
