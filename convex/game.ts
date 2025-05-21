import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Card } from "./schema";

const colors = ["red", "blue", "green", "yellow"] as const;

/**
 * Generates and returns a shuffled deck of cards for the game.
 *
 * The deck includes number cards (0–8, two copies per color), action cards ("skip", "reverse", "draw-two", two copies per color), and wild cards ("wild", "wild-draw-four", four copies each). Each card is assigned a unique ID.
 *
 * @returns A shuffled array of {@link Card} objects representing the full game deck.
 */
function createDeck(): Card[] {
  const numbers = Array.from({ length: 9 }).map((_, i) => i);
  const actions = ["skip", "reverse", "draw-two"] as const;

  const deck: Card[] = [];

  // Add number cards
  for (const color of colors) {
    for (const number of numbers) {
      deck.push({
        id: crypto.randomUUID(),
        color,
        number: number,
        type: "number",
      });
      deck.push({
        id: crypto.randomUUID(),
        color,
        number: number,
        type: "number",
      });
    }
  }

  // Add action cards
  for (const color of colors) {
    for (const action of actions) {
      deck.push({ id: crypto.randomUUID(), color, type: action });
      deck.push({ id: crypto.randomUUID(), color, type: action });
    }
  }
  Array.from({ length: 4 }).map((_, i) => {
    deck.push({
      id: crypto.randomUUID(),
      color: "black",
      type: "wild-draw-four",
    });
    deck.push({ id: crypto.randomUUID(), color: "black", type: "wild" });
  });
  console.log(deck);
  return shuffle(deck);
}

/**
 * Returns a new array with the elements randomly shuffled.
 *
 * The original array is not modified.
 *
 * @param array - The array to shuffle.
 * @returns A new array containing the shuffled elements of {@link array}.
 */
function shuffle<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export const createGame = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const deck = createDeck();
    const [firstCard, ...remainingDeck] = deck;

    return await ctx.db.insert("games", {
      id: crypto.randomUUID(),
      creatorId: userId,
      players: [userId],
      currentPlayer: 0,
      direction: 1,
      deck: remainingDeck,
      discardPile: [firstCard],
      status: "waiting",
    });
  },
});

export const joinGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found");
    if (game.status !== "waiting")
      throw new ConvexError("Game already started");
    if (game.players.includes(userId)) throw new ConvexError("Already in game");
    if (game.players.length >= 4) throw new ConvexError("Game is full");

    await ctx.db.patch(args.gameId, {
      players: [...game.players, userId],
    });
  },
});

export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found");
    if (game.creatorId !== userId)
      throw new ConvexError("Only creator can start game");
    if (game.players.length < 2)
      throw new ConvexError("Need at least 2 players");
    if (game.status !== "waiting")
      throw new ConvexError("Game already started");

    // Deal 7 cards to each player
    for (const playerId of game.players) {
      const cards = game.deck.slice(0, 7);
      await ctx.db.insert("playerHands", {
        gameId: args.gameId,
        playerId,
        cards,
      });
    }

    await ctx.db.patch(args.gameId, {
      deck: game.deck.slice(game.players.length * 7),
      status: "playing",
    });
  },
});

