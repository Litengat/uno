import { z } from "zod";
import { createOS } from "../mrpc/mini-trpc";
import { err, ok } from "neverthrow";
import { GameRoom } from "@/GameRoom";

export type EventObject<T extends z.AnyZodObject> = {
  type: string;
  schema: T;
  func: (event: z.infer<T>, GameRoom: GameRoom) => void;
};

const os = createOS();

export class GameEventManager {
  private events: Map<string, EventObject<z.AnyZodObject>> = new Map();

  public register<T extends z.AnyZodObject>(event: EventObject<T>) {
    this.events.set(
      event.type,
      event as unknown as EventObject<z.AnyZodObject>
    );
  }

  public run(event: z.infer<typeof gameEventSchema>, gameRoom: GameRoom) {
    const object = this.events.get(event.type);

    if (!object) {
      return err(`Event ${event.type} not found`);
    }

    const parsed = object.schema.safeParse(event);

    if (!parsed.success) {
      console.error("Event data is invalid", parsed.error);
      return err(`Event ${event.type} data is invalid`);
    }
    object.func(parsed.data, gameRoom);
    return ok();
  }
}

// Define the base game event schema
export const gameEventSchema = z.object({
  type: z.string(),
  playerid: z.string(),
  data: z.record(z.any()),
});

// Create a new router for game events
