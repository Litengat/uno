import { z } from "zod";

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
  number: z.number().optional(),
});
export type Card = z.infer<typeof CardSchema>;

export const PlayerSchema = z.object({
  id: z.string(),
  numberOfCards: z.number(),
});
export type Player = z.infer<typeof PlayerSchema>;
