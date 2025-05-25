import { err, ok } from "neverthrow";
import { addPLayerId, Card, getGame } from "./game";
import { GameRoom } from "@/GameRoom";

export type PlayerId = `player-${string}`;
export type Player = {
  id: PlayerId;
  name: string | undefined;
  cards: Card[];
};

export function getPlayer(storage: DurableObjectStorage, id: PlayerId) {
  return storage.get<Player>(id);
}

export async function addPlayer(storage: DurableObjectStorage, id: PlayerId) {
  const game = await getGame(storage);
  if (!game) {
    throw new Error("Game not found2");
  }

  const playerId: PlayerId = `player-${id}`;

  const player: Player = {
    id: playerId,
    name: undefined,
    cards: [],
  };

  addPLayerId(storage, playerId);

  storage.put(playerId, player);
  return player;
}

export async function setName(
  storage: DurableObjectStorage,
  id: PlayerId,
  name: string
) {
  const player = await getPlayer(storage, id);
  if (!player) return err("Player don't exists");
  player.name = name;
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
      };
    })
  );
  return ok(players.filter((p) => p !== undefined));
}

export async function updatePlayers(GameRoom: GameRoom) {
  const players = await getAllPlayers(GameRoom.storage);

  if (players.isErr()) {
    console.error(players.error);
    return;
  }
  GameRoom.sendEvent("UpdatePlayers", { players: players.value });
}

export async function addCardToPlayer(
  storage: DurableObjectStorage,
  playerId: PlayerId,
  card: Card
) {
  const player = await getPlayer(storage, playerId);
  if (!player) return err("Player not found");
  player.cards.push(card);
  storage.put(player.id, player);
}
