import { Card } from "~/types/Card";

// 1. Define event types and payloads
export type EventMap = {
  Join: { name: string };
  PlayerLeft: { playerId: string };
  CardDraw: { card: Card };
  LayDown: { cardId: string; wildColor?: string };
  DrawCard: {};
  StartGame: {};
};
