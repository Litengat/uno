import { DurableObject } from "cloudflare:workers";
import { Env } from ".";
import { Attachment } from "./types";
import { safeJsonParse, sendError } from "./utills";
import {
  drizzle,
  type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";

import migrations from "../drizzle/migrations.js";
import { playersTable, cardsTable, gameStateTable } from "./db/schema.js";
import { eq, and, ne } from "drizzle-orm";

// Import tRPC router
import { appRouter, type Context } from "./trpc/router";
import { resolveHTTPResponse } from "@trpc/server/adapters/standalone";

export const CardStackID = "cardStack";

export class GameRoom extends DurableObject {
  sessions: Map<string, WebSocket> = new Map();
  db: DrizzleSqliteDODatabase;
  ctx: DurableObjectState;
  env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx = ctx;
    this.env = env;
    this.db = drizzle(ctx.storage, { logger: true });
    this.sessions = new Map();

    ctx.getWebSockets().forEach((ws) => {
      const meta = ws.deserializeAttachment() as Attachment | undefined;
      if (!meta) {
        return;
      }
      this.sessions.set(meta.id, ws);
    });
    ctx.blockConcurrencyWhile(async () => {
      await this._migrate();
    });
  }

  async _migrate() {
    migrate(this.db, migrations);
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket connections
    if (request.headers.get("Upgrade") === "websocket") {
      return this._handleWebSocketConnection();
    }

    // Handle tRPC HTTP requests
    if (request.url.includes("/trpc")) {
      return this._handleTrpcRequest(request);
    }

    return new Response("Not found", { status: 404 });
  }

  async _handleTrpcRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const playerId = url.searchParams.get("playerId");

    if (!playerId) {
      return new Response("Missing playerId", { status: 400 });
    }

    // Create tRPC context
    const context: Context = {
      gameRoom: this,
      playerId,
    };

    try {
      const httpResponse = await resolveHTTPResponse({
        router: appRouter,
        req: request,
        path: url.pathname.substring("/trpc".length),
        createContext: () => context,
      });

      return new Response(httpResponse.body, {
        status: httpResponse.status,
        headers: new Headers(httpResponse.headers),
      });
    } catch (error) {
      console.error(error);
      return new Response("Internal server error", { status: 500 });
    }
  }

  _handleWebSocketConnection(): Response {
    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);

    const id = crypto.randomUUID();
    server.serializeAttachment({
      id: id,
      name: undefined,
    } as Attachment);

    // adding the player to the players map
    this.sessions.set(id, server);

    // Send the initial playerId to the client
    server.send(JSON.stringify({ type: "connected", playerId: id }));

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    // WebSockets will now primarily be used for real-time updates
    // Most game logic will go through tRPC calls
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }

    // You might still handle some messages for backward compatibility
    const parsedMessage = safeJsonParse(
      typeof message === "string" ? message : new TextDecoder().decode(message)
    );

    if (parsedMessage.isErr()) {
      sendError(ws, parsedMessage.error);
      return;
    }

    // Handle any necessary WebSocket messages
    // But most game logic should be moved to tRPC procedures
  }

  async webSocketOpen(ws: WebSocket) {
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }
    this.sessions.set(meta.id, ws);
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    _reason: string,
    _wasClean: boolean
  ) {
    ws.close(code, "Durable Object is closing WebSocket");
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }
    this.sessions.delete(meta.id);
    this.db.delete(playersTable).where(eq(playersTable.id, meta.id)).run();
  }

  // send a message to all players (for real-time updates)
  async broadcast(message: string) {
    console.log("Broadcasting message to all players:", message);
    this.sessions.forEach((session) => {
      session.send(message);
    });
  }

  // Method to broadcast to all except one player
  broadcastExcept(playerId: string, message: string) {
    this.sessions.forEach((session, id) => {
      if (id !== playerId) {
        session.send(message);
      }
    });
  }

  async isGameStarted() {
    const gameState = await this.db.select().from(gameStateTable).get();
    return !!gameState && gameState.status === "ACTIVE";
  }

  async initializeGameState() {
    // Check if game already initialized
    const existing = await this.db.select().from(gameStateTable).get();
    if (existing) return;

    // Create deck
    const deck = this.createDeck();

    // Shuffle deck
    this.shuffleDeck(deck);

    // Store cards in database
    for (const card of deck) {
      await this.db.insert(cardsTable).values({
        id: card.id,
        playerId: CardStackID, // Cards start in the deck
        color: card.color,
        type: card.type,
        value: card.value,
        isDiscarded: false,
      });
    }

    // Initialize game state
    await this.db.insert(gameStateTable).values({
      id: "game",
      currentPlayerId: null,
      status: "ACTIVE",
      direction: "CLOCKWISE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  createDeck() {
    const cards = [];
    const colors = ["RED", "BLUE", "GREEN", "YELLOW"];

    // Generate unique IDs for cards
    let cardId = 0;

    // Add number cards (0-9) for each color
    for (const color of colors) {
      // One zero per color
      cards.push({
        id: `card_${cardId++}`,
        color,
        type: "NUMBER",
        value: 0,
      });

      // Two of each 1-9
      for (let i = 1; i <= 9; i++) {
        for (let j = 0; j < 2; j++) {
          cards.push({
            id: `card_${cardId++}`,
            color,
            type: "NUMBER",
            value: i,
          });
        }
      }

      // Add special cards (2 of each per color)
      for (let i = 0; i < 2; i++) {
        cards.push({
          id: `card_${cardId++}`,
          color,
          type: "SKIP",
          value: null,
        });

        cards.push({
          id: `card_${cardId++}`,
          color,
          type: "REVERSE",
          value: null,
        });

        cards.push({
          id: `card_${cardId++}`,
          color,
          type: "DRAW_TWO",
          value: null,
        });
      }
    }

    // Add wild cards (4 of each)
    for (let i = 0; i < 4; i++) {
      cards.push({
        id: `card_${cardId++}`,
        color: "WILD",
        type: "WILD",
        value: null,
      });

      cards.push({
        id: `card_${cardId++}`,
        color: "WILD",
        type: "WILD_DRAW_FOUR",
        value: null,
      });
    }

    return cards;
  }

  shuffleDeck(deck) {
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  async dealCards(playerId, count) {
    // Get cards from deck
    const cards = await this.db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.playerId, CardStackID))
      .limit(count)
      .all();

    // Update card ownership
    for (const card of cards) {
      await this.db
        .update(cardsTable)
        .set({ playerId })
        .where(eq(cardsTable.id, card.id));
    }

    return cards;
  }

  async getCurrentTurn() {
    const gameState = await this.db.select().from(gameStateTable).get();
    return gameState?.currentPlayerId;
  }

  async getTopCard() {
    // Get the top card from discard pile
    return await this.db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.isDiscarded, true))
      .orderBy("updatedAt", true)
      .get();
  }

  async placeInitialCard() {
    // Get a card from deck (non-wild card ideally)
    const card = await this.db
      .select()
      .from(cardsTable)
      .where(
        and(
          eq(cardsTable.playerId, CardStackID),
          ne(cardsTable.type, "WILD"),
          ne(cardsTable.type, "WILD_DRAW_FOUR")
        )
      )
      .limit(1)
      .get();

    if (!card) {
      // Fallback to any card if no regular cards available
      const anyCard = await this.db
        .select()
        .from(cardsTable)
        .where(eq(cardsTable.playerId, CardStackID))
        .limit(1)
        .get();

      if (anyCard) {
        await this.db
          .update(cardsTable)
          .set({
            playerId: null,
            isDiscarded: true,
            updatedAt: new Date(),
          })
          .where(eq(cardsTable.id, anyCard.id));
      }
    } else {
      await this.db
        .update(cardsTable)
        .set({
          playerId: null,
          isDiscarded: true,
          updatedAt: new Date(),
        })
        .where(eq(cardsTable.id, card.id));
    }
  }

  isValidCardPlay(card, topCard, chosenColor = null) {
    // Wild cards can always be played
    if (card.type === "WILD" || card.type === "WILD_DRAW_FOUR") {
      return true;
    }

    // Regular cards can be played if they match the color or type/value
    return (
      card.color === topCard.color ||
      (card.type === topCard.type && card.type !== "NUMBER") ||
      (card.type === "NUMBER" &&
        topCard.type === "NUMBER" &&
        card.value === topCard.value) ||
      topCard.color === chosenColor // If the top card was a wild and player chose this card's color
    );
  }

  async playCard(cardId, chosenColor = null) {
    // Get the card
    const card = await this.db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.id, cardId))
      .get();

    if (!card) return false;

    // Move card to discard pile
    await this.db
      .update(cardsTable)
      .set({
        playerId: null,
        isDiscarded: true,
        updatedAt: new Date(),
        // If it's a wild card, set its "effective color"
        color:
          (card.type === "WILD" || card.type === "WILD_DRAW_FOUR") &&
          chosenColor
            ? chosenColor
            : card.color,
      })
      .where(eq(cardsTable.id, cardId));

    return true;
  }

  async drawCard(playerId) {
    // Get a card from deck
    const card = await this.db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.playerId, CardStackID))
      .limit(1)
      .get();

    if (!card) {
      // If deck is empty, reshuffle discards (except top card)
      await this.reshuffleDeck();

      // Try again
      const newCard = await this.db
        .select()
        .from(cardsTable)
        .where(eq(cardsTable.playerId, CardStackID))
        .limit(1)
        .get();

      if (newCard) {
        await this.db
          .update(cardsTable)
          .set({ playerId, updatedAt: new Date() })
          .where(eq(cardsTable.id, newCard.id));

        return newCard;
      }

      return null; // No cards left
    }

    // Update card ownership
    await this.db
      .update(cardsTable)
      .set({ playerId, updatedAt: new Date() })
      .where(eq(cardsTable.id, card.id));

    return card;
  }

  async reshuffleDeck() {
    // Get all discarded cards except the top one
    const discardedCards = await this.db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.isDiscarded, true))
      .orderBy("updatedAt")
      .all();

    // Keep the top card
    const topCard = discardedCards.pop();

    // Move the rest back to the deck
    for (const card of discardedCards) {
      await this.db
        .update(cardsTable)
        .set({
          playerId: CardStackID,
          isDiscarded: false,
          updatedAt: new Date(),
        })
        .where(eq(cardsTable.id, card.id));
    }
  }

  async setNextPlayer(lastPlayedCardType = null) {
    const gameState = await this.db.select().from(gameStateTable).get();
    const players = await this.db
      .select()
      .from(playersTable)
      .where(eq(playersTable.isActive, true))
      .all();

    if (!gameState || players.length < 2) return;

    // Determine the next player based on current player and direction
    const currentIndex = players.findIndex(
      (p) => p.id === gameState.currentPlayerId
    );
    let nextIndex;

    if (currentIndex === -1) {
      // No current player, start with first player
      nextIndex = 0;
    } else {
      const direction = gameState.direction === "CLOCKWISE" ? 1 : -1;

      // Handle skip cards
      if (lastPlayedCardType === "SKIP") {
        nextIndex =
          (currentIndex + 2 * direction + players.length) % players.length;
      } else {
        nextIndex =
          (currentIndex + direction + players.length) % players.length;
      }

      // Handle reverse cards
      if (lastPlayedCardType === "REVERSE") {
        const newDirection =
          gameState.direction === "CLOCKWISE"
            ? "COUNTER_CLOCKWISE"
            : "CLOCKWISE";
        await this.db
          .update(gameStateTable)
          .set({ direction: newDirection })
          .where(eq(gameStateTable.id, "game"));

        // For 2 players, reverse acts like skip
        if (players.length === 2) {
          nextIndex = currentIndex; // Stay with current player
        }
      }

      // Handle draw two and wild draw four
      if (
        lastPlayedCardType === "DRAW_TWO" ||
        lastPlayedCardType === "WILD_DRAW_FOUR"
      ) {
        const nextPlayer = players[nextIndex];
        const cardCount = lastPlayedCardType === "DRAW_TWO" ? 2 : 4;
        await this.dealCards(nextPlayer.id, cardCount);

        // Skip their turn
        nextIndex = (nextIndex + direction + players.length) % players.length;
      }
    }

    const nextPlayer = players[nextIndex];

    // Update current player
    await this.db
      .update(gameStateTable)
      .set({
        currentPlayerId: nextPlayer.id,
        updatedAt: new Date(),
      })
      .where(eq(gameStateTable.id, "game"));
  }

  async getPlayerCardCount(playerId) {
    const cards = await this.db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.playerId, playerId))
      .all();

    return cards.length;
  }

  async setUnoStatus(playerId, hasCalledUno) {
    await this.db
      .update(playersTable)
      .set({ hasCalledUno })
      .where(eq(playersTable.id, playerId));
  }

  async penalizeMissingUno(playerId) {
    const player = await this.db
      .select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .get();

    const cardCount = await this.getPlayerCardCount(playerId);

    // Player has one card left but hasn't called UNO
    if (player && cardCount === 1 && !player.hasCalledUno) {
      // Draw two penalty cards
      await this.dealCards(playerId, 2);

      return {
        penalized: true,
        newCardCount: 3, // 1 existing + 2 penalty
      };
    }

    return { penalized: false };
  }

  async handlePlayerWin(playerId) {
    // Update game status
    await this.db
      .update(gameStateTable)
      .set({
        status: "COMPLETED",
        winnerId: playerId,
        updatedAt: new Date(),
      })
      .where(eq(gameStateTable.id, "game"));

    // Update player score
    const player = await this.db
      .select()
      .from(playersTable)
      .where(eq(playersTable.id, playerId))
      .get();

    if (player) {
      await this.db
        .update(playersTable)
        .set({ score: player.score + 1 })
        .where(eq(playersTable.id, playerId));
    }
  }

  async getGameState() {
    const gameState = await this.db.select().from(gameStateTable).get();
    const players = await this.db
      .select()
      .from(playersTable)
      .where(eq(playersTable.isActive, true))
      .all();

    // Get card counts for each player
    const playerInfo = [];
    for (const player of players) {
      const cardCount = await this.getPlayerCardCount(player.id);
      playerInfo.push({
        ...player,
        cardCount,
      });
    }

    // Get top card
    const topCard = await this.getTopCard();

    // Get remaining deck count
    const deckCount = await this.db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.playerId, CardStackID))
      .all()
      .then((cards) => cards.length);

    return {
      ...gameState,
      players: playerInfo,
      topCard,
      deckCount,
    };
  }
}
