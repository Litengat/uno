import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type { GameRoom } from "../GameRoom";
import { CardStackID } from "../GameRoom";
import { playersTable, cardsTable, gameStateTable } from "../db/schema";
import { eq, and, ne } from "drizzle-orm";

// Create context type
export interface Context {
  gameRoom: GameRoom;
  playerId: string;
}

// Initialize tRPC
const t = initTRPC.context<Context>().create();
const router = t.router;
const publicProcedure = t.procedure;

// Card color enum
const CardColor = z.enum(["RED", "BLUE", "GREEN", "YELLOW", "WILD"]);
// Card type enum
const CardType = z.enum([
  "NUMBER",
  "SKIP",
  "REVERSE",
  "DRAW_TWO",
  "WILD",
  "WILD_DRAW_FOUR",
]);

// Create the router
export const appRouter = router({
  // Player management
  joinGame: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const { gameRoom, playerId } = ctx;

      // Add player to database
      await gameRoom.db.insert(playersTable).values({
        id: playerId,
        name: input.name,
        score: 0,
        isActive: true,
      });

      // Deal initial hand
      if (await gameRoom.isGameStarted()) {
        await gameRoom.dealCards(playerId, 7);
      }

      // Notify all players
      const players = await gameRoom.db
        .select()
        .from(playersTable)
        .where(eq(playersTable.isActive, true))
        .all();

      gameRoom.broadcast(
        JSON.stringify({
          type: "playersUpdate",
          players,
        })
      );

      return { success: true, playerId };
    }),

  startGame: publicProcedure.mutation(async ({ ctx }) => {
    const { gameRoom } = ctx;

    // Create card deck if needed
    await gameRoom.initializeGameState();

    // Deal cards to all players
    const players = await gameRoom.db
      .select()
      .from(playersTable)
      .where(eq(playersTable.isActive, true))
      .all();

    for (const player of players) {
      await gameRoom.dealCards(player.id, 7);
    }

    // Set first player as current
    await gameRoom.setNextPlayer();

    // Place first card
    await gameRoom.placeInitialCard();

    // Get game state to broadcast
    const gameState = await gameRoom.getGameState();

    gameRoom.broadcast(
      JSON.stringify({
        type: "gameStarted",
        gameState,
      })
    );

    return { success: true };
  }),

  // Game actions
  playCard: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
        chosenColor: CardColor.optional(), // For wild cards
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { gameRoom, playerId } = ctx;
      const { cardId, chosenColor } = input;

      // Verify it's player's turn
      const currentTurn = await gameRoom.getCurrentTurn();
      if (currentTurn !== playerId) {
        throw new Error("Not your turn");
      }

      // Check if card exists and belongs to player
      const card = await gameRoom.db
        .select()
        .from(cardsTable)
        .where(
          and(eq(cardsTable.id, cardId), eq(cardsTable.playerId, playerId))
        )
        .get();

      if (!card) {
        throw new Error("Card not found or not yours");
      }

      // Verify card can be played
      const topCard = await gameRoom.getTopCard();
      const isValidPlay = gameRoom.isValidCardPlay(card, topCard, chosenColor);

      if (!isValidPlay) {
        throw new Error("Invalid card play");
      }

      // Play the card
      await gameRoom.playCard(cardId, chosenColor);

      // Check for win condition
      const remainingCards = await gameRoom.db
        .select()
        .from(cardsTable)
        .where(eq(cardsTable.playerId, playerId))
        .all();

      if (remainingCards.length === 0) {
        // Player won
        await gameRoom.handlePlayerWin(playerId);

        gameRoom.broadcast(
          JSON.stringify({
            type: "gameOver",
            winnerId: playerId,
          })
        );
      } else {
        // Move to next player
        await gameRoom.setNextPlayer(card.type); // Pass card type to handle special cards
      }

      // Get updated game state
      const gameState = await gameRoom.getGameState();

      // Broadcast game state update
      gameRoom.broadcast(
        JSON.stringify({
          type: "gameStateUpdate",
          gameState,
        })
      );

      return { success: true };
    }),

  drawCard: publicProcedure.mutation(async ({ ctx }) => {
    const { gameRoom, playerId } = ctx;

    // Verify it's player's turn
    const currentTurn = await gameRoom.getCurrentTurn();
    if (currentTurn !== playerId) {
      throw new Error("Not your turn");
    }

    // Draw card
    const drawnCard = await gameRoom.drawCard(playerId);

    // Send card to player privately
    const playerSocket = gameRoom.sessions.get(playerId);
    if (playerSocket) {
      playerSocket.send(
        JSON.stringify({
          type: "cardDrawn",
          card: drawnCard,
        })
      );
    }

    // Broadcast (without showing card to others)
    gameRoom.broadcastExcept(
      playerId,
      JSON.stringify({
        type: "playerDrewCard",
        playerId,
        cardCount: await gameRoom.getPlayerCardCount(playerId),
      })
    );

    // Move to next player
    await gameRoom.setNextPlayer();

    // Get updated game state
    const gameState = await gameRoom.getGameState();

    // Broadcast game state update
    gameRoom.broadcast(
      JSON.stringify({
        type: "gameStateUpdate",
        gameState,
      })
    );

    return { success: true, card: drawnCard };
  }),

  sayUno: publicProcedure.mutation(async ({ ctx }) => {
    const { gameRoom, playerId } = ctx;

    // Set player's UNO status
    await gameRoom.setUnoStatus(playerId, true);

    // Broadcast UNO call
    gameRoom.broadcast(
      JSON.stringify({
        type: "unoCall",
        playerId,
      })
    );

    return { success: true };
  },

  callOutMissingUno: publicProcedure
    .input(z.object({ targetPlayerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { gameRoom, playerId } = ctx;
      const { targetPlayerId } = input;

      // Check if target player has one card and didn't call UNO
      const result = await gameRoom.penalizeMissingUno(targetPlayerId);

      if (result.penalized) {
        // Broadcast penalty
        gameRoom.broadcast(
          JSON.stringify({
            type: "unoPenalty",
            playerId: targetPlayerId,
            calledBy: playerId,
            cardCount: result.newCardCount,
          })
        );
      }

      return {
        success: true,
        penalized: result.penalized,
      };
    }),

  // Game state queries
  getGameState: publicProcedure.query(async ({ ctx }) => {
    const { gameRoom } = ctx;
    return await gameRoom.getGameState();
  }),

  getPlayerCards: publicProcedure.query(async ({ ctx }) => {
    const { gameRoom, playerId } = ctx;

    const cards = await gameRoom.db
      .select()
      .from(cardsTable)
      .where(eq(cardsTable.playerId, playerId))
      .all();

    return cards;
  }),
});

export type AppRouter = typeof appRouter;
