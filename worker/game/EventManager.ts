import z from "zod";

import { err, ok } from "neverthrow";
import { GameRoom } from "@/GameRoom";

export type EventObject<T extends z.AnyZodObject> = {
  type: string;
  schema: T;
  func: (event: z.infer<T>, GameRoom: GameRoom) => void;
};

export type event = {
  type: string;
  playerid: string;
  [key: string]: any;
};

export class Eventmanager {
  private events: Map<string, EventObject<z.AnyZodObject>> = new Map();
  private GameRoom: GameRoom;

  constructor(GameRoom: GameRoom) {
    this.GameRoom = GameRoom;
  }

  public register<T extends z.AnyZodObject>(event: EventObject<T>) {
    this.events.set(
      event.type,
      event as unknown as EventObject<z.AnyZodObject>
    );
  }

  public run(event: event) {
    const object = this.events.get(event.type);

    if (!object) {
      return err(`Event ${event.type} not found`);
    }

    const parsed = object.schema.safeParse(event);

    if (!parsed.success) {
      console.error("Event data is invalid", parsed.error);
      return err(`Event ${event.type} data is invalid`);
    }
    object.func(parsed.data, this.GameRoom);
    return ok();
  }
}
