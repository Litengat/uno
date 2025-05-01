import { Hand } from "@/components/Hand";
import { useParams } from "react-router";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { NameDialog } from "./components/NameDialog";
import { DndContext, useDroppable } from "@dnd-kit/core";
import DndContextProvider from "./components/DndContext";

export function Game() {
  const { id } = useParams();
  if (!id) {
    throw new Error("No game ID provided");
  } // Ensure id is a string

  // const { sendMessage, lastMessage, readyState } = useWebSocket(
  //   `ws://localhost:5173/websocket/${id}`,
  //   {
  //     onOpen: () => console.log("WebSocket connection opened"),
  //     onClose: () => console.log("WebSocket connection closed"),
  //     onError: (event) => console.error("WebSocket error:", event),
  //     shouldReconnect: (closeEvent) => true,
  //   }
  // );
  return (
    <div>
      <DndContextProvider>
        <div className="flex justify-center items-center">
          <div className="flex justify-center fixed -bottom-120">
            <Hand />
          </div>
        </div>
        <NameDialog />
        <div className="flex justify-center items-center">
          <div>
            <DroppableContainer />
          </div>
        </div>
      </DndContextProvider>
    </div>
  );
}

function DroppableContainer() {
  const { isOver, setNodeRef } = useDroppable({
    id: "droppable",
  });

  const style = {
    width: 200,
    height: 200,
    backgroundColor: isOver ? "lightgreen" : "lightgray",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "2px dashed #aaa",
    borderRadius: 8,
  };

  return (
    <div ref={setNodeRef} style={style}>
      Drop here
    </div>
  );
}
