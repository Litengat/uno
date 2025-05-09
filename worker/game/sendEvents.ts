import { Card, Player } from "~/types/Card";
import { GameRoom } from "~/GameRoom";
import { cardsTable, playersTable } from "~/db/schema";
import { count, eq } from "drizzle-orm";
// 1. Define event types and payloads
export type EventMap = {
  UpdatePlayers: { players: Player[] };
  PlayerLeft: { playerId: string };
  CardDrawn: { card: Card };
  CardLaidDown: { playerId: string; card: Card };
  UpdateCardCount: { playerId: string; numberOfCards: number };
  YourID: { playerId: string };
  GameStarted: {};
  NextTurn: { playerId: string };
};

export function updatePlayers(GameRoom: GameRoom) {
  const players = GameRoom.db.select().from(playersTable).all();
  GameRoom.sendEvent("UpdatePlayers", {
    players: players.map((player) => {
      const result = GameRoom.db
        .select({ count: count() })
        .from(cardsTable)
        .where(eq(cardsTable.holder, player.id))
        .get();
      return {
        ...player,
        numberOfCards: result?.count ?? 0,
      };
    }),
  });
}
