import { DurableObject } from "cloudflare:workers";
import { Env } from ".";
import { Attachment } from "./types";
import { safeJsonParse, sendError } from "./utills";
import {
  drizzle,
  type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";

import migrations from "../drizzle/migrations.js";
import { gameTable, playersTable } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { WSServer } from "./mrpc/ws.server.js";
import { serverRouter } from "./route.js";
import { clientRouter } from "../src/ws/routes.js";
import { inferClientType } from "./mrpc/mini-trpc";

export const CardStackID = "cardStack";
export const GameID = 0;

type GameEventPayload = {
  updatePlayers: { players: any[] };
  cardDrawn: { card: any };
  cardLaidDown: { playerId: string; card: any };
  updateCardCount: { playerId: string; numberOfCards: number };
  yourId: { playerId: string };
  gameStarted: Record<string, never>;
  nextTurn: { playerId: string };
};

type GameClientType = inferClientType<typeof clientRouter>;

export class GameRoom extends DurableObject {
  sessions: Map<string, WebSocket> = new Map();
  mrpcServer: WSServer<typeof clientRouter>;
  db: DrizzleSqliteDODatabase;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.db = drizzle(ctx.storage);
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
    ctx.blockConcurrencyWhile(async () => {
      await this.db
        .insert(gameTable)
        .values({
          id: GameID,
        })
        .onConflictDoNothing()
        .run();
    });

    this.mrpcServer = new WSServer<typeof clientRouter>(
      serverRouter,
      clientRouter,
      {
        onClientConnect: (clientId) =>
          console.log(`Client connected: ${clientId}`),
        onClientDisconnect: (clientId) =>
          console.log(`Client disconnected: ${clientId}`),
        onNotification: (notification, clientId) => {
          console.log(`Notification from client ${clientId}:`, notification);
        },
        mrpc: (clientID) => {
          return this.mrpcServer.createTypedClientCaller(clientID);
        },
        db: this.db,
      }
    );
  }

  async _migrate() {
    migrate(this.db, migrations);
  }

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);

    const id = crypto.randomUUID();
    const clientId =
      request.headers.get("sec-websocket-key") || `client-${Date.now()}`;

    server.serializeAttachment({
      id: id,
      name: undefined,
      clientId: clientId,
    } as Attachment);

    this.mrpcServer.registerClient(clientId, (message) => server.send(message));
    this.sessions.set(id, server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    const meta = ws.deserializeAttachment() as Attachment;
    await this.mrpcServer.handleClientMessage(
      meta.clientId,
      message.toString()
    );

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

    // Handle game events through tRPC
    const event = {
      playerid: meta.id,
      ...parsedMessage.value,
    };

    const mrpc = this.mrpcServer.createTypedClientCaller(
      meta.clientId
    ) as GameClientType;
    switch (event.type) {
      case "Join":
        await mrpc.game.join({ playerid: event.playerid, name: event.name });
        break;
      case "StartGame":
        await mrpc.game.startGame({ playerid: event.playerid });
        break;
      case "DrawCard":
        await mrpc.game.drawCard({ playerid: event.playerid });
        break;
      case "LayDown":
        await mrpc.game.layDown({
          playerid: event.playerid,
          cardId: event.cardId,
          wildColor: event.wildColor,
        });
        break;
      case "leave":
        await mrpc.game.leave({ playerid: event.playerid });
        break;
    }
  }

  async webSocketOpen(ws: WebSocket) {
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }
    this.mrpcServer.registerClient(meta.clientId, (message) =>
      ws.send(message)
    );
    this.sessions.set(meta.id, ws);
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    _reason: string,
    _wasClean: boolean
  ) {
    ws.close(code, "Durable Object is closing WebSocket");
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }
    this.mrpcServer.removeClient(meta.clientId);
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

  // Helper method to send events through tRPC
  async sendEvent<K extends keyof GameEventPayload>(
    eventName: K,
    payload: GameEventPayload[K]
  ) {
    const message = JSON.stringify({ type: eventName, ...payload });
    this.broadcast(message);
  }

  async sendPlayerEvent<K extends keyof GameEventPayload>(
    playerId: string,
    eventName: K,
    payload: GameEventPayload[K]
  ) {
    const message = JSON.stringify({ type: eventName, ...payload });
    this.sessions.get(playerId)?.send(message);
  }

  createCardStack() {
    this.db.insert(playersTable).values({
      id: CardStackID,
      name: "Card Stack",
      position: -1,
    });
  }

  getGame() {
    const game = this.db
      .select()
      .from(gameTable)
      .where(eq(gameTable.id, GameID))
      .get();
    if (!game) {
      console.log("Game dosen't exist in Database");
      throw new Error("Game dosen't exist in Database");
    }

    return game;
  }

  mrpc(clientId: string) {
    return this.mrpcServer.createTypedClientCaller<typeof clientRouter>(
      clientId
    );
  }
}
