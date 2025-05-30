import { useCardStackStore, useGameStore, useHandStore } from "@/app/state";
import { useDndMonitor, useDroppable } from "@dnd-kit/core";

import { CardCard } from "./Card";
import type { Card, CardColor } from "@/types";
import { useAktiveCard } from "./DndContext";
import { canBeLaidOnTop } from "@/lib/LayDownVerifier";
import { useWebSocket } from "./WebsocketProvider";
import WildCardColorDialog from "./WildCardColorDialog";
import { memo, useState } from "react";

const stackSpread = 5;
const maxNumberofVisibleCards = 5;

export function LayedCardstack() {
  const { isOver, over, setNodeRef } = useDroppable({
    id: "cardStack",
    data: { type: "cardStack" },
  });

  const lastCards = useCardStackStore((state) => state.lastCards) ?? [];
  const visableCards = lastCards.slice(-maxNumberofVisibleCards);
  const cardStack = useCardStackStore((state) => state.lastCards);
  const removeCard = useHandStore((state) => state.removeCard);
  const addLastCard = useCardStackStore((state) => state.addCardStackCard);
  const yourId = useGameStore((state) => state.yourId);
  const currenPlayer = useGameStore((state) => state.currentPlayer);
  const { sendEvent } = useWebSocket();
  const { activeCard } = useAktiveCard();

  const [open, setOpen] = useState(false);
  const [dialogCard, setDialogCard] = useState<Card | null>(null);

  useDndMonitor({
    onDragEnd(event) {
      const { active, over } = event;
      if (over?.id === "cardStack") {
        if (!cardStack) return;
        // checks if it's your turn
        if (yourId !== currenPlayer) return;

        const lastcard = cardStack[cardStack.length - 1];
        if (!lastcard || !activeCard) return;
        if (!canBeLaidOnTop(lastcard, activeCard)) return;

        removeCard(String(active?.id));
        if (
          activeCard.type === "wild" ||
          activeCard.type === "wild-draw-four"
        ) {
          setOpen(true);
          setDialogCard(activeCard);
          return;
        }

        removeCard(String(active?.id));
        addLastCard(activeCard);
        sendEvent("LayDown", {
          cardId: activeCard.id,
        });
        return;
      }
    },
  });

  const onColorSelect = (color: CardColor) => {
    console.log("Selected color:", color);
    if (!dialogCard) return;
    console.log("Active card:", dialogCard);
    const card = { ...dialogCard, color: color };
    addLastCard(card);
    sendEvent("LayDown", {
      cardId: card.id,
      wildColor: color,
    });
  };

  return (
    <div
      ref={setNodeRef}
      className="aspect-[2/3] w-50 items-center justify-center"
    >
      <WildCardColorDialog
        onColorSelect={onColorSelect}
        open={open}
        setOpen={setOpen}
      />
      {visableCards.map((lastCard, index) => (
        <CardItem key={lastCard.id} card={lastCard} index={index} />
      ))}
      {isOver &&
        activeCard &&
        canBeLaidOnTop(visableCards[visableCards.length - 1]!, activeCard) && (
          <CardItem
            card={
              {
                id: over?.id,
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

const CardItem = memo(function CardItem({
  card,
  index,
}: {
  card: Card;
  index: number;
}) {
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
});
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
