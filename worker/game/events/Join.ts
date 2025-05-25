import z from "zod";
import { playersTable } from "~/db/schema";

import { count } from "drizzle-orm";
import { GameRoom } from "~/GameRoom";
import { addPlayer, PlayerId, setName, updatePlayers } from "~/db/player";

const JoinEventSchema = z.object({
  type: z.literal("Join"),
  playerid: z.string(),
  name: z.string(),
});

export type JoinEvent = z.infer<typeof JoinEventSchema>;

export async function handleJoin(event: JoinEvent, GameRoom: GameRoom) {
  setName(GameRoom.storage, event.playerid as PlayerId, event.name);
  updatePlayers(GameRoom);
}
