import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  games: defineTable({
    creatorId: v.id("users"),
    players: v.array(v.id("users")),
    currentPlayer: v.number(),
    direction: v.number(), // 1 for clockwise, -1 for counter-clockwise
    deck: v.array(
      v.object({
        color: v.union(
          v.literal("red"),
          v.literal("blue"),
          v.literal("green"),
          v.literal("yellow")
        ),
        value: v.string(),
      })
    ),
    discardPile: v.array(
      v.object({
        color: v.union(
          v.literal("red"),
          v.literal("blue"),
          v.literal("green"),
          v.literal("yellow")
        ),
        value: v.string(),
      })
    ),
    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("finished")
    ),
    winner: v.optional(v.id("users")),
  }),
  playerHands: defineTable({
    gameId: v.id("games"),
    playerId: v.id("users"),
    cards: v.array(
      v.object({
        color: v.union(
          v.literal("red"),
          v.literal("blue"),
          v.literal("green"),
          v.literal("yellow")
        ),
        value: v.string(),
      })
    ),
  }).index("by_game", ["gameId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
