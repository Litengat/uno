import { err, ok } from "neverthrow";
import { PlayerId } from "./player";
import { GameRoom } from "@/GameRoom";

export const GameID = "Game" as const;

export type CardType =
  | "number"
  | "skip"
  | "reverse"
  | "draw-two"
  | "wild"
  | "wild-draw-four"
  | "hidden";

const colors = ["red", "blue", "green", "yellow", "black"] as const;
export type CardColor = (typeof colors)[number];

export type Card = {
  id: string;
  type: CardType;
  color: CardColor;
  number?: number | null;
};

export type GameState = {
  players: PlayerId[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  direction: "clockwise" | "counter-clockwise";
  gameStatus: GameStatus;
};
export type GameStatus = "waiting" | "running" | "finished";

export async function createGame(storage: DurableObjectStorage) {
  const deck = createDeck();
  const game = {
    players: [] as PlayerId[],
    currentPlayerIndex: 0,
    deck: deck,
    discardPile: [] as Card[],
    direction: "clockwise" as "clockwise" | "counter-clockwise",
    gameStatus: "waiting" as GameStatus,
  };
  await storage.put(GameID, game);
}

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

export function getGame(storage: DurableObjectStorage) {
  return storage.get<GameState>(GameID);
}

export async function getTopCard(gameRoom: GameRoom) {
  const game = await getGame(gameRoom.storage);
  if (!game) return err("Game dosn't exists");
  const [newCard, ...remainingDeck] = game.deck;
  game.deck = remainingDeck;
  gameRoom.storage.put(GameID, game);
  return ok(newCard);
}

export async function discardCard(gameRoom: GameRoom, card: Card) {
  const game = await getGame(gameRoom.storage);
  game?.discardPile.push(card);
  gameRoom.storage.put(GameID, game);
}

export async function addPLayerId(storage: DurableObjectStorage, id: PlayerId) {
  const game = await getGame(storage);
  game?.players.push(id);
  storage.put(GameID, game);
}

export async function removePlayer(GameRoom: GameRoom, playerId: PlayerId) {
  const game = await getGame(GameRoom.storage);
  if (game) {
    game.players = game.players.filter((p) => p !== playerId);
    GameRoom.storage.put(GameID, game);
  }
  GameRoom.storage.put(GameID, game);
  GameRoom.storage.delete(playerId);
}
