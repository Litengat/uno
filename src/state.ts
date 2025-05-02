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
  updatePlayerCards: (playerId: string, numberOfCards: number) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, numberOfCards } : p
      ),
    })),
}));

type LastCardStore = {
  lastCards: Card[] | null;
  addLastCard: (card: Card) => void;
  clearLastCard: () => void;
};

export const useLastCardStore = create<LastCardStore>((set) => ({
  lastCards: [],
  addLastCard: (card: Card) =>
    set((state) => ({
      lastCards: state.lastCards ? [...state.lastCards, card] : [card],
    })),
  clearLastCard: () => set({ lastCards: null }),
}));
