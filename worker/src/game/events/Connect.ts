import { addPlayer, PlayerId, updatePlayers } from '~/db/player';
import { GameRoom } from '~/GameRoom';

export async function connect(GameRoom: GameRoom, playerId: PlayerId) {
	await addPlayer(GameRoom.storage, playerId);
	await updatePlayers(GameRoom);
}
