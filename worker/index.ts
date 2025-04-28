export interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
}

// Worker
import worker from "./worker";
export default worker;

// Durable Object
import { GameRoom } from "./GameRoom";
export { GameRoom };
