import { Env } from './index';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createRemoteJWKSet, jwtVerify } from 'jose';
const app = new Hono<{ Bindings: Env }>();

app.get('/websocket/:name/', async (c) => {
	// Expect to receive a WebSocket Upgrade request.
	// If there is one, accept the request and return a WebSocket Response.
	const upgradeHeader = c.req.header('Upgrade');
	const token = c.req.query('token');
	if (!token) {
		console.log('Token not found');
		return;
	}
	const payload = (await validateToken(token, c.env.APP_URL)) as { id: string };
	console.log(payload.id);

	if (!upgradeHeader || upgradeHeader !== 'websocket') {
		return new Response('Durable Object expected Upgrade: websocket', {
			status: 426,
		});
	}
	// console.log("WebSocket Upgrade request received");
	// This example will refer to the same Durable Object,
	// since the name "foo" is hardcoded.
	const name = c.req.param('name');
	let id = c.env.GAME_ROOM.idFromName(name);
	let stub = c.env.GAME_ROOM.get(id);

	return stub.fetch(c.req.raw);
});

const createCorsMiddleware = (env: Env) => {
	const trustedOrigins = env.TRUSTED_ORIGINS.split(',').map((origin) => origin.trim());
	return cors({
		origin: trustedOrigins,
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Cookie', 'Authorization'],
		credentials: true,
		maxAge: 86400,
	});
};

app.use('*', (c, next) => {
	const corsMiddleware = createCorsMiddleware(c.env);
	return corsMiddleware(c, next);
});

app.get('/create', (c) => {
	console.log('create');
	const name = crypto.randomUUID();
	// Handle the create game request
	const id = c.env.GAME_ROOM.idFromName(name);
	console.log('Creating game with ID:', id);
	return new Response(
		JSON.stringify({
			id: id.toString(),
		}),
		{
			status: 200,
			statusText: 'OK',
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
});

export async function validateToken(token: string, BASE_URL: string) {
	try {
		const JWKS = createRemoteJWKSet(new URL(BASE_URL + '/api/auth/jwks'));
		const { payload } = await jwtVerify(token, JWKS, {
			issuer: BASE_URL, // Should match your JWT issuer, which is the BASE_URL
			audience: BASE_URL, // Should match your JWT audience, which is the BASE_URL by default
		});
		return payload;
	} catch (error) {
		console.error('Token validation failed:', error);
		throw error;
	}
}
export default app;
