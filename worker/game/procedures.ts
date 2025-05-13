import { z } from "zod";
import { os } from "./protocol";
import { GameRoom } from "@/GameRoom";
import { ServerRPC } from "./ServerRPC";
import { eq, count } from "drizzle-orm";
import { cardsTable, playersTable } from "~/db/schema";

// Schema definitions
const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  numberOfCards: z.number(),
});

const CardSchema = z.object({
  id: z.string(),
  suit: z.string(),
  value: z.string(),
});

// Procedures
export const updatePlayers = os
  .input(z.object({}))
  .output(z.object({ players: z.array(PlayerSchema) }))
  .handler(async ({ ctx }) => {
    const players = ctx.gameRoom.db.select().from(playersTable).all();
    const playersWithCards = players.map((player) => {
      const result = ctx.gameRoom.db
        .select({ count: count() })
        .from(cardsTable)
        .where(eq(cardsTable.holder, player.id))
        .get();
      return {
        ...player,
        numberOfCards: result?.count ?? 0,
      };
    });
    return { players: playersWithCards };
  });

export const playerLeft = os
  .input(z.object({ playerId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input, ctx }) => {
    ctx.gameRoom.db
      .delete(playersTable)
      .where(eq(playersTable.id, input.playerId))
      .run();
    return { success: true };
  });

export const cardDrawn = os
  .input(z.object({ card: CardSchema }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    return { success: true };
  });

export const cardLaidDown = os
  .input(z.object({ playerId: z.string(), card: CardSchema }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    return { success: true };
  });

export const updateCardCount = os
  .input(z.object({ playerId: z.string(), numberOfCards: z.number() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    return { success: true };
  });

export const gameStarted = os
  .input(z.object({}))
  .output(z.object({ success: z.boolean() }))
  .handler(async () => {
    return { success: true };
  });

export const nextTurn = os
  .input(z.object({ playerId: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    return { success: true };
  });

// Router definition
export const gameRouter = {
  game: {
    updatePlayers,
    playerLeft,
    cardDrawn,
    cardLaidDown,
    updateCardCount,
    gameStarted,
    nextTurn,
  },
};

// Function to register all procedures
export function registerProcedures(rpc: ServerRPC, gameRoom: GameRoom) {
  Object.entries(gameRouter).forEach(([namespace, procedures]) => {
    Object.entries(procedures).forEach(([name, procedure]) => {
      rpc.register(`${namespace}.${name}`, procedure);
    });
  });
}
