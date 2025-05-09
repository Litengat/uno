import { cardsTable, playersTable } from "~/db/schema";
import { EventObject } from "../EventManager";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { CardStackID } from "~/GameRoom";
import { Card, CardColorSchema } from "~/types";

const LayDownEventSchema = z.object({
  type: z.literal("LayDown"),
  playerid: z.string(),
  cardId: z.string(),
  wildColor: CardColorSchema.optional(),
});

export const LayDownEvent: EventObject<typeof LayDownEventSchema> = {
  type: "LayDown",
  schema: LayDownEventSchema,
  func: async (event, GameRoom) => {
    const card = (
      await GameRoom.db
        .select()
        .from(cardsTable)
        .where(
          and(
            eq(cardsTable.id, event.cardId),
            eq(cardsTable.holder, event.playerid)
          )
        )
        .limit(1)
    )[0] as Card;

    if (!card) {
      console.error("Card not found");
      return;
    }
    card.color = event.wildColor ?? card.color;
    GameRoom.db
      .update(cardsTable)
      .set({ holder: CardStackID, color: event.wildColor })
      .where(eq(cardsTable.id, card.id))
      .run();
    console.log("Card laid down", card);
    GameRoom.sendEvent("CardLaidDown", {
      playerId: event.playerid,
      card: card,
    });
    const player = GameRoom.db
      .select()
      .from(playersTable)
      .where(eq(playersTable.id, event.playerid))
      .get();

    if (!player) {
      console.error("Player not found");
      return;
    }

    let nextPlayer = (
      await GameRoom.db
        .select()
        .from(playersTable)
        .where(eq(playersTable.position, player.position + 1))
        .limit(1)
    )[0];
    console.log("Next player", nextPlayer);
    if (!nextPlayer) {
      nextPlayer = (
        await GameRoom.db
          .select()
          .from(playersTable)
          .where(eq(playersTable.position, 0))
          .limit(1)
      )[0];
      if (!nextPlayer) {
        console.error("Next player not found");
        return;
      }
    }
    console.log("Next player", nextPlayer);
    if (!nextPlayer) {
      console.error("Next player not found, but this should not happen");
      return;
    }

    GameRoom.sendEvent("NextTurn", {
      playerId: nextPlayer.id,
    });
  },
};
