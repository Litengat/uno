import { err, ok } from "neverthrow";
import { z } from "zod";

import { GameRoom } from "~/GameRoom";

import { getTopCard } from "~/db/game";
import { addCardToPlayer, PlayerId, getPlayer } from "~/db/player";

const DrawCardSchema = z.object({
  type: z.literal("DrawCard"),
  playerid: z.string(),
});

export type DrawCardEvent = z.infer<typeof DrawCardSchema>;

export function handleDrawCard(event: DrawCardEvent, GameRoom: GameRoom) {
  sendDrawCardEvent(event.playerid as PlayerId, GameRoom);
}

export async function sendDrawCardEvent(
  playerId: PlayerId,
  GameRoom: GameRoom,
  number = 1
) {
  for (let index = 0; index < number; index++) {
    const cardResult = await getTopCard(GameRoom);

    if (cardResult.isErr()) {
      console.error(cardResult.error);
      return;
    }
    GameRoom.sendPlayerEvent(playerId, "CardDrawn", { card: cardResult.value });
    await addCardToPlayer(GameRoom.storage, playerId, cardResult.value);
  }
  const player = await getPlayer(GameRoom.storage, playerId);
  if (!player) return err("Player not Found");

  GameRoom.sendEvent("UpdateCardCount", {
    playerId,
    numberOfCards: player.cards.length,
  });
  return ok();
}
