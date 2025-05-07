import { EventObject } from "../EventManager";

import { z } from "zod";

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
  },
};
