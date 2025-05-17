import { playersTable, cardsTable } from "../../db/schema";
import { eq, count } from "drizzle-orm";
import { CardStackID } from "../../GameRoom";

export async function handleLeave({ input, createMprc }: any) {
  const mrpc = createMprc();
  if (!mrpc?.db) {
    throw new Error("Database not available");
  }
  // Remove player from database
  await mrpc.db
    .delete(playersTable)
    .where(eq(playersTable.id, input.playerid))
    .run();

  // Return player's cards to the deck
  await mrpc.db
    .update(cardsTable)
    .set({ holder: CardStackID })
    .where(eq(cardsTable.holder, input.playerid))
    .run();

  // Update player list for remaining players
  const players = await mrpc.db.select().from(playersTable).all();
  await mrpc.game.updatePlayers({
    players: players.map((player: any) => ({
      ...player,
      numberOfCards: 0, // Reset card count as we'll update it next
    })),
  });

  // Update card counts for all players
  for (const player of players) {
    const cardCount = await mrpc.db
      .select({ count: count() })
      .from(cardsTable)
      .where(eq(cardsTable.holder, player.id))
      .get();

    await mrpc.game.updateCardCount({
      playerId: player.id,
      numberOfCards: cardCount?.count ?? 0,
    });
  }

  return { success: true };
}
