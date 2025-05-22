import { useGame } from "@/hooks/useGame";
import { CardBack } from "./Cardback";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { catchError } from "@/handelErrors";

/**
 * Renders a clickable card back that triggers a draw card mutation for the current game.
 *
 * When clicked, attempts to draw a card for the active game session by invoking the server-side mutation.
 */
export default function Drawcard() {
  const gameId = useGame();
  const draw = useMutation(api.game.drawCard);
  return (
    <div onClick={() => catchError(draw({ gameId }))} className="">
      <CardBack />
    </div>
  );
}
