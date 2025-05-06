import { Card } from "~/types/Card";

// 1. Define event types and payloads
export type EventMap = {
  PlayerJoined: { playerId: string; name: string; numberOfCards: number };
  PlayerLeft: { playerId: string };
  CardDrawn: { card: Card };
  CardLaidDown: { playerId: string; card: Card };
  UpdateCardCount: { playerId: string; numberOfCards: number };
};
