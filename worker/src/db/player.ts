import { err, ok } from 'neverthrow';
import { GameID, getGame, getTopCard } from './game';
import { GameRoom } from '~/GameRoom';
import { z } from 'zod';
import { Card, CardId } from './card';

export const PlayerIdSchema = z.literal(`player-${z.string().uuid()}`);

export type PlayerId = z.infer<typeof PlayerIdSchema>;

export type ConnectionState = 'Connected' | 'Joined' | 'Left';

export type Player = {
	id: PlayerId;
	name: string | undefined;
	cards: Card[];
	connectionState: ConnectionState;
};

export function getPlayer(storage: DurableObjectStorage, id: PlayerId) {
	return storage.get<Player>(id);
}

export async function addPlayer(storage: DurableObjectStorage, playerId: PlayerId) {
	const game = await getGame(storage);

	if (!game) {
		throw new Error('Game not found');
	}

	const player: Player = {
		id: playerId,
		name: undefined,
		cards: [],
		connectionState: 'Connected',
	};

	storage.put(playerId, player);

	game?.players.push(playerId);
	storage.put(GameID, game);
	return player;
}
export async function removePlayer(GameRoom: GameRoom, playerId: PlayerId) {
	const game = await getGame(GameRoom.storage);
	if (game) {
		game.players = game.players.filter((p) => p !== playerId);
		GameRoom.storage.put(GameID, game);
	}
	GameRoom.storage.put(GameID, game);
	GameRoom.storage.delete(playerId);
}

export async function setName(storage: DurableObjectStorage, id: PlayerId, name: string) {
	const player = await getPlayer(storage, id);
	console.log(player);
	if (!player) return err("Player don't exists");
	player.name = name;
	storage.put(player.id, player);
	return ok();
}

export async function setConnectionStare(storage: DurableObjectStorage, id: PlayerId, state: ConnectionState) {
	const player = await getPlayer(storage, id);
	console.log(player);
	if (!player) return err("Player don't exists");
	player.connectionState = state;
	storage.put(player.id, player);
	return ok();
}

export type OtherPlayer = {
	id: PlayerId;
	name: string | undefined;
	numberOfCards: number;
};

export async function getAllPlayers(storage: DurableObjectStorage) {
	const game = await getGame(storage);
	if (!game) return err("Game dosn't exists");
	const players = await Promise.all(
		await game.players.map(async (id) => {
			const player = await getPlayer(storage, id);
			if (!player) return;
			return {
				id: player.id,
				name: player.name,
				numberOfCards: player.cards.length,
				connectionState: player.connectionState,
			};
		}),
	);
	return ok(players.filter((p) => p !== undefined));
}

export async function updatePlayers(GameRoom: GameRoom) {
	const players = await getAllPlayers(GameRoom.storage);

	if (players.isErr()) {
		console.error(players.error);
		return;
	}
	GameRoom.sendEvent('UpdatePlayers', { players: players.value });
}

export async function addCardToPlayer(storage: DurableObjectStorage, playerId: PlayerId, card: Card) {
	const player = await getPlayer(storage, playerId);
	if (!player) return err('Player not found');
	player.cards.push(card);
	storage.put(player.id, player);
}

export async function getPlayerCard(storage: DurableObjectStorage, playerId: PlayerId, cardId: CardId) {
	const player = await getPlayer(storage, playerId);
	if (!player) return err('Player not Found');

	const card = player.cards.find((c) => c.id === cardId);
	if (!card) return err('card not Found');
	return ok(card);
}

export async function UpdateNextPlayer(storage: DurableObjectStorage) {
	const game = await getGame(storage);
	if (!game) return err('Game Not found');
	const nextIndex1 = (game.currentPlayerIndex + game.direction) % game.players.length;
	const nextIndex = nextIndex1 < 0 ? game.players.length - 1 : nextIndex1;
	game.currentPlayerIndex = nextIndex;
	storage.put(GameID, game);
	return ok(nextIndex);
}
export async function getNextPlayer(storage: DurableObjectStorage) {
	const game = await getGame(storage);
	if (!game) return err('Game Not found');
	const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
	const nextPlayerId = game.players[nextIndex];
	return ok(nextPlayerId);
}

export async function drawNextPlayer(storage: DurableObjectStorage, number: number) {
	const game = await getGame(storage);
	if (!game) return err('Game not found');
	const nextIndex = (game.currentPlayerIndex + 1) % game.players.length;
	const nextPLayerId = game.players[nextIndex];
	const nextPlayer = await getPlayer(storage, nextPLayerId);
	if (!nextPlayer) return err('NextPlayer not found');

	for (let index = 0; index < number; index++) {
		const cardResult = await getTopCard(storage);
		if (cardResult.isErr()) return err(cardResult.error);
		nextPlayer.cards.push(cardResult.value);
	}

	storage.put(nextPLayerId, nextPlayer);
}
