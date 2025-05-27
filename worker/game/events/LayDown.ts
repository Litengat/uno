import { cardsTable, gameTable, playersTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { CardStackID, GameRoom } from "~/GameRoom";
import { Card, CardColorSchema } from "~/types";

import { sendDrawCardEvent } from "./DrawCard";
import {
  getPlayer,
  getPlayerCard,
  PlayerId,
  UpdateNextPlayer,
  PlayerIdSchema,
  getNextPlayer,
} from "~/db/player";
import { canBeLaidOnTop, CardIdSchema } from "~/db/card";
import { discardCard, getGame, NextTurn } from "~/db/game";
import { getNextPlayerIndex } from "../players";

export const LayDownEventSchema = z.object({
  type: z.literal("LayDown"),
  playerId: PlayerIdSchema,
  cardId: CardIdSchema,
  wildColor: CardColorSchema.optional(),
});

export type LayDownEvent = z.infer<typeof LayDownEventSchema>;

export async function handleLayDown(event: LayDownEvent, GameRoom: GameRoom) {
  const game = await getGame(GameRoom.storage);
  if (!game) {
    console.error("Game not Found");
    return;
  }
  const currentPlayerId = game.players[game.currentPlayerIndex];
  console.log("Current player ID", currentPlayerId);
  console.log(game.currentPlayerIndex);
  console.log(game.players);
  if (!currentPlayerId) {
    console.error("Current Player not Found");
    return;
  }
  if (currentPlayerId !== event.playerId) {
    console.error("Not your Turn");
    return;
  }
  const cardResult = await getPlayerCard(
    GameRoom.storage,
    event.playerId,
    event.cardId
  );
  if (cardResult.isErr()) {
    console.error(cardResult.error);
    return;
  }
  const card = cardResult.value;
  // if (!canBeLaidOnTop(card, game.discardPile[-1])) {
  //   console.error("can't be laid on top");
  //   return;
  // }

  card.color = event.wildColor ?? card.color;

  switch (card.type) {
    case "reverse":
      await reverse(GameRoom);
      break;
    case "draw-two":
      await drawNextPlayer(GameRoom, 2);
      break;
    case "wild-draw-four":
      await drawNextPlayer(GameRoom, 4);
      break;
    case "skip":
      const nextPlayer = await UpdateNextPlayer(GameRoom.storage);
      if (nextPlayer?.isErr()) {
        console.error(nextPlayer.error);
        return;
      }
      break;
  }

  // send Card laid down Event
  console.log("Card laid down", card);
  await discardCard(GameRoom, card);

  GameRoom.sendEvent("CardLaidDown", {
    playerId: event.playerId,
    card: card,
  });

  await NextTurn(GameRoom);
}

async function reverse(GameRoom: GameRoom) {
  const game = await GameRoom.getGame();
  console.log("omg reverse");
  const flippedDirection = game?.direction === 1 ? -1 : 1;
  GameRoom.db.update(gameTable).set({ direction: flippedDirection }).all();
}

async function drawNextPlayer(GameRoom: GameRoom, number: number) {
  const nexplayer = await getNextPlayer(GameRoom.storage);
  if (nexplayer.isErr()) return;
  await sendDrawCardEvent(nexplayer.value, GameRoom, number);
}
