import { CardRender } from "@/components/CardRender";
import { Ban, RefreshCw } from "lucide-react";
import { memo } from "react";
import { Card, CardType } from "../types";
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
      number={card.number}
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
          CornerComp={() => <Ban className="w-8 h-8" strokeWidth={3} />}
          BodyComp={() => <Ban className="w-20 h-20 " strokeWidth={3} />}
        />
      );
    case "reverse":
      return (
        <CardRender
          color={bgColor}
          CornerComp={() => <RefreshCw className="w-8 h-8" strokeWidth={3} />}
          BodyComp={() => <RefreshCw className="w-20 h-20 " strokeWidth={3} />}
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
    <div className="w-20 h-20 rounded-full overflow-hidden">
      <div className="h-1/2 flex ">
        <div className="w-1/2 bg-rose-700"></div>
        <div className="w-1/2 bg-indigo-700"></div>
      </div>
      <div className="h-1/2 flex">
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
        "w-50 aspect-[2/3] rounded-2xl shadow-xl flex flex-col relative overflow-hidden transform transition-transform hover:scale-105 border-dotted border-2 border-gray-500 bg-gray-900/70"
        // className="w-50 aspect-[2/3] rounded-2xl shadow-xl flex flex-col relative overflow-hidden transform transition-transform hover:scale-105"
      }
    >
      {/* White oval border */}
      <div className="absolute inset-6 border-[3px] border-gray-300 border-dotted rounded-full"></div>
    </div>
  );
}
