import z from "zod";
import { Eventmanager } from "./EventManager";
import { PlayerSchema } from "../types";

export function events(eventManager: Eventmanager) {
  const JoinEvent = z.object({
    type: z.literal("join"),
    player: PlayerSchema,
    name: z.string(),
  });

  eventManager.register({
    type: "join",
    schema: JoinEvent,
    func: (event, GameRoom) => {
      const player = GameRoom.players.get(event.player.id);
      if (!player) {
        return;
      }
      player.name = event.name;
      GameRoom.players.set(event.player.id, player);
      console.log("Player joined", player);
      eventManager.sendEvent(event);
    },
  });

  const LeaveEvent = z.object({
    type: z.literal("leave"),
    id: z.string(),
  });
  eventManager.register({
    type: "leave",
    schema: LeaveEvent,
    func: (event) => {
      event.id;
    },
  });

  const MessageEvent = z.object({
    type: z.literal("message"),
    id: z.string(),
    message: z.string(),
  });

  eventManager.register({
    type: "message",
    schema: MessageEvent,
    func: () => {},
  });
}
