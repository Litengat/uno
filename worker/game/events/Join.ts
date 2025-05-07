import { number, z } from "zod";
import { EventObject } from "../EventManager";
import { playersTable } from "~/db/schema";
import { getRandomCard, sendDrawCardEvent } from "./DrawCard";

import { updatePlayers } from "../sendEvents";

const JoinEventSchema = z.object({
  type: z.literal("Join"),
  playerid: z.string(),
  name: z.string(),
});

export const JoinEvent: EventObject<typeof JoinEventSchema> = {
  type: "Join",
  schema: JoinEventSchema,
  func: async (event, GameRoom) => {
    GameRoom.db
      .insert(playersTable)
      .values({
        id: event.playerid,
        name: event.name,
      })
      .run();
    GameRoom.sendPlayerEvent(event.playerid, "YourID", {
      playerId: event.playerid,
    });

    Array.from({ length: 7 }).forEach(() => {
      sendDrawCardEvent(event.playerid, GameRoom);
    });
    updatePlayers(GameRoom);

    GameRoom.sendEvent("CardLaidDown", {
      playerId: event.playerid,
      card: getRandomCard(),
    });
  },
};
