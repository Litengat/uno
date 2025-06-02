import { CardRender } from "@/components/CardRender";
import { Ban, RefreshCw } from "lucide-react";
import { memo } from "react";
import type { Card, CardType } from "../types";

const colors = {
  red: "bg-rose-700",
  blue: "bg-indigo-700",
  green: "bg-emerald-700",
  yellow: "bg-yellow-500",
  black: "bg-black",
};

const CardCard = memo(function Card({
  card,
  hidden,
}: {
  card: Card;
  hidden?: boolean;
}) {
  return (
    <CardPreview
      hidden={hidden}
      color={card.color}
      type={card.type}
      number={card.number ?? undefined}
    />
  );
});
export { CardCard };

const CardPreview = memo(function CardPreview({
  color,
  type,
  number,
  hidden = false,
}: {
  color: "red" | "blue" | "green" | "yellow" | "black";
  type: CardType;
  number?: number;
  hidden?: boolean;
}) {
  const bgColor = colors[color];

  if (hidden) {
    return <Skeleton></Skeleton>;
  }

  switch (type) {
    case "number":
      return (
        <CardRender
          color={bgColor}
          CornerComp={() => <div>{number}</div>}
          BodyComp={() => <div>{number}</div>}
        />
      );
    case "skip":
      return (
        <CardRender
          color={bgColor}
          CornerComp={() => <Ban className="h-8 w-8" strokeWidth={3} />}
          BodyComp={() => <Ban className="h-20 w-20" strokeWidth={3} />}
        />
      );
    case "reverse":
      return (
        <CardRender
          color={bgColor}
          CornerComp={() => <RefreshCw className="h-8 w-8" strokeWidth={3} />}
          BodyComp={() => <RefreshCw className="h-20 w-20" strokeWidth={3} />}
        />
      );
    case "draw-two":
      return (
        <CardRender
          color={bgColor}
          CornerComp={() => <div>+2</div>}
          BodyComp={() => <div>+2</div>}
        />
      );
    case "wild":
      return (
        <CardRender
          color={bgColor}
          CornerComp={() => <div></div>}
          BodyComp={() => <Wind />}
        />
      );
    case "wild-draw-four":
      return (
        <CardRender
          color={bgColor}
          CornerComp={() => <div>+4</div>}
          BodyComp={() => <Wind />}
        />
      );
    case "hidden":
      return <Skeleton></Skeleton>;
  }
});
export { CardPreview };

function Wind() {
  return (
    <div className="h-20 w-20 overflow-hidden rounded-full">
      <div className="flex h-1/2">
        <div className="w-1/2 bg-rose-700"></div>
        <div className="w-1/2 bg-indigo-700"></div>
      </div>
      <div className="flex h-1/2">
        <div className="w-1/2 bg-yellow-500"></div>
        <div className="w-1/2 bg-emerald-700"></div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div
      className={
        "relative flex aspect-[2/3] w-50 transform flex-col overflow-hidden rounded-2xl border-2 border-dotted border-gray-500 bg-gray-900/70 shadow-xl transition-transform hover:scale-105"
        // className="w-50 aspect-[2/3] rounded-2xl shadow-xl flex flex-col relative overflow-hidden transform transition-transform hover:scale-105"
      }
    >
      {/* White oval border */}
      <div className="absolute inset-6 rounded-full border-[3px] border-dotted border-gray-300"></div>
    </div>
  );
}
