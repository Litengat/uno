import { z } from "zod";
import { EventObject } from "../EventManager";
import { playersTable } from "~/db/schema";
import { sendDrawCardEvent } from "./drawCard";

const JoinEventSchema = z.object({
  type: z.literal("Join"),
  playerid: z.string(),
  name: z.string(),
});

export const JoinEvent: EventObject<typeof JoinEventSchema> = {
  type: "Join",
  schema: JoinEventSchema,
  func: (event, GameRoom) => {
    const player = {
      id: event.playerid,
      name: event.name,
    };
    GameRoom.db.insert(playersTable).values(player);

    console.log("Player joined", player);

    GameRoom.sendEvent("PlayerJoined", {
      playerId: event.playerid,
      name: event.name,
      numberOfCards: 7,
    });
    Array.from({ length: 7 }).forEach(() => {
      sendDrawCardEvent(event.playerid, GameRoom);
    });
  },
};
