import z from "zod";

import { GameRoom } from "~/GameRoom";

import {
  PlayerId,
  setConnectionStare,
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

  const joinResult = await setConnectionStare(
    GameRoom.storage,
    event.playerId as PlayerId,
    "Joined"
  );
  if (joinResult.isErr()) {
    console.error(joinResult.error);
  }

  await updatePlayers(GameRoom);
}
