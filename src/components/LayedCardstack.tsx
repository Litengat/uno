import { useDndMonitor, useDroppable } from "@dnd-kit/core";

import { CardCard } from "./Card";
import { Card, CardColor } from "@/types";
import { useAktiveCard } from "./DndContext";
import { canBeLaidOnTop } from "@/lib/LayDownVerifier";

import WildCardColorDialog from "./WildCardColorDialog";
import { memo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useGame } from "@/hooks/useGame";
import { catchError } from "@/handelErrors";

const stackSpread = 5;
const maxNumberofVisibleCards = 5;

export function LayedCardstack() {
  const gameId = useGame();
  const { isOver, over, setNodeRef } = useDroppable({
    id: "cardStack",
    data: { type: "cardStack" },
  });

  const discardPile = useQuery(api.game.listdiscardPile, { gameId });

  const visableDiscardPile = (discardPile ?? []).slice(
    -maxNumberofVisibleCards
  );

  const playCard = useMutation(api.game.playCard);

  const { activeCard } = useAktiveCard();

  const [open, setOpen] = useState(false);
  const [dialogCard, setDialogCard] = useState<Card | null>(null);

  useDndMonitor({
    onDragEnd(event) {
      const { active, over } = event;
      if (over?.id === "cardStack") {
        if (!discardPile) return;
        // checks if it's your turn
        //  if (currenPlayer !== active?.id) return;

        const lastcard = discardPile[discardPile.length - 1];
        if (!lastcard || !activeCard) return;
        if (!canBeLaidOnTop(lastcard, activeCard)) return;

        if (
          activeCard.type === "wild" ||
          activeCard.type === "wild-draw-four"
        ) {
          setOpen(true);
          setDialogCard(activeCard);
          return;
        }

        catchError(
          playCard({
            gameId,
            cardId: activeCard.id,
          })
        );
        return;
      }
    },
  });

  const onColorSelect = (color: CardColor) => {
    console.log("Selected color:", color);
    if (!dialogCard) return;
    console.log("Active card:", dialogCard);
    const card = { ...dialogCard, color: color };
    // addLastCard(card);
    // sendEvent("LayDown", {
    //   cardId: card.id,
    //   wildColor: color,
    // });
  };

  return (
    <div
      ref={setNodeRef}
      className="w-50 aspect-[2/3] items-center justify-center"
    >
      <WildCardColorDialog
        onColorSelect={onColorSelect}
        open={open}
        setOpen={setOpen}
      />
      {visableDiscardPile.map((lastCard, index) => (
        <CardItem card={lastCard} index={index} />
      ))}
      {isOver &&
        activeCard &&
        canBeLaidOnTop(
          visableDiscardPile[visableDiscardPile.length - 1],
          activeCard
        ) && (
          <CardItem
            card={
              {
                id: over?.id,
                name: "CardStack",
                type: "hidden",
                color: "black",
              } as Card
            }
            index={visableDiscardPile.length}
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