export const playCard = mutation({
  args: {
    gameId: v.id("games"),
    cardId: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found");
    if (game.status !== "playing")
      throw new ConvexError("Game not in progress");
    if (game.players[game.currentPlayer] !== userId)
      throw new ConvexError("Not your turn");

    const playerHand = await ctx.db
      .query("playerHands")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), userId))
      .unique();
    if (!playerHand) throw new ConvexError("Player hand not found");

    const card = playerHand.cards.filter((q) => q.id === args.cardId)[0];
    if (!card) throw new ConvexError("Card not found");

    const topCard = game.discardPile[game.discardPile.length - 1];

    if (
      card.color !== topCard.color &&
      card.type !== topCard.type &&
      card.color !== "black"
    ) {
      throw new ConvexError("Invalid move");
    }

    // Remove card from hand
    const newHand = playerHand.cards.filter((c) => c.id !== args.cardId);

    await ctx.db.patch(playerHand._id, { cards: newHand });

    if (!args.color) {
      args.color;
    }

    const newcard: Card = {
      ...card,
      color: (args.color ?? card.color) as
        | "red"
        | "blue"
        | "green"
        | "yellow"
        | "black",
    };
    // Add card to discard pile
    const newDiscardPile = [...game.discardPile, newcard];

    // Handle special cards
    let nextPlayer =
      (game.currentPlayer + game.direction) % game.players.length;
    if (nextPlayer < 0) nextPlayer += game.players.length;

    let direction = game.direction;
    if (card.type === "reverse") {
      direction *= -1;
    } else if (card.type === "skip") {
      nextPlayer = (nextPlayer + game.direction) % game.players.length;
      if (nextPlayer < 0) nextPlayer += game.players.length;
    } else if (card.type === "draw-two") {
      const nextPlayerHand = await ctx.db
        .query("playerHands")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .filter((q) => q.eq(q.field("playerId"), game.players[nextPlayer]))
        .unique();
      if (!nextPlayerHand) throw new ConvexError("Next player hand not found");

      const newCards = game.deck.slice(0, 2);

      await ctx.db.patch(nextPlayerHand._id, {
        cards: [...nextPlayerHand.cards, ...newCards],
      });
      await ctx.db.patch(args.gameId, {
        deck: game.deck.slice(2),
      });
    }

    // Check for winner
    if (newHand.length === 0) {
      await ctx.db.patch(args.gameId, {
        status: "finished",
        winner: userId,
      });
      return;
    }

    await ctx.db.patch(args.gameId, {
      currentPlayer: nextPlayer,
      direction,
      discardPile: newDiscardPile,
    });
  },
});

export const drawCard = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found");
    if (game.status !== "playing")
      throw new ConvexError("Game not in progress");
    if (game.players[game.currentPlayer] !== userId)
      throw new ConvexError("Not your turn");

    const playerHand = await ctx.db
      .query("playerHands")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), userId))
      .unique();
    if (!playerHand) throw new ConvexError("Player hand not found");

    // Draw a card
    const [newCard, ...remainingDeck] = game.deck;
    if (!newCard) {
      // Reshuffle discard pile if deck is empty
      const [newTopCard, ...newDeck] = shuffle(game.discardPile.slice(0, -1));
      await ctx.db.patch(args.gameId, {
        deck: newDeck,
        discardPile: [game.discardPile[game.discardPile.length - 1]],
      });
      await ctx.db.patch(playerHand._id, {
        cards: [...playerHand.cards, newTopCard],
      });
    } else {
      await ctx.db.patch(args.gameId, {
        deck: remainingDeck,
      });
      await ctx.db.patch(playerHand._id, {
        cards: [...playerHand.cards, newCard],
      });
    }

    // Move to next player
    let nextPlayer =
      (game.currentPlayer + game.direction) % game.players.length;
    if (nextPlayer < 0) nextPlayer += game.players.length;

    await ctx.db.patch(args.gameId, {
      currentPlayer: nextPlayer,
    });
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new ConvexError("Game not found");

    const playerHands = await ctx.db
      .query("playerHands")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    return {
      ...game,
      playerHands: Object.fromEntries(
        playerHands.map((hand) => [hand.playerId, hand.cards.length])
      ),
    };
  },
});

export const getMyHand = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const playerHand = await ctx.db
      .query("playerHands")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), userId))
      .unique();
    return playerHand?.cards ?? [];
  },
});

export const listGames = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("status"), "waiting"))
      .collect();
  },
});

export const listPlayers = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const playerHands = await ctx.db
      .query("playerHands")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();
    return Promise.all(
      (playerHands ?? []).map(async (q) => {
        const user = await ctx.db.get(q.playerId);

        return {
          name: user?.name,
          id: user?._id,
          image: user?.image,
          isAnonymous: user?.isAnonymous ?? true,
          numberOfCards: q.cards.length,
        };
      })
    );
  },
});
export const listdiscardPile = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_id", (q) => q.eq("_id", args.gameId))
      .unique();

    return game?.discardPile;
  },
});

export const isYourTurn = query({
  args: { gamesId: v.id("games"), userId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_id", (q) => q.eq("_id", args.gamesId))
      .unique();

    return game?.players[game.currentPlayer] !== args.userId;
  },
});
