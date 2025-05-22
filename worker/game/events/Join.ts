import z from "zod";
import { playersTable } from "~/db/schema";
import { updatePlayers } from "../sendEvents";
import { count } from "drizzle-orm";
import { GameRoom } from "~/GameRoom";

const JoinEventSchema = z.object({
  type: z.literal("Join"),
  playerid: z.string(),
  name: z.string(),
});

export type JoinEvent = z.infer<typeof JoinEventSchema>;

export async function handleJoin(event: JoinEvent, GameRoom: GameRoom) {
  const position = GameRoom.db
    .select({ count: count() })
    .from(playersTable)
    .get()?.count;
  console.log("Position", position);
  GameRoom.db
    .insert(playersTable)
    .values({
      id: event.playerid,
      name: event.name,
      position: position ?? 0,
    })
    .run();
  GameRoom.sendPlayerEvent(event.playerid, "YourID", {
    playerId: event.playerid,
  });
  updatePlayers(GameRoom);
}
