import { useGame } from "@/hooks/useGame";
import { CardBack } from "./Cardback";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { catchError } from "@/handelErrors";

export default function Drawcard() {
  const gameId = useGame();
  const draw = useMutation(api.game.drawCard);
  return (
    <div onClick={() => catchError(draw({ gameId }))} className="">
      <CardBack />
    </div>
  );
}
