import { useLastCardStore } from "@/state";
import { useDroppable } from "@dnd-kit/core";
import { CardBack } from "./Cardback";
import { CardCard, CardPreview } from "./Card";
import { Card } from "@/types";

const stackSpread = 5;
const maxNumberofVisibleCards = 5;

export function LayedCardstack() {
  const { isOver, setNodeRef } = useDroppable({
    id: "cardStack",
    data: { type: "cardStack" },
  });
  const lastCards = useLastCardStore((state) => state.lastCards) || [];
  const visableCards = lastCards.slice(-maxNumberofVisibleCards);
  return (
    <div
      ref={setNodeRef}
      className="w-50 aspect-[2/3] items-center justify-center"
    >
      {visableCards.map((lastCard, index) => (
        <CardItem card={lastCard} index={index} />
      ))}
      {isOver && (
        <CardItem
          card={
            {
              id: crypto.randomUUID(),
              name: "CardStack",
              type: "hidden",
              color: "black",
            } as Card
          }
          index={visableCards.length}
        ></CardItem>
      )}
    </div>
  );
}

function CardItem({ card, index }: { card: Card; index: number }) {
  const angle = uuidToNumberInRange(card.id, 0, 60) - 30;
  const offset = stackSpread * index;
  return (
    <div
      key={index}
      className="absolute"
      style={{
        transform: `translateY(${offset}px) rotate(${angle}deg)`,
        zIndex: index,
      }}
      // style={{
      //   transform: `rotate(${(index * 10).toFixed(3)}deg)`,
      // }}
    >
      <CardCard card={card} />
    </div>
  );
}

function uuidToNumberInRange(uuid: string, min: number, max: number): number {
  // Simple hash function (FNV-1a hash)
  let hash = 2166136261;
  for (let i = 0; i < uuid.length; i++) {
    hash ^= uuid.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }

  // Make sure the result is non-negative
  const positiveHash = hash >>> 0;

  // Scale to desired range
  const range = max - min;
  return min + (positiveHash % range);
}
