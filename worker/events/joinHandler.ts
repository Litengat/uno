import { z } from "zod";

// Import event handlers

import { os } from "~/mrpc/ws.server";
import { playersTable } from "~/db/schema";
import { count } from "drizzle-orm";

const joinHandler = os
  .input(z.object({ name: z.string() }))
  .handler(async ({ input, clientID, createMprc, db }) => {
    const mrpc = createMprc();

    if (!db) {
      throw new Error("Database not available");
    }
    const position = await db
      .select({ count: count() })
      .from(playersTable)
      .get()?.count;

    await db
      .insert(playersTable)
      .values({
        id: clientID,
        name: input.name,
        position: position ?? 0,
      })
      .run();

    // Send player their ID
    await mrpc.game.yourId({ playerId: clientID });

    // Update all players with the new player list
    const players = await db.select().from(playersTable).all();
    await mrpc.game.updatePlayers({
      players: players.map((player: any) => ({
        ...player,
        numberOfCards: 0, // New players start with 0 cards
      })),
    });

    return { success: true };
  });

export const join = joinHandler;
