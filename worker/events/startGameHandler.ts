import { playersTable, cardsTable } from "~/db/schema";
import { CardStackID } from "~/consts";
import { eq, count } from "drizzle-orm";
import { getRandomCard } from "../utils/cards";

export async function handleStartGame({ input, createMprc }: any) {
  const mrpc = createMprc();
  if (!mrpc?.db) {
    throw new Error("Database not available");
  }
  // Notify all players that the game has started
  await mrpc.game.gameStarted({});

  // Get all players except the card stack
  const players = await mrpc.db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, CardStackID))
    .all();

  // Deal 7 cards to each player
  for (const player of players) {
    for (let i = 0; i < 7; i++) {
      const card = getRandomCard();
      await mrpc.db
        .insert(cardsTable)
        .values({
          ...card,
          holder: player.id,
        })
        .run();
      await mrpc.game.cardDrawn({ card });
    }
  }

  // Place first card in the stack
  const firstCard = getRandomCard();
  await mrpc.db
    .insert(cardsTable)
    .values({
      ...firstCard,
      holder: CardStackID,
    })
    .run();

  await mrpc.game.cardLaidDown({
    playerId: input.playerid,
    card: firstCard,
  });

  // Start with the first player
  const firstPlayer = players.sort(
    (a: any, b: any) => a.position - b.position
  )[0];
  await mrpc.game.nextTurn({ playerId: firstPlayer.id });

  return { success: true };
}
