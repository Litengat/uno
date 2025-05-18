import { playersTable, cardsTable } from "~/db/schema";
import { eq, count } from "drizzle-orm";
import { CardStackID } from "~/consts";
import { os } from "~/mrpc/ws.server";
import { z } from "zod";

export const leave = os
  .input(z.object({}))
  .handler(async ({ clientID, createMprc, db }) => {
    const mrpc = createMprc(clientID);
    if (!db) {
      throw new Error("Database not available");
    }
    // Remove player from database
    await db.delete(playersTable).where(eq(playersTable.id, clientID)).run();

    // Return player's cards to the deck
    await db
      .update(cardsTable)
      .set({ holder: CardStackID })
      .where(eq(cardsTable.holder, clientID))
      .run();

    // Update player list for remaining players
    const players = await db.select().from(playersTable).all();
    await mrpc.game.updatePlayers({
      players: players.map((player: any) => ({
        ...player,
        numberOfCards: 0, // Reset card count as we'll update it next
      })),
    });

    // Update card counts for all players
    for (const player of players) {
      const cardCount = await db
        .select({ count: count() })
        .from(cardsTable)
        .where(eq(cardsTable.holder, player.id))
        .get();

      await mrpc.game.updateCardCount({
        playerId: player.id,
        number: cardCount?.count ?? 0,
      });
    }

    return { success: true };
  });
