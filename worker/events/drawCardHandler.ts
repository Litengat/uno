import { cardsTable } from "~/db/schema";
import { count, eq } from "drizzle-orm";
import { getRandomCard } from "~/utils/cards";
import { os } from "~/mrpc/ws.server";
import { z } from "zod";

export const drawCard = os
  .input(z.object({}))
  .handler(async ({ clientID, createMprc, db }) => {
    const mrpc = createMprc(clientID);
    if (!db) {
      throw new Error("Database not available");
    }
    const card = getRandomCard();

    // Add card to player's hand
    db.insert(cardsTable)
      .values({
        ...card,
        holder: clientID,
      })
      .run();

    // Notify player about the drawn card
    // await mrpc.game.cardDrawn({ card });

    // Update card count for all players
    const cardCount = await db
      .select({ count: count() })
      .from(cardsTable)
      .where(eq(cardsTable.holder, clientID))
      .get();

    await mrpc.game.updateCardCount({
      playerId: clientID,
      number: cardCount?.count ?? 0,
    });

    return { success: true };
  });
