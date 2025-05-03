import { useHandStore } from "@/state";

import { ReactNode, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  Collision,
  ClientRect,
  DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { CardCard } from "./Card";
import { DroppableContainer, RectMap } from "@dnd-kit/core/dist/store";
import { Coordinates } from "@dnd-kit/utilities";
import { Card } from "@/types";
import { useWebSocket } from "@/WebsocketProvider";

export default function DndContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const cards = useHandStore((state) => state.Hand);
  const setCards = useHandStore((state) => state.setHand);
  // const addLastCard = useCardStackStore((state) => state.addCardStackCard);
  const removeCard = useHandStore((state) => state.removeCard);

  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const { sendEvent } = useWebSocket();

  function handleDragStart(event: DragStartEvent) {
    // setCards((cards) => cards.filter((card) => card !== event.active.id));
    const card = cards.find((card) => card.id === event.active.id) ?? null;
    if (!card) return;
    setActiveCard(card);
  }
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (over?.id === "cardStack") {
      console.log("over", over);
      const card = cards.find((card) => card.id === active.id) ?? null;
      removeCard(String(event.active?.id));
      if (!card) return;
      // addLastCard(card);
      sendEvent("LayDown", {
        cardId: card.id,
      });
      return;
    }
    if (over && active.id !== over.id) {
      const newCards = arrayMove(
        cards,
        cards.findIndex((card) => card.id === active.id),
        cards.findIndex((card) => card.id === over.id)
      );
      setCards(newCards);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      collisionDetection={customCollisionDetection}
    >
      {/* {createPortal( */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeCard ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
            }}
          >
            <CardCard card={activeCard} />
          </div>
        ) : null}
      </DragOverlay>
      {children}
    </DndContext>
  );
}

function customCollisionDetection({
  collisionRect,
  droppableRects,
  droppableContainers,
  pointerCoordinates,
}: {
  collisionRect: ClientRect;
  droppableRects: RectMap;
  droppableContainers: DroppableContainer[];
  pointerCoordinates: Coordinates | null;
}): Collision[] {
  const centerRect = centerOfRectangle(
    collisionRect,
    collisionRect.left,
    collisionRect.top
  );
  const collisions = [];

  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);

    if (rect) {
      const distBetween = distanceBetween(
        centerOfRectangle(rect, rect.left, rect.top),
        pointerCoordinates || centerRect
      );
      collisions.push({
        id,
        data: {
          droppableContainer,
          value: distBetween,
        },
      });
    }
  }

  return collisions.sort(sortCollisionsAsc);
}

/**
 * Returns the coordinates of the center of a given ClientRect
 */

function centerOfRectangle(rect: ClientRect, left: number, top: number) {
  if (left === void 0) {
    left = rect.left;
  }

  if (top === void 0) {
    top = rect.top;
  }

  return {
    x: left + rect.width * 0.5,
    y: top + rect.height * 0.5,
  };
}

/**
 * Returns the distance between two points
 */
function distanceBetween(p1: Coordinates, p2: Coordinates) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function sortCollisionsAsc(
  _ref: { data: { value: any } },
  _ref2: { data: { value: any } }
) {
  let {
    data: { value: a },
  } = _ref;
  let {
    data: { value: b },
  } = _ref2;
  return a - b;
}
