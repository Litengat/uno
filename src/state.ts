import { create } from "zustand";
import { Card, Player } from "./types";

type HandStore = {
  Hand: Card[];
  setHand: (hand: Card[]) => void;
  addCard: (card: Card) => void;
  removeCard: (cardid: string) => void;
  clearHand: () => void;
};

export const useHandStore = create<HandStore>((set) => ({
  Hand: [],
  setHand: (hand: Card[]) => set({ Hand: hand }),
  addCard: (card: Card) => set((state) => ({ Hand: [...state.Hand, card] })),
  removeCard: (cardid: string) =>
    set((state) => ({
      Hand: state.Hand.filter((c) => c.id !== cardid),
    })),
  clearHand: () => set({ Hand: [] }),
}));

type PlayerStore = {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (player: Player) => void;
  clearPlayers: () => void;
  updatePlayer: (player: Player) => void;
  increasePlayerCards: (playerId: string) => void;
  decreaseplayerCards: (playerId: string) => void;
  updatePlayerCards: (playerId: string, numberOfCards: number) => void;
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  players: [],
  setPlayers: (players: Player[]) => set({ players }),
  addPlayer: (player: Player) =>
    set((state) => ({ players: [...state.players, player] })),
  removePlayer: (player: Player) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== player.id),
    })),
  clearPlayers: () => set({ players: [] }),
  updatePlayer: (player: Player) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === player.id ? { ...p, ...player } : p
      ),
    })),
  increasePlayerCards: (playerId: string) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, numberOfCards: p.numberOfCards + 1 } : p
      ),
    })),
  decreaseplayerCards: (playerId: string) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, numberOfCards: p.numberOfCards - 1 } : p
      ),
    })),
  updatePlayerCards: (playerId: string, numberOfCards: number) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, numberOfCards } : p
      ),
    })),
}));

type CardStackStore = {
  lastCards: Card[] | null;
  addCardStackCard: (card: Card) => void;
  clearLastCard: () => void;
};

export const useCardStackStore = create<CardStackStore>((set) => ({
  lastCards: [],
  addCardStackCard: (card: Card) =>
    set((state) => {
      // Check if the card is already in the lastCards array
      // If it is, return the current state
      // If not, add the card to the lastCards array
      if (state.lastCards?.find((c) => c.id === card.id)) {
        return { lastCards: state.lastCards };
      }
      return {
        lastCards: state.lastCards ? [...state.lastCards, card] : [card],
      };
    }),
  clearLastCard: () => set({ lastCards: null }),
}));

type GameStore = {
  yourId: string | null;
  setYourId: (id: string | null) => void;
  gameStarted: boolean;
  setGameStarted: (started: boolean) => void;
  gameOver: boolean;
  setGameOver: (over: boolean) => void;
  currentPlayer: string | null;
  setCurrentPlayer: (playerId: string | null) => void;
  currentColor: string | null;
  setCurrentColor: (color: string | null) => void;
  winner: string | null;
  setWinner: (winner: string | null) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  yourId: null,
  setYourId: (id: string | null) => set({ yourId: id }),
  gameStarted: false,
  setGameStarted: (started: boolean) => set({ gameStarted: started }),
  gameOver: false,
  setGameOver: (over: boolean) => set({ gameOver: over }),
  currentPlayer: null,
  setCurrentPlayer: (playerId: string | null) =>
    set({ currentPlayer: playerId }),
  currentColor: null,
  setCurrentColor: (color: string | null) => set({ currentColor: color }),
  winner: null,
  setWinner: (winner: string | null) => set({ winner }),
}));
