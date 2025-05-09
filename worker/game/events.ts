import z from "zod";
import { Eventmanager } from "./EventManager";
import { JoinEvent } from "./events/Join";
import { DrawCardEvent } from "./events/DrawCard";
import { LayDownEvent } from "./events/LayDown";
import { StartGameEvent } from "./events/StartGame";

export function events(eventManager: Eventmanager) {
  eventManager.register(JoinEvent);

  eventManager.register(DrawCardEvent);

  eventManager.register(LayDownEvent);

  eventManager.register(StartGameEvent);

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
