import { CardBack } from "./Cardback";
import { useWebSocket } from "./WebsocketProvider";
import { useGameStore } from "@/state";

export default function Drawcard() {
  const websocket = useWebSocket();
  const yourId = useGameStore((state) => state.yourId);

  const handleClick = async () => {
    if (!websocket || !yourId) return;
    await websocket.game.drawCard({ playerid: yourId });
  };

  return (
    <div onClick={handleClick} className="">
      <CardBack />
    </div>
  );
}
