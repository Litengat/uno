import { z } from "zod";
import { GameRoom } from "~/GameRoom";
import { handleDrawCard, DrawCardEvent } from "./events/DrawCard";
import { handleJoin, JoinEvent } from "./events/Join";
import { handleLayDown, LayDownEvent } from "./events/LayDown";
import { handleStartGame, StartGameEvent } from "./events/StartGame";

type GameEvent = DrawCardEvent | JoinEvent | LayDownEvent | StartGameEvent;

export async function handleGameEvent(event: unknown, GameRoom: GameRoom) {
  // First validate the basic event structure
  const baseEvent = z.object({ type: z.string() }).safeParse(event);
  if (!baseEvent.success) {
    console.log(event);
    console.error("Invalid event structure:", baseEvent.error);
    return;
  }

  switch (baseEvent.data.type) {
    case "DrawCard":
      return handleDrawCard(event as DrawCardEvent, GameRoom);
    case "Join":
      return handleJoin(event as JoinEvent, GameRoom);
    case "LayDown":
      return handleLayDown(event as LayDownEvent, GameRoom);
    case "StartGame":
      return handleStartGame(event as StartGameEvent, GameRoom);
    default:
      console.error(`Unknown event type: ${baseEvent.data.type}`);
  }
}
