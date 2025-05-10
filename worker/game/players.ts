import { playersTable } from "~/db/schema";
import { GameRoom } from "~/GameRoom";
import { eq } from "drizzle-orm";

export async function getNextPlayerIndex(GameRoom: GameRoom) {
  const game = await GameRoom.getGame();
  const players = await GameRoom.db.select().from(playersTable).all();
  console.log(players);
  const nextIndex = game.currentPlayerIndex + game.direction;
  console.log("PlayerIndex", game.currentPlayerIndex);
  console.log("direction", game.direction);
  console.log("next Index Function", nextIndex);
  if (nextIndex >= players.length) {
    return 0;
  }
  if (nextIndex < 0) {
    console.log("smaller 0");
    return players.length - 1;
  }
  return nextIndex;
}

export async function getPlayer(GameRoom: GameRoom, id: string) {
  return GameRoom.db.select().from(playersTable).where(eq(playersTable.id, id));
}

export async function getPlayerbyPositon(GameRoom: GameRoom, position: number) {
  return (
    await GameRoom.db
      .select()
      .from(playersTable)
      .where(eq(playersTable.position, position))
      .limit(1)
  )[0];
}
