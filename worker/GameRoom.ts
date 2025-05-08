import { DurableObject } from "cloudflare:workers";
import { Env } from ".";
import { events } from "./game/events";
import { Attachment } from "./types";
import { safeJsonParse, sendError } from "./utills";
import { Eventmanager } from "~/game/EventManager";
import {
  drizzle,
  type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";

import migrations from "../drizzle/migrations.js";
import { EventMap } from "./game/sendEvents.js";
import { playersTable } from "./db/schema.js";
import { eq } from "drizzle-orm";

export const CardStackID = "cardStack";

export class GameRoom extends DurableObject {
  sessions: Map<string, WebSocket> = new Map();

  eventManager = new Eventmanager(this);
  db: DrizzleSqliteDODatabase;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // create all events
    events(this.eventManager);
    this.db = drizzle(ctx.storage, { logger: true });
    this.sessions = new Map();
    ctx.getWebSockets().forEach((ws) => {
      const meta = ws.deserializeAttachment() as Attachment | undefined;
      if (!meta) {
        return;
      }
      this.sessions.set(meta.id, ws);
    });
    ctx.blockConcurrencyWhile(async () => {
      await this._migrate();
    });
  }

  async _migrate() {
    migrate(this.db, migrations);
  }

  async fetch(_request: Request): Promise<Response> {
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
    this.sessions.set(id, server);

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

    const parsedMessage = safeJsonParse(
      typeof message === "string" ? message : new TextDecoder().decode(message)
    );

    if (parsedMessage.isErr()) {
      sendError(ws, parsedMessage.error);
      return;
    }
    const err = this.eventManager.run({
      playerid: meta.id,
      ...parsedMessage.value,
    });
  }

  async webSocketOpen(ws: WebSocket) {
    // If the client opens the connection, the runtime will invoke the webSocketOpen() handler.
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }
    this.sessions.set(meta.id, ws);
  }
  async webSocketClose(
    ws: WebSocket,
    code: number,
    _reason: string,
    _wasClean: boolean
  ) {
    // If the client closes the connection, the runtime will invoke the webSocketClose() handler.
    ws.close(code, "Durable Object is closing WebSocket");
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }
    this.sessions.delete(meta.id);
    this.db.delete(playersTable).where(eq(playersTable.id, meta.id)).run();
  }

  // send a message to all players
  async broadcast(message: string) {
    console.log("Broadcasting message to all players:", message);
    this.sessions.forEach((session) => {
      session.send(message);
    });
  }

  sendEvent<K extends keyof EventMap>(eventName: K, payload: EventMap[K]) {
    const event = {
      type: eventName,
      ...payload,
    };
    this.broadcast(JSON.stringify(event));
  }

  sendPlayerEvent<K extends keyof EventMap>(
    playerId: string,
    eventName: K,
    payload: EventMap[K]
  ) {
    const event = {
      type: eventName,
      ...payload,
    };
    this.sessions.get(playerId)?.send(JSON.stringify(event));
  }

  createCardStack() {
    this.db.insert(playersTable).values({
      id: CardStackID,
      name: "Card Stack",
    });
  }
}
