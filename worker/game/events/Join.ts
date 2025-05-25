import z from "zod";
import { playersTable } from "~/db/schema";

import { GameRoom } from "~/GameRoom";

import {
  addPlayer,
  getPlayer,
  PlayerId,
  setName,
  updatePlayers,
} from "~/db/player";

const JoinEventSchema = z.object({
  type: z.literal("Join"),
  playerId: z.string(),
  name: z.string(),
});

export type JoinEvent = z.infer<typeof JoinEventSchema>;

export async function handleJoin(event: JoinEvent, GameRoom: GameRoom) {
  const nameResult = await setName(
    GameRoom.storage,
    event.playerId as PlayerId,
    event.name
  );
  if (nameResult.isErr()) {
    console.error(nameResult.error);
  }

  await GameRoom.sendPlayerEvent(event.playerId as PlayerId, "YourID", {
    playerId: event.playerId,
  });
  await updatePlayers(GameRoom);
}
