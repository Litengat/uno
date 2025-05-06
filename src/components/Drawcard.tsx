import { CardBack } from "./Cardback";
import { useWebSocket } from "./WebsocketProvider";

export default function Drawcard() {
  const { sendEvent } = useWebSocket();

  const handleClick = () => {
    sendEvent("DrawCard", {});
  };

  return (
    <div onClick={handleClick} className="">
      <CardBack />
    </div>
  );
}
