import { CardBack } from "./Cardback";
import { Player } from "@/types";
import { Textfit } from "react-textfit";

const RADIUS = 120;
const MAX_WIDTH = 160;
const maxAngle = 2 * Math.asin(MAX_WIDTH / (2 * RADIUS));

export default function OtherPlayer({
  player,
  rotation = 0,
}: {
  player: Player;
  rotation: number;
}) {
  const cardNumber = player.numberOfCards;
  const angle = maxAngle / (cardNumber - 1);

  return (
    <div
      className="relative flex bottom-0"
      // rotate container −half-fan so first card is on the left
      // style={{ transform: `rotate(${(-maxAngle / 2).toFixed(3)}rad)` }}
    >
      <div className="flex items-center justify-center">
        <div className="relative w-[220px] h-[220px] rounded-full flex items-center justify-center z-100 bg-border  bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-zinc-700 shadow-lg transform transition-all duration-300 hover:scale-105">
          {/* Center name */}

          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 justify-center">
            <Textfit className=" text-center p-10" mode={"single"}>
              {player.name}
            </Textfit>
          </div>
        </div>
        <div
          style={{ transform: `rotate(${rotation}deg)` }}
          className="absolute flex items-center justify-center"
        >
          {Array.from({ length: cardNumber }).map((_, i) => (
            <CardItem key={i} index={i} angleStep={angle} radius={RADIUS} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardItem({
  angleStep,
  radius,
  index,
}: {
  index: number;
  angleStep: number;
  radius: number;
}) {
  // get dnd-kit props for dragging/sorting
  const { x, y, z, r } = getXYZRofIndex(index, angleStep, radius);
  // position calculation for dragging case

  const style: React.CSSProperties = {
    position: "absolute",
    // left: `calc(50% + ${x}px)`,
    // top: `calc(50% + ${y}px)`,
    transform: `rotate(${r}rad) translateY(${y}px) translateX(${x}px)`,
    zIndex: z, // keeps the leftmost card on top
  };

  return (
    <div style={style}>
      <CardBack extraSmall={true} />
    </div>
  );
}

function getXYZRofIndex(
  index: number,
  angleStep: number,
  radius: number
): { x: number; y: number; z: number; r: number } {
  const theta = angleStep * index - maxAngle / 2;
  const x = Math.sin(theta) * radius;
  const y = -Math.cos(theta) * radius;
  const z = index;
  const r = theta; // rotation angle
  return { x, y, z, r };
}
