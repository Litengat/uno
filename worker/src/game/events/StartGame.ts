import { z } from "zod";
import { sendDrawCardEvent } from "./DrawCard";

import { GameRoom } from "~/GameRoom";
import { getAllPlayers, updatePlayers } from "~/db/player";
import { discardCard, getGame, getTopCard } from "~/db/game";

const StartGameEventSchema = z.object({
  type: z.literal("StartGame"),
  playerId: z.string(),
});

export type StartGameEvent = z.infer<typeof StartGameEventSchema>;

export async function handleStartGame(
  event: StartGameEvent,
  GameRoom: GameRoom
) {
  console.log("Starting game");

  GameRoom.sendEvent("GameStarted", {});
  const playersResult = await getAllPlayers(GameRoom.storage);

  if (playersResult.isErr()) {
    console.error(playersResult.error);
    return;
  }

  const players = playersResult.value;

  console.log("players", players);

  for (const player of players) {
    await sendDrawCardEvent(player.id, GameRoom, 7);
  }

  updatePlayers(GameRoom);

  const cardResult = await getTopCard(GameRoom.storage);
  if (cardResult.isErr()) return;
  const card = cardResult.value;

  discardCard(GameRoom, card);

  GameRoom.sendEvent("CardLaidDown", {
    playerId: event.playerId,
    card: card,
  });
  GameRoom.sendEvent("NextTurn", {
    playerId: players[0].id,
  });
}
