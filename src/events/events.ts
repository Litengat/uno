import { z } from "zod";
import {
  useCardStackStore,
  useGameStore,
  useHandStore,
  usePlayerStore,
} from "@/app/state";
import { CardSchema, PlayerSchema } from "@/types";

const setPlayers = usePlayerStore.getState().setPlayers;
const addCard = useHandStore.getState().addCard;
const addCardStackCard = useCardStackStore.getState().addCardStackCard;
const decreaseplayerCards = usePlayerStore.getState().decreaseplayerCards;
const updatePlayerCards = usePlayerStore.getState().updatePlayerCards;

const setCurrentPlayer = useGameStore.getState().setCurrentPlayer;

// Define event schemas
const UpdatePlayersSchema = z.object({
  type: z.literal("UpdatePlayers"),
  players: z.array(PlayerSchema),
});

const CardDrawnSchema = z.object({
  type: z.literal("CardDrawn"),
  card: CardSchema,
});

const CardLaidDownSchema = z.object({
  type: z.literal("CardLaidDown"),
  playerId: z.string(),
  card: CardSchema,
});

const UpdateCardCountSchema = z.object({
  type: z.literal("UpdateCardCount"),
  playerId: z.string(),
  numberOfCards: z.number(),
});

const NextTurnSchema = z.object({
  type: z.literal("NextTurn"),
  playerId: z.string(),
});

// Union type of all possible events
export type Event = z.infer<
  | typeof UpdatePlayersSchema
  | typeof CardDrawnSchema
  | typeof CardLaidDownSchema
  | typeof UpdateCardCountSchema
  | typeof NextTurnSchema
>;

export function handleEvent(event: unknown) {
  // First validate the basic event structure
  const baseEvent = z.object({ type: z.string() }).safeParse(event);
  if (!baseEvent.success) {
    console.error("Invalid event structure:", baseEvent.error);
    return;
  }

  switch (baseEvent.data.type) {
    case "UpdatePlayers": {
      const parsed = UpdatePlayersSchema.safeParse(event);
      if (!parsed.success) {
        console.error("UpdatePlayers event data is invalid:", parsed.error);
        return;
      }
      setPlayers(parsed.data.players);
      break;
    }

    case "CardDrawn": {
      const parsed = CardDrawnSchema.safeParse(event);
      if (!parsed.success) {
        console.error("CardDrawn event data is invalid:", parsed.error);
        return;
      }
      addCard(parsed.data.card);
      break;
    }

    case "CardLaidDown": {
      const parsed = CardLaidDownSchema.safeParse(event);
      if (!parsed.success) {
        console.error("CardLaidDown event data is invalid:", parsed.error);
        return;
      }
      addCardStackCard(parsed.data.card);
      decreaseplayerCards(parsed.data.playerId);
      break;
    }

    case "UpdateCardCount": {
      const parsed = UpdateCardCountSchema.safeParse(event);
      if (!parsed.success) {
        console.error("UpdateCardCount event data is invalid:", parsed.error);
        return;
      }
      updatePlayerCards(parsed.data.playerId, parsed.data.numberOfCards);
      break;
    }

    case "NextTurn": {
      const parsed = NextTurnSchema.safeParse(event);
      if (!parsed.success) {
        console.error("NextTurn event data is invalid:", parsed.error);
        return;
      }
      setCurrentPlayer(parsed.data.playerId);
      break;
    }
    case "GameStarted": {
      console.log("Game Started");
      break;
    }

    default:
      console.error(`Unknown event type: ${baseEvent.data.type}`);
  }
}
