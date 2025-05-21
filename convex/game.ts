import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

type Card = {
  color: "red" | "blue" | "green" | "yellow";
  value: string;
};

function createDeck(): Card[] {
  const colors: ("red" | "blue" | "green" | "yellow")[] = [
    "red",
    "blue",
    "green",
    "yellow",
  ];
  const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const actions = ["skip", "reverse", "draw2"];

  const deck: Card[] = [];

  // Add number cards
  for (const color of colors) {
    for (const number of numbers) {
      deck.push({ color, value: number });
      if (number !== "0") {
        deck.push({ color, value: number });
      }
    }
  }

  // Add action cards
  for (const color of colors) {
    for (const action of actions) {
      deck.push({ color, value: action });
      deck.push({ color, value: action });
    }
  }

  return shuffle(deck);
}

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
    if (!userId) throw new Error("Not authenticated");

    const deck = createDeck();
    const [firstCard, ...remainingDeck] = deck;

    return await ctx.db.insert("games", {
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
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "waiting") throw new Error("Game already started");
    if (game.players.includes(userId)) throw new Error("Already in game");
    if (game.players.length >= 4) throw new Error("Game is full");

    await ctx.db.patch(args.gameId, {
      players: [...game.players, userId],
    });
  },
});

export const startGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.creatorId !== userId)
      throw new Error("Only creator can start game");
    if (game.players.length < 2) throw new Error("Need at least 2 players");
    if (game.status !== "waiting") throw new Error("Game already started");

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
    cardIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "playing") throw new Error("Game not in progress");
    if (game.players[game.currentPlayer] !== userId)
      throw new Error("Not your turn");

    const playerHand = await ctx.db
      .query("playerHands")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), userId))
      .unique();
    if (!playerHand) throw new Error("Player hand not found");

    const card = playerHand.cards[args.cardIndex];
    if (!card) throw new Error("Card not found");

    const topCard = game.discardPile[game.discardPile.length - 1];
    if (card.color !== topCard.color && card.value !== topCard.value) {
      throw new Error("Invalid move");
    }

    // Remove card from hand
    const newHand = [...playerHand.cards];
    newHand.splice(args.cardIndex, 1);
    await ctx.db.patch(playerHand._id, { cards: newHand });

    // Add card to discard pile
    const newDiscardPile = [...game.discardPile, card];

    // Handle special cards
    let nextPlayer =
      (game.currentPlayer + game.direction) % game.players.length;
    if (nextPlayer < 0) nextPlayer += game.players.length;

    let direction = game.direction;
    if (card.value === "reverse") {
      direction *= -1;
    } else if (card.value === "skip") {
      nextPlayer = (nextPlayer + game.direction) % game.players.length;
      if (nextPlayer < 0) nextPlayer += game.players.length;
    } else if (card.value === "draw2") {
      const nextPlayerHand = await ctx.db
        .query("playerHands")
        .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
        .filter((q) => q.eq(q.field("playerId"), game.players[nextPlayer]))
        .unique();
      if (!nextPlayerHand) throw new Error("Next player hand not found");

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
    if (!userId) throw new Error("Not authenticated");

    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.status !== "playing") throw new Error("Game not in progress");
    if (game.players[game.currentPlayer] !== userId)
      throw new Error("Not your turn");

    const playerHand = await ctx.db
      .query("playerHands")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("playerId"), userId))
      .unique();
    if (!playerHand) throw new Error("Player hand not found");

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
    if (!game) throw new Error("Game not found");

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
    if (!userId) throw new Error("Not authenticated");

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
