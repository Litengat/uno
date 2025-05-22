import { cardsTable, gameTable, playersTable } from "~/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { CardStackID, GameRoom } from "~/GameRoom";
import { Card, CardColorSchema } from "~/types";
import { getNextPlayerIndex, getPlayer, getPlayerbyPositon } from "../players";
import { sendDrawCardEvent } from "./DrawCard";

const LayDownEventSchema = z.object({
  type: z.literal("LayDown"),
  playerid: z.string(),
  cardId: z.string(),
  wildColor: CardColorSchema.optional(),
});

export type LayDownEvent = z.infer<typeof LayDownEventSchema>;

export async function handleLayDown(event: LayDownEvent, GameRoom: GameRoom) {
  const card = (
    await GameRoom.db
      .select()
      .from(cardsTable)
      .where(
        and(
          eq(cardsTable.id, event.cardId),
          eq(cardsTable.holder, event.playerid)
        )
      )
      .limit(1)
  )[0] as Card;

  if (!card) {
    console.error("Card not found");
    return;
  }
  card.color = event.wildColor ?? card.color;
  GameRoom.db
    .update(cardsTable)
    .set({ holder: CardStackID, color: event.wildColor })
    .where(eq(cardsTable.id, card.id))
    .run();

  switch (card.type) {
    case "reverse":
      await reverse(GameRoom);
      break;
    case "draw-two":
      nextPlayerDraw(GameRoom, 2);
      break;
    case "wild-draw-four":
      nextPlayerDraw(GameRoom, 4);
      break;
    case "skip":
      const nextIndex = await getNextPlayerIndex(GameRoom);
      if (nextIndex !== undefined) {
        console.error("next index dosen't exists");
        return;
      }
      updateCurrentPosition(GameRoom, nextIndex);
      break;
  }

  // send Card laid down Event
  console.log("Card laid down", card);
  GameRoom.sendEvent("CardLaidDown", {
    playerId: event.playerid,
    card: card,
  });

  const nextIndex = await getNextPlayerIndex(GameRoom);

  console.log("nextIndex", nextIndex);
  if (nextIndex === undefined) {
    console.error("next index dosen't exists");
    return;
  }

  const nextPlayer = await getPlayerbyPositon(GameRoom, nextIndex);

  updateCurrentPosition(GameRoom, nextIndex);

  GameRoom.sendEvent("NextTurn", {
    playerId: nextPlayer.id,
  });
  return;
}

async function reverse(GameRoom: GameRoom) {
  const game = await GameRoom.getGame();
  console.log("omg reverse");
  const flippedDirection = game?.direction === 1 ? -1 : 1;
  GameRoom.db.update(gameTable).set({ direction: flippedDirection }).all();
}

async function nextPlayerDraw(GameRoom: GameRoom, amount: number) {
  const nextIndex = await getNextPlayerIndex(GameRoom);
  if (nextIndex === undefined) {
    console.error("Next Player could draw the cards, because he dosn't exists");
    return;
  }
  console.log("next Index in draw", nextIndex);
  const nextPlayer = await getPlayerbyPositon(GameRoom, nextIndex);
  Array.from({ length: amount }).map(() => {
    sendDrawCardEvent(nextPlayer.id, GameRoom);
  });
}

function updateCurrentPosition(GameRoom: GameRoom, position: number) {
  void GameRoom.db
    .update(gameTable)
    .set({ currentPlayerIndex: position })
    .run();
}
