import { z } from "zod";
import { Eventmanager } from "./EventManager";
import {
  useCardStackStore,
  useGameStore,
  useHandStore,
  usePlayerStore,
} from "@/state";
import { CardSchema, PlayerSchema } from "@/types";

const setPlayers = usePlayerStore.getState().setPlayers;
const addCard = useHandStore.getState().addCard;
const addCardStackCard = useCardStackStore.getState().addCardStackCard;
const decreaseplayerCards = usePlayerStore.getState().decreaseplayerCards;
const updatePlayerCards = usePlayerStore.getState().updatePlayerCards;
const setYourId = useGameStore.getState().setYourId;

export const eventManager = new Eventmanager();

eventManager.register({
  type: "UpdatePlayers",
  schema: z.object({
    players: z.array(PlayerSchema),
  }),
  func: (event) => {
    setPlayers(event.players);
  },
});

eventManager.register({
  type: "CardDrawn",
  schema: z.object({
    type: z.literal("CardDrawn"),
    card: CardSchema,
  }),
  func: (event) => {
    addCard(event.card);
  },
});

eventManager.register({
  type: "CardLaidDown",
  schema: z.object({
    type: z.literal("CardLaidDown"),
    playerId: z.string(),
    card: CardSchema,
  }),
  func: (event) => {
    addCardStackCard(event.card);
    decreaseplayerCards(event.playerId);
  },
});
eventManager.register({
  type: "UpdateCardCount",
  schema: z.object({
    type: z.literal("UpdateCardCount"),
    playerId: z.string(),
    numberOfCards: z.number(),
  }),
  func: (event) => {
    updatePlayerCards(event.playerId, event.numberOfCards);
  },
});

eventManager.register({
  type: "YourID",
  schema: z.object({
    type: z.literal("YourID"),
    playerId: z.string(),
  }),
  func: (event) => {
    setYourId(event.playerId);
  },
});
