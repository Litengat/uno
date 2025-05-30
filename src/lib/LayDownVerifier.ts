/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { Card } from "@/types";

export function canBeLaidOnTop(buttomcard: Card, topcard: Card) {
  if (topcard.type === "wild") {
    return true;
  }
  if (topcard.type === "wild-draw-four") {
    return true;
  }
  if (topcard.color === buttomcard.color) {
    return true;
  }
  if (topcard.type === "number" && buttomcard.type === "number") {
    return topcard.number === buttomcard.number;
  }
  if (topcard.type === buttomcard.type) {
    return true;
  }

  return false;
}
