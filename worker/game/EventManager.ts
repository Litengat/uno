import z from "zod";
import { Player } from "../types";
import { err, ok } from "neverthrow";

type EventObject<T extends z.AnyZodObject> = {
  type: string;
  schema: T;
  func: (event: z.infer<T>) => void;
};

export type event = {
  type: string;
  player: Player;
  [key: string]: any;
};

export class Eventmanager {
  private events: Map<string, EventObject<z.AnyZodObject>> = new Map();

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
      return err(`Event ${event.type} data is invalid`);
    }
    console.log("Parsed event", parsed.data);
    object.func(parsed.data);
    return ok();
  }
}
