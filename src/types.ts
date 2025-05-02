export type CardType =
  | "number"
  | "skip"
  | "reverse"
  | "draw-two"
  | "wild"
  | "wild-draw-four"
  | "hidden";

export type CardColor = "red" | "blue" | "green" | "yellow" | "black";

export type Card = {
  id: string;
  type: CardType;
  color: CardColor;
  number?: number;
};

export type Player = {
  id: string;
  name: string;
  numberOfCards: number;
};
