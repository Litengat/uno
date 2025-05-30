import { DurableObject } from 'cloudflare:workers';
import { Env } from '.';

import { Attachment } from './types';
import { safeJsonParse, sendError } from './utills';

import { EventMap } from './game/sendEvents.js';

import { handleGameEvent } from './game/eventHandler.js';
import { createGame } from './db/game.js';
import { PlayerId, removePlayer } from './db/player.js';
import { connect } from './game/events/Connect.js';

export const CardStackID = 'cardStack';

export const GameID = 0;

export class GameRoom extends DurableObject {
	sessions: Map<PlayerId, WebSocket> = new Map();

	storage: DurableObjectStorage;
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		console.log('Created...');
		ctx.storage.list().then((c) => {
			console.log(c);
		});
		// create all events

		this.storage = ctx.storage;
		this.sessions = new Map();
		ctx.getWebSockets().forEach((ws) => {
			const meta = ws.deserializeAttachment() as Attachment | undefined;
			if (!meta) {
				return;
			}
			this.sessions.set(meta.id, ws);
		});
		ctx.blockConcurrencyWhile(async () => await createGame(ctx.storage));
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

		const playerId: PlayerId = `player-${crypto.randomUUID()}`;
		// The `serializeAttachment()` method is used to attach metadata to the WebSocket connection.
		server.serializeAttachment({
			id: playerId,
			name: undefined,
		} as Attachment);

		// adding the player to the players map
		this.sessions.set(playerId, server);

		await connect(this, playerId);
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
			sendError(ws, 'Invalid attachment');
			return;
		}

		const parsedMessage = safeJsonParse(typeof message === 'string' ? message : new TextDecoder().decode(message));
		if (parsedMessage.isErr()) return;
		const xmessage = { ...parsedMessage.value, playerId: meta.id };

		handleGameEvent(xmessage, this);
	}

	async webSocketOpen(ws: WebSocket) {
		// If the client opens the connection, the runtime will invoke the webSocketOpen() handler.
		const meta = ws.deserializeAttachment() as Attachment | undefined;
		if (!meta) {
			sendError(ws, 'Invalid attachment');
			return;
		}
		this.sessions.set(meta.id, ws);
	}

	async webSocketClose(ws: WebSocket, code: number, _reason: string, _wasClean: boolean) {
		// If the client closes the connection, the runtime will invoke the webSocketClose() handler.
		ws.close(code, 'Durable Object is closing WebSocket');
		const meta = ws.deserializeAttachment() as Attachment | undefined;
		if (!meta) {
			sendError(ws, 'Invalid attachment');
			return;
		}
		console.log(`Websocket ${meta.id} got closed`);
		await removePlayer(this, meta.id);
		this.sessions.delete(meta.id);
	}

	// send a message to all players
	async broadcast(message: string) {
		console.log('Broadcasting message to all players:', message);
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

	sendPlayerEvent<K extends keyof EventMap>(playerId: PlayerId, eventName: K, payload: EventMap[K]) {
		const event = {
			type: eventName,
			...payload,
		};
		console.log(`Broadcasting message to ${playerId}:`, JSON.stringify(event));
		this.sessions.get(playerId)?.send(JSON.stringify(event));
	}
}
