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

export const colors = ["red", "blue", "green", "yellow", "black"] as const;
export const normalColors = ["red", "blue", "green", "yellow"] as const;

export const CardColorSchema = z.enum(colors);

export type CardColor = z.infer<typeof CardColorSchema>;

export const CardIdSchema = z.literal(`card-${z.string()}`);
export type CardId = z.infer<typeof CardIdSchema>;

export const CardSchema = z.object({
  id: CardIdSchema,
  type: CardTypeSchema,
  color: CardColorSchema,
  number: z.number().optional(),
});
export type Card = z.infer<typeof CardSchema>;

export function createDeck(): Card[] {
  const numbers = Array.from({ length: 9 }).map((_, i) => i);
  const actions = ["skip", "reverse", "draw-two"] as const;

  const deck: Card[] = [];

  // Add number cards
  for (const color of normalColors) {
    for (const number of numbers) {
      deck.push({
        id: `card-${crypto.randomUUID()}`,
        color,
        number: number,
        type: "number",
      });
      deck.push({
        id: `card-${crypto.randomUUID()}`,
        color,
        number: number,
        type: "number",
      });
    }
  }

  // Add action cards
  for (const color of normalColors) {
    for (const action of actions) {
      deck.push({ id: `card-${crypto.randomUUID()}`, color, type: action });
      deck.push({ id: `card-${crypto.randomUUID()}`, color, type: action });
    }
  }
  Array.from({ length: 4 }).map((_, i) => {
    deck.push({
      id: `card-${crypto.randomUUID()}`,
      color: "black",
      type: "wild-draw-four",
    });
    deck.push({
      id: `card-${crypto.randomUUID()}`,
      color: "black",
      type: "wild",
    });
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

export function canBeLaidOnTop(buttomcard: Card, topcard: Card) {
  if (topcard.type === "wild") {
    return true;
  }
  if (topcard.type === "wild-draw-four") {
    return true;
  }
  if (topcard.color === buttomcard.color) {
    return true;
  }
  if (topcard.type === "number" && buttomcard.type === "number") {
    return topcard.number === buttomcard.number;
  }
  if (topcard.type === buttomcard.type) {
    return true;
  }

  return false;
}
