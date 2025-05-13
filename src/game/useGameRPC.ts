import { useRPC } from "./useRPC";
import type { Card } from "~/types/Card";

export function useGameRPC(ws: WebSocket | null) {
  const { call } = useRPC(ws);

  return {
    game: {
      updatePlayers: () => call<{ players: any[] }>("game.updatePlayers", {}),
      playerLeft: (playerId: string) =>
        call<{ success: boolean }>("game.playerLeft", { playerId }),
      cardDrawn: (card: Card) =>
        call<{ success: boolean }>("game.cardDrawn", { card }),
      cardLaidDown: (playerId: string, card: Card) =>
        call<{ success: boolean }>("game.cardLaidDown", { playerId, card }),
      updateCardCount: (playerId: string, numberOfCards: number) =>
        call<{ success: boolean }>("game.updateCardCount", {
          playerId,
          numberOfCards,
        }),
      gameStarted: () => call<{ success: boolean }>("game.gameStarted", {}),
      nextTurn: (playerId: string) =>
        call<{ success: boolean }>("game.nextTurn", { playerId }),
    },
  };
}
