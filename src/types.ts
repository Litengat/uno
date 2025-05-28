import { z } from "zod";

// export type CardType =
//   | "number"
//   | "skip"
//   | "reverse"
//   | "draw-two"
//   | "wild"
//   | "wild-draw-four"
//   | "hidden";

// export type CardColor = "red" | "blue" | "green" | "yellow" | "black";

// export type Card = {
//   id: string;
//   type: CardType;
//   color: CardColor;
//   number?: number;
// };

// export type Player = {
//   id: string;
//   name: string;
//   numberOfCards: number;
// };
export const CardTypeSchema = z.enum([
  "number",
  "skip",
  "reverse",
  "draw-two",
  "wild",
  "wild-draw-four",
  "hidden",
]);

export type CardType = z.infer<typeof CardTypeSchema>;

export const CardColorSchema = z.enum([
  "red",
  "blue",
  "green",
  "yellow",
  "black",
]);
export type CardColor = z.infer<typeof CardColorSchema>;

export const CardSchema = z.object({
  id: z.string(),
  type: CardTypeSchema,
  color: CardColorSchema,
  number: z.number().optional().nullable(),
});
export type Card = z.infer<typeof CardSchema>;

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  numberOfCards: z.number(),
});
export type Player = z.infer<typeof PlayerSchema>;
