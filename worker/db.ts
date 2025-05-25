import { z } from "zod";

export type CardType =
  | "number"
  | "skip"
  | "reverse"
  | "draw-two"
  | "wild"
  | "wild-draw-four"
  | "hidden";

type CardColor = "red" | "blue" | "green" | "yellow" | "black";

type Card = {
  type: CardType;
  color: CardColor;
  number?: number | null;
};

export type Player = {
  id: string;
  name: string;
  cards: Card[];
};
export type GameState = {
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  direction: "clockwise" | "counter-clockwise";
  gameStatus: GameStatus;
};
export type GameStatus = "waiting" | "in-progress" | "finished";

export function createGame() {
  return {
    players: [] as Player[],
    currentPlayerIndex: 0,
    deck: [] as Card[],
    discardPile: [] as Card[],
    direction: "clockwise" as "clockwise" | "counter-clockwise",
    gameStatus: "waiting" as GameStatus,
  };
}

function addPlayer(storage: DurableObjectStorage) {}
