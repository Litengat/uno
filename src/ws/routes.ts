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

const setPlayers = usePlayerStore.getState().setPlayers;
const addCard = useHandStore.getState().addCard;
const addCardStackCard = useCardStackStore.getState().addCardStackCard;
const decreaseplayerCards = usePlayerStore.getState().decreaseplayerCards;
const updatePlayerCards = usePlayerStore.getState().updatePlayerCards;
const setYourId = useGameStore.getState().setYourId;
const setCurrentPlayer = useGameStore.getState().setCurrentPlayer;

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
    updatePlayers: os
      .input(z.object({ players: z.array(PlayerSchema) }))
      .handler(async ({ input }) => {
        setPlayers(input.players);
      }),
    cardDrawn: os
      .input(z.object({ card: CardSchema }))
      .handler(async ({ input }) => {
        addCard(input.card);
      }),
    cardLaidDown: os
      .input(z.object({ playerId: z.string(), card: CardSchema }))
      .handler(async ({ input }) => {
        addCardStackCard(input.card);
        decreaseplayerCards(input.playerId);
      }),
    yourId: os
      .input(z.object({ playerId: z.string() }))
      .handler(async ({ input }) => {
        setYourId(input.playerId);
      }),
    nextTurn: os
      .input(z.object({ playerId: z.string() }))
      .handler(async ({ input }) => {
        setCurrentPlayer(input.playerId);
      }),
    updateCardCount: os
      .input(z.object({ playerId: z.string(), number: z.number() }))
      .handler(async ({ input }) => {
        updatePlayerCards(input.playerId, input.number);
      }),
  },
};
