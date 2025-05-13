import z from "zod";
import { err, ok } from "neverthrow";
import { GameRoom } from "@/GameRoom";

export type EventObject<T extends z.AnyZodObject> = {
  type: string;
  schema: T;
  func: (event: z.infer<T>, gameRoom: GameRoom) => void;
};

export type Event = {
  type: string;
  playerId: string;
  [key: string]: any;
};

export class EventManager {
  private events: Map<string, EventObject<z.AnyZodObject>> = new Map();
  private gameRoom: GameRoom;

  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  public register<T extends z.AnyZodObject>(event: EventObject<T>) {
    this.events.set(event.type, event as unknown as EventObject<z.AnyZodObject>);
  }

  public run(event: Event) {
    const object = this.events.get(event.type);

    if (!object) {
      return err(`Event ${event.type} not found`);
    }

    const parsed = object.schema.safeParse(event);

    if (!parsed.success) {
      console.error("Event data is invalid", parsed.error);
      return err(`Event ${event.type} data is invalid`);
    }
    
    object.func(parsed.data, this.gameRoom);
    return ok();
  }
}