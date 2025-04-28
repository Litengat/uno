import { DurableObject } from "cloudflare:workers";
import { Env } from ".";
import { eventManager } from "./game/events";
import { Player, Attachment } from "./types";
import { safeJsonParse, sendError } from "./utills";

export class GameRoom extends DurableObject {
  players: Map<string, Player> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.players = new Map();
    state.getWebSockets().forEach((ws) => {
      const meta = ws.deserializeAttachment() as Attachment | undefined;
      if (!meta) {
        return;
      }
      this.players.set(meta.id, {
        id: meta.id,
        name: meta.name,
        websocket: ws,
      });
    });
  }

  async fetch(request: Request): Promise<Response> {
    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    /* Calling `acceptWebSocket()` informs the runtime that this WebSocket is to begin terminating
     * request within the Durable Object. It has the effect of "accepting" the connection,
     * and allowing the WebSocket to send and receive messages.
     * Unlike `ws.accept()`, `state.acceptWebSocket(ws)` informs the Workers Runtime that the WebSocket
     * is "hibernatable", so the runtime does not need to pin this Durable Object to memory while
     * the connection is open. During periods of inactivity, the Durable Object can be evicted
     * from memory, but the WebSocket connection will remain open. If at some later point the
     * WebSocket receives a message, the runtime will recreate the Durable Object
     * (run the `constructor`) and deliver the message to the appropriate handler.
     */

    this.ctx.acceptWebSocket(server);

    const id = crypto.randomUUID();
    // The `serializeAttachment()` method is used to attach metadata to the WebSocket connection.
    server.serializeAttachment({
      id: id,
      name: undefined,
    } as Attachment);

    // adding the player to the players map
    this.players.set(id, {
      id: id,
      name: undefined,
      websocket: server,
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    // Upon receiving a message from the client, the server replies with the same message,
    // and the total number of connections with the "[Durable Object]: " prefix
    // and the number of connections.
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }
    const player = this.players.get(meta?.id);

    const parsedMessage = safeJsonParse(
      typeof message === "string" ? message : new TextDecoder().decode(message)
    );

    if (parsedMessage.isErr()) {
      sendError(ws, parsedMessage.error);
      return;
    }
    const err = eventManager.run({ player: player, ...parsedMessage.value });
    err.isErr;
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ) {
    // If the client closes the connection, the runtime will invoke the webSocketClose() handler.
    ws.close(code, "Durable Object is closing WebSocket");
  }
}
