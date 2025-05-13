import { DurableObject } from "cloudflare:workers";
import { Env } from ".";
import { Attachment } from "./types";
import { safeJsonParse, sendError } from "./utills";
import { ServerRPC } from "./game/ServerRPC";
import {
  drizzle,
  type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";

import migrations from "../drizzle/migrations.js";
import { gameTable, playersTable } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { RequestMessage, ResponseMessage } from "./game/protocol";
import { registerProcedures } from "./game/procedures";
// import { registerGameProcedures } from "./game/sendEvents";

export const CardStackID = "cardStack";
export const GameID = 0;

export class GameRoom extends DurableObject {
  sessions: Map<string, WebSocket> = new Map();
  rpc: ServerRPC;
  db: DrizzleSqliteDODatabase;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.db = drizzle(ctx.storage);
    this.sessions = new Map();
    this.rpc = new ServerRPC(this);

    // Register all procedures
    registerProcedures(this.rpc, this);
    // registerGameProcedures(this.rpc, this);

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
  }

  async _migrate() {
    migrate(this.db, migrations);
  }

  async fetch(_request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ctx.acceptWebSocket(server);

    const id = crypto.randomUUID();
    server.serializeAttachment({
      id: id,
      name: undefined,
    } as Attachment);

    this.sessions.set(id, server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
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

    const data = parsedMessage.value;
    if (data.type === "rpc") {
      await this.rpc.handleMessage(data.payload);
    }
  }

  async webSocketOpen(ws: WebSocket) {
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
    ws.close(code, "Durable Object is closing WebSocket");
    const meta = ws.deserializeAttachment() as Attachment | undefined;
    if (!meta) {
      sendError(ws, "Invalid attachment");
      return;
    }
    this.sessions.delete(meta.id);
    this.db.delete(playersTable).where(eq(playersTable.id, meta.id)).run();
  }

  sendRPC(playerId: string, message: RequestMessage | ResponseMessage) {
    this.sessions
      .get(playerId)
      ?.send(JSON.stringify({ type: "rpc", payload: message }));
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
}
