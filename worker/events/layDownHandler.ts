import { cardsTable, gameTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { CardStackID } from "~/consts";

import { getNextPlayerIndex, getPlayerbyPositon } from "~/game/players";
import { os } from "~/mrpc/ws.server";
import { z } from "zod";
import { CardColorSchema } from "~/types";

export const layDown = os
  .input(
    z.object({
      playerid: z.string(),
      cardId: z.string(),
      wildColor: CardColorSchema.optional(),
    })
  )
  .handler(handleLayDown);

export async function handleLayDown({ input, createMprc }: any) {
  const mrpc = createMprc();
  if (!mrpc?.db) {
    throw new Error("Database not available");
  }
  // Get the card from player's hand
  const card = await mrpc.db
    .select()
    .from(cardsTable)
    .where(
      and(
        eq(cardsTable.id, input.cardId),
        eq(cardsTable.holder, input.playerid)
      )
    );
  if (!card) {
    throw new Error("Card not found in player's hand");
  }

  // Update card color if it's a wild card
  if (input.wildColor) {
    card.color = input.wildColor;
  }

  // Move card to the stack
  await mrpc.db
    .update(cardsTable)
    .set({ holder: CardStackID, color: card.color })
    .where(eq(cardsTable.id, card.id))
    .run();

  // Notify all players about the laid card
  await mrpc.game.cardLaidDown({
    playerId: input.playerid,
    card,
  });

  // Handle special card effects
  switch (card.type) {
    case "reverse": {
      const game = await mrpc.db
        .select()
        .from(gameTable)
        .where(eq(gameTable.id, 0))
        .get();
      if (game) {
        await mrpc.db
          .update(gameTable)
          .set({ direction: game.direction === 1 ? -1 : 1 })
          .run();
      }
      break;
    }
    case "draw-two":
    case "wild-draw-four": {
      const nextIndex = await getNextPlayerIndex(mrpc);
      if (nextIndex !== undefined) {
        const nextPlayer = await getPlayerbyPositon(mrpc, nextIndex);
        const drawCount = card.type === "draw-two" ? 2 : 4;
        for (let i = 0; i < drawCount; i++) {
          await mrpc.game.drawCard({ playerid: nextPlayer.id });
        }
      }
      break;
    }
    case "skip": {
      const skipIndex = await getNextPlayerIndex(mrpc);
      if (skipIndex !== undefined) {
        const skipPlayer = await getPlayerbyPositon(mrpc, skipIndex);
        await mrpc.game.nextTurn({ playerId: skipPlayer.id });
        return { success: true };
      }
      break;
    }
  }

  // Move to next player
  const nextIndex = await getNextPlayerIndex(mrpc);
  if (nextIndex !== undefined) {
    const nextPlayer = await getPlayerbyPositon(mrpc, nextIndex);
    await mrpc.game.nextTurn({ playerId: nextPlayer.id });
  }

  return { success: true };
}
