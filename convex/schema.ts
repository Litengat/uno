import { defineSchema, defineTable } from "convex/server";
import { v, Infer } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const card = v.object({
  id: v.string(),
  color: v.union(
    v.literal("red"),
    v.literal("blue"),
    v.literal("green"),
    v.literal("yellow"),
    v.literal("black")
  ),
  type: v.union(
    v.literal("number"),
    v.literal("skip"),
    v.literal("reverse"),
    v.literal("draw-two"),
    v.literal("wild"),
    v.literal("wild-draw-four")
  ),
  number: v.optional(v.number()),
});

export type Card = Infer<typeof card>;

const applicationTables = {
  games: defineTable({
    id: v.string(),
    creatorId: v.id("users"),
    players: v.array(v.id("users")),
    currentPlayer: v.number(),
    direction: v.number(), // 1 for clockwise, -1 for counter-clockwise
    deck: v.array(card),
    discardPile: v.array(card),
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
    cards: v.array(card),
  }).index("by_game", ["gameId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
