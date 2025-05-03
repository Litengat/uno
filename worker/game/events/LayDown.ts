import { cardsTable } from "~/db/schema";
import { EventObject } from "../EventManager";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { CardStackID } from "~/GameRoom";
import { Card } from "~/types/Card";

const LayDownEventSchema = z.object({
  type: z.literal("LayDown"),
  playerid: z.string(),
  cardId: z.string(),
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
    GameRoom.db
      .update(cardsTable)
      .set({ holder: CardStackID })
      .where(eq(cardsTable.id, card.id))
      .run();

    GameRoom.sendEvent("CardLaidDown", {
      playerId: event.playerid,
      card: card,
    });
  },
};
