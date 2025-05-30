import { err, ok } from "neverthrow";
import { PlayerId, UpdateNextPlayer } from "./player";
import { GameRoom } from "~/GameRoom";
import { Card, createDeck } from "./card";

export const GameID = "Game" as const;

export type GameState = {
  players: PlayerId[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  direction: 1 | -1; //"clockwise" | "counter-clockwise";
  gameStatus: GameStatus;
};
export type GameStatus = "waiting" | "running" | "finished";

export async function createGame(storage: DurableObjectStorage) {
  const dbGame = await getGame(storage);
  if (dbGame) {
    console.error("game already exists");
    return;
  }
  const deck = createDeck();
  const game: GameState = {
    players: [] as PlayerId[],
    currentPlayerIndex: 0,
    deck: deck,
    discardPile: [] as Card[],
    direction: 1,
    gameStatus: "waiting" as GameStatus,
  };
  await storage.put(GameID, game);
}

export function getGame(storage: DurableObjectStorage) {
  return storage.get<GameState>(GameID);
}

export async function getTopCard(storage: DurableObjectStorage) {
  const game = await getGame(storage);
  if (!game) return err("Game not found");
  const [newCard, ...remainingDeck] = game.deck;
  game.deck = remainingDeck;
  storage.put(GameID, game);
  return ok(newCard);
}

export async function discardCard(gameRoom: GameRoom, card: Card) {
  const game = await getGame(gameRoom.storage);
  game?.discardPile.push(card);
  gameRoom.storage.put(GameID, game);
}

export async function NextTurn(GameRoom: GameRoom) {
  const game = await getGame(GameRoom.storage);
  if (!game) {
    console.error("Game not found");
    return;
  }
  const nextPlayerIndex = await UpdateNextPlayer(GameRoom.storage);
  if (nextPlayerIndex.isErr()) {
    console.error(nextPlayerIndex.error);
    return;
  }

  const nextPlayer = game.players[nextPlayerIndex.value];

  GameRoom.sendEvent("NextTurn", {
    playerId: nextPlayer,
  });
  return;
}

export async function reverse(storage: DurableObjectStorage) {
  const game = await getGame(storage);
  if (!game) {
    console.error("Game not found");
    return;
  }

  console.log("omg reverse");
  game.direction = game?.direction === 1 ? -1 : 1;
  storage.put(GameID, game);
}
