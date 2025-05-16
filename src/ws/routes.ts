import { createOS } from "../../worker/mrpc/mini-trpc";
import { z } from "zod";
import { CardSchema, PlayerSchema } from "@/types";
import {
  useCardStackStore,
  useGameStore,
  useHandStore,
  usePlayerStore,
} from "@/state";

const os = createOS();

export const clientRouter = {
  notifications: {
    showMessage: os
      .input(
        z.object({
          title: z.string(),
          message: z.string(),
        })
      )
      .handler(async ({ input }) => {
        // Show a message to the user
        alert(`${input.title}\n${input.message}`);
        return { success: true, shown: new Date().toISOString() };
      }),
  },

  game: {
    join: os
      .input(
        z.object({
          playerid: z.string(),
          name: z.string(),
        })
      )
      .handler(async ({ input }) => {
        // Handle join game logic
        return { success: true };
      }),

    startGame: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(async ({ input }) => {
        // Handle start game logic
        return { success: true };
      }),

    drawCard: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(async ({ input }) => {
        // Handle draw card logic
        return { success: true };
      }),

    layDown: os
      .input(
        z.object({
          playerid: z.string(),
          cardId: z.string(),
          wildColor: z
            .enum(["red", "blue", "green", "yellow", "black"])
            .optional(),
        })
      )
      .handler(async ({ input }) => {
        // Handle lay down card logic
        return { success: true };
      }),

    leave: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(async ({ input }) => {
        // Handle player leave logic
        return { success: true };
      }),

    updatePlayers: os
      .input(
        z.object({
          players: z.array(PlayerSchema),
        })
      )
      .handler(async ({ input }) => {
        usePlayerStore.getState().setPlayers(input.players);
        return { success: true };
      }),

    cardDrawn: os
      .input(
        z.object({
          card: CardSchema,
        })
      )
      .handler(async ({ input }) => {
        useHandStore.getState().addCard(input.card);
        return { success: true };
      }),

    cardLaidDown: os
      .input(
        z.object({
          playerId: z.string(),
          card: CardSchema,
        })
      )
      .handler(async ({ input }) => {
        useCardStackStore.getState().addCardStackCard(input.card);
        usePlayerStore.getState().decreaseplayerCards(input.playerId);
        return { success: true };
      }),

    updateCardCount: os
      .input(
        z.object({
          playerId: z.string(),
          numberOfCards: z.number(),
        })
      )
      .handler(async ({ input }) => {
        usePlayerStore
          .getState()
          .updatePlayerCards(input.playerId, input.numberOfCards);
        return { success: true };
      }),

    yourId: os
      .input(
        z.object({
          playerId: z.string(),
        })
      )
      .handler(async ({ input }) => {
        useGameStore.getState().setYourId(input.playerId);
        return { success: true };
      }),

    gameStarted: os.input(z.object({})).handler(async () => {
      // Handle game started event
      return { success: true };
    }),

    nextTurn: os
      .input(
        z.object({
          playerId: z.string(),
        })
      )
      .handler(async ({ input }) => {
        useGameStore.getState().setCurrentPlayer(input.playerId);
        return { success: true };
      }),
  },
};
