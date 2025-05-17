import { cardsTable } from "~/db/schema";
import { count, eq } from "drizzle-orm";
import { getRandomCard } from "~/utils/cards";

export async function handleDrawCard({ input, createMprc }: any) {
  const mrpc = createMprc();
  if (!mrpc?.db) {
    throw new Error("Database not available");
  }
  const card = getRandomCard();

  // Add card to player's hand
  await mrpc.db
    .insert(cardsTable)
    .values({
      ...card,
      holder: input.playerid,
    })
    .run();

  // Notify player about the drawn card
  await mrpc.game.cardDrawn({ card });

  // Update card count for all players
  const cardCount = await mrpc.db
    .select({ count: count() })
    .from(cardsTable)
    .where(eq(cardsTable.holder, input.playerid))
    .get();

  await mrpc.game.updateCardCount({
    playerId: input.playerid,
    numberOfCards: cardCount?.count ?? 0,
  });

  return { success: true };
}
