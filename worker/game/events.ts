import z from "zod";
import { Eventmanager } from "./EventManager";

const eventManager = new Eventmanager();

const JoinEvent = z.object({
  type: z.literal("join"),
  id: z.string(),
  name: z.string(),
});

eventManager.register({
  type: "join",
  schema: JoinEvent,
  func: (event) => {},
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
  func: (event) => {},
});

export { eventManager };
