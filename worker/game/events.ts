import z from "zod";
import { Eventmanager } from "./EventManager";
import { playersTable } from "../db/schema";

export function events(eventManager: Eventmanager) {
  const JoinEvent = z.object({
    type: z.literal("join"),
    playerid: z.string(),
    name: z.string(),
  });

  eventManager.register({
    type: "join",
    schema: JoinEvent,
    func: (event, GameRoom) => {
      const player = {
        id: event.playerid,
        name: event.name,
        cards: JSON.stringify([]),
      };
      GameRoom.db.insert(playersTable).values(player);
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
