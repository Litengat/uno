import { err, ok } from 'neverthrow';
import { z } from 'zod';

import { GameRoom } from '~/GameRoom';

import { getGame, getTopCard, NextTurn } from '~/db/game';
import { addCardToPlayer, PlayerId, getPlayer } from '~/db/player';

const DrawCardSchema = z.object({
	type: z.literal('DrawCard'),
	playerId: z.string(),
});

export type DrawCardEvent = z.infer<typeof DrawCardSchema>;

export async function handleDrawCard(event: DrawCardEvent, GameRoom: GameRoom) {
	const game = await getGame(GameRoom.storage);
	if (!game) {
		console.error('Game not Found');
		return;
	}
	const currentPlayerId = game.players[game.currentPlayerIndex];
	if (currentPlayerId !== event.playerId) {
		console.error('Not your Turn');
		return;
	}
	sendDrawCardEvent(event.playerId as PlayerId, GameRoom);

	await NextTurn(GameRoom);
}

export async function sendDrawCardEvent(playerId: PlayerId, GameRoom: GameRoom, number = 1) {
	for (let index = 0; index < number; index++) {
		const cardResult = await getTopCard(GameRoom.storage);

		if (cardResult.isErr()) {
			console.error(cardResult.error);
			return;
		}
		GameRoom.sendPlayerEvent(playerId, 'CardDrawn', { card: cardResult.value });
		await addCardToPlayer(GameRoom.storage, playerId, cardResult.value);
	}
	const player = await getPlayer(GameRoom.storage, playerId);
	if (!player) return err('Player not Found');

	GameRoom.sendEvent('UpdateCardCount', {
		playerId,
		numberOfCards: player.cards.length,
	});
	return ok();
}
