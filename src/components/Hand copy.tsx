import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  Active,
  Collision,
  ClientRect,
  DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { CardPreview } from "./Card";
import { DroppableContainer, RectMap } from "@dnd-kit/core/dist/store";
import { Coordinates } from "@dnd-kit/utilities";

const RADIUS = 360;
const MAX_WIDTH = 360 * 1.5;
const maxAngle = 2 * Math.asin(MAX_WIDTH / (2 * RADIUS));

export default function Sortable() {
  return <Hand></Hand>;
}

export function Hand({ ITEM_COUNT = 10 }: { ITEM_COUNT?: number }) {
  // initialize cards as ["0","1","2",…]
  const [cards, setCards] = useState(
    Array.from({ length: ITEM_COUNT }, (_, i) => String(i))
  );
  const [activeId, setActiveId] = useState<number | string | null>(null);

  const angleStep = ITEM_COUNT === 1 ? 0 : maxAngle / (ITEM_COUNT - 1);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragStart(event: DragStartEvent) {
    // setCards((cards) => cards.filter((card) => card !== event.active.id));
    setActiveId(event.active.id);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCards((cards) => {
        const array = arrayMove(
          cards,
          cards.indexOf(active.id.toString()),
          cards.indexOf(over.id.toString())
        );
        console.log("array", array);
        return array;
      });
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
        {activeId ? (
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
            <CardPreview
              color="red"
              type="number"
              number={Number(activeId)}
            ></CardPreview>
          </div>
        ) : null}
      </DragOverlay>
      {/* We need to use the same strategy for the overlay as well */}
      {/* We don’t need a “true” strategy here—rectSortingStrategy will track order only */}
      <SortableContext items={cards}>
        <div
          className="relative flex h-200 w-full bottom-0"
          // rotate container −half-fan so first card is on the left
          // style={{ transform: `rotate(${(-maxAngle / 2).toFixed(3)}rad)` }}
        >
          {cards.map((id, i) => (
            <CardItem
              key={id}
              id={id}
              index={i}
              total={cards.length}
              angleStep={angleStep}
              radius={RADIUS}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function customCollisionDetection({
  active,
  collisionRect,
  droppableRects,
  droppableContainers,
  pointerCoordinates,
}: {
  active: Active;
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

function CardItem({
  id,
  angleStep,
  radius,
}: {
  id: string;
  index: number;
  total: number;
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
    transform,
    isDragging,
  } = useSortable({ id });

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
      <CardPreview
        hidden={isDragging}
        color="red"
        type="number"
        number={Number(id)}
      />
    </div>
  );
}

function getXYZRofIndex(
  index: number,
  angleStep: number,
  radius: number
): { x: number; y: number; z: number; r: number } {
  const theta = angleStep * index - maxAngle / 2;
  const x = Math.sin(theta) * radius - MAX_WIDTH / 4;
  const y = -Math.cos(theta) * radius;
  const z = index;
  const r = theta; // rotation angle
  return { x, y, z, r };
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
