import { z } from "zod";

export class GameRoom {
  private players: Map<string, any>; // Replace 'any' with a specific player type if available
  private state: any; // Replace 'any' with a specific game state type if available

  constructor() {
    this.players = new Map();
    this.state = {}; // Initialize with default game state
  }

  public addPlayer(playerId: string, playerData: any) {
    this.players.set(playerId, playerData);
  }

  public removePlayer(playerId: string) {
    this.players.delete(playerId);
  }

  public getPlayer(playerId: string) {
    return this.players.get(playerId);
  }

  public getAllPlayers() {
    return Array.from(this.players.values());
  }

  public updateState(newState: any) {
    this.state = { ...this.state, ...newState }; // Merge new state with existing state
  }

  public getState() {
    return this.state;
  }

  // Additional methods for game logic can be added here
}