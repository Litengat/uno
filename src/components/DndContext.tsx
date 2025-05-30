import { useHandStore } from "@/app/state";

import { createContext, type ReactNode, useContext, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type Collision,
  type ClientRect,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { CardCard } from "./Card";
import {
  type DroppableContainer,
  type RectMap,
} from "@dnd-kit/core/dist/store";
import { type Coordinates } from "@dnd-kit/utilities";
import { type Card } from "@/types";

type AktiveCardContextType = {
  activeCard: Card | null;
};

export const useAktiveCard = (): AktiveCardContextType => {
  const context = useContext(AktiveCardContext);
  if (!context) {
    throw new Error("useAktiveCard must be used within DndContextProvider");
  }
  return context;
};

const AktiveCardContext = createContext<AktiveCardContextType | undefined>(
  undefined,
);

export default function DndContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const cards = useHandStore((state) => state.Hand);
  const setCards = useHandStore((state) => state.setHand);

  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragStart(event: DragStartEvent) {
    // setCards((cards) => cards.filter((card) => card !== event.active.id));
    const card = cards.find((card) => card.id === event.active.id) ?? null;
    if (!card) return;
    setActiveCard(card);
  }
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newCards = arrayMove(
        cards,
        cards.findIndex((card) => card.id === active.id),
        cards.findIndex((card) => card.id === over.id),
      );
      setCards(newCards);
    }
  };

  return (
    <AktiveCardContext.Provider value={{ activeCard: activeCard }}>
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        collisionDetection={customCollisionDetection}
      >
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
    </AktiveCardContext.Provider>
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
    collisionRect.top,
  );
  const collisions = [];

  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);

    if (rect) {
      const distBetween = distanceBetween(
        centerOfRectangle(rect, rect.left, rect.top),
        pointerCoordinates ?? centerRect,
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
  _ref2: { data: { value: any } },
) {
  const {
    data: { value: a },
  } = _ref;
  const {
    data: { value: b },
  } = _ref2;
  return a - b;
}
