import { EventObject } from "../EventManager";

import { z } from "zod";
import { getRandomCard, sendDrawCardEvent } from "./DrawCard";
import { updatePlayers } from "../sendEvents";
import { cardsTable, playersTable } from "~/db/schema";
import { CardStackID } from "~/GameRoom";
import { ne } from "drizzle-orm";

const StartGameEventSchema = z.object({
  type: z.literal("StartGame"),
  playerid: z.string(),
});
export const StartGameEvent: EventObject<typeof StartGameEventSchema> = {
  type: "StartGame",
  schema: StartGameEventSchema,
  func: async (event, GameRoom) => {
    console.log("Starting game");

    GameRoom.sendEvent("GameStarted", {});
    const players = await GameRoom.db
      .select()
      .from(playersTable)
      .where(ne(playersTable.id, CardStackID))
      .all();

    players.forEach((player) => {
      Array.from({ length: 7 }).forEach(() => {
        sendDrawCardEvent(player.id, GameRoom);
      });
    });
    updatePlayers(GameRoom);
    const card = getRandomCard();

    GameRoom.db
      .insert(cardsTable)
      .values({ ...card, holder: CardStackID })
      .run();

    GameRoom.sendEvent("CardLaidDown", {
      playerId: event.playerid,
      card: getRandomCard(),
    });
    GameRoom.sendEvent("NextTurn", {
      playerId: players.sort((a, b) => a.position - b.position)[0].id,
    });
  },
};
