import { z } from "zod";
import { EventObject } from "../EventManager";
import { Card } from "~/types/Card";
import { GameRoom } from "~/GameRoom";
import { cardsTable } from "~/db/schema";

const DrawCardSchema = z.object({
  type: z.literal("drawCard"),
  playerid: z.string(),
});

export const DrawCardEvent: EventObject<typeof DrawCardSchema> = {
  type: "drawCard",
  schema: DrawCardSchema,
  func: (event, GameRoom) => {
    const card = getRandomCard();
    GameRoom.sendPlayerEvent(event.playerid, "CardDrawn", {
      card: card,
    });
  },
};

export function sendDrawCardEvent(playerid: string, GameRoom: GameRoom) {
  const card = getRandomCard();
  GameRoom.db
    .insert(cardsTable)
    .values({
      id: card.id,
      type: card.type,
      color: card.color,
      number: card.number,
      holder: playerid,
    })
    .run();
  GameRoom.sendPlayerEvent(playerid, "CardDrawn", {
    card: card,
  });
}

function getRandomCard(): Card {
  const colors = ["red", "blue", "green", "yellow"] as const;
  const cards = [
    ...Array.from({ length: 10 }, (_, i) => i),
    "skip",
    "reverse",
    "draw-two",
    "wild",
    "wild-draw-four",
  ] as const;
  const card = cards[Math.floor(Math.random() * cards.length)];
  if (card === "wild" || card === "wild-draw-four") {
    return {
      id: crypto.randomUUID(),
      type: card,
      color: "black",
      number: undefined,
    };
  }
  const color = colors[Math.floor(Math.random() * colors.length)];

  if (typeof card === "number") {
    return {
      id: crypto.randomUUID(),
      type: "number",
      color: color,
      number: card,
    };
  }

  return {
    id: crypto.randomUUID(),
    type: card,
    color: color,
    number: undefined,
  };
}
