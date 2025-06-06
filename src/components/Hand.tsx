import React from "react";

import { SortableContext, useSortable } from "@dnd-kit/sortable";

import { CardCard } from "./Card";

import { useHandStore } from "@/app/state";
import type { Card } from "@/types";

const RADIUS = 360;
const MAX_WIDTH = 360 * 1.5;
const maxAngle = 2 * Math.asin(MAX_WIDTH / (2 * RADIUS));

export default function Sortable() {
  return <Hand></Hand>;
}

export function Hand() {
  // initialize cards as ["0","1","2",…]
  const cards = useHandStore((state) => state.Hand);

  const angleStep = cards.length === 1 ? 0 : maxAngle / (cards.length - 1);

  return (
    <SortableContext items={cards}>
      <div
        className="relative bottom-0 flex h-200 w-full"
        // rotate container −half-fan so first card is on the left
        // style={{ transform: `rotate(${(-maxAngle / 2).toFixed(3)}rad)` }}
      >
        {cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            angleStep={angleStep}
            radius={RADIUS}
          />
        ))}
      </div>
    </SortableContext>
  );
}

function CardItem({
  card,
  angleStep,
  radius,
}: {
  card: Card;
  angleStep: number;
  radius: number;
}) {
  // get dnd-kit props for dragging/sorting
  const {
    overIndex,
    activeIndex,
    attributes,
    index,
    listeners,
    setNodeRef,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
  // position calculation for dragging case
  const { x, y, z, r } = (() => {
    if (index > activeIndex && index <= overIndex) {
      return getXYZRofIndex(index - 1, angleStep, radius);
    } else if (index < activeIndex && index >= overIndex) {
      return getXYZRofIndex(index + 1, angleStep, radius);
    } else if (index === activeIndex) {
      return getXYZRofIndex(overIndex, angleStep, radius);
    } else {
      return getXYZRofIndex(index, angleStep, radius);
    }
  })();

  // Instead of using transform, we compute left/top based on our center (50%/50%)
  // Optionally adjust with half the card dimensions if needed
  const style: React.CSSProperties = {
    position: "absolute",
    left: `calc(50% + ${x}px)`,
    top: `calc(50% + ${y}px)`,
    transform: `rotate(${r}rad)`,
    transition, // animates when repositioning
    zIndex: z, // keeps the leftmost card on top
    cursor: listeners ? "grab" : undefined,
  };

  return (
    <div
      className=""
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <CardCard hidden={isDragging} card={card} />
    </div>
  );
}

function getXYZRofIndex(
  index: number,
  angleStep: number,
  radius: number,
): { x: number; y: number; z: number; r: number } {
  const theta = angleStep * index - maxAngle / 2;
  const x = Math.sin(theta) * radius - MAX_WIDTH / 4;
  const y = -Math.cos(theta) * radius;
  const z = index;
  const r = theta; // rotation angle
  return { x, y, z, r };
}
