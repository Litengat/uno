import { useEffect, useRef, useState } from "react";

import { Button } from "./components/ui/button";
// import { unstable_ViewTransition as ViewTransition } from "react";
import { CardBack } from "./components/Cardback";

import { Link } from "react-router";

import { DndHand } from "./Dndhand";

function App() {
  return (
    <>
      <Link to="/cardtest">Card </Link>

      <Button onClick={websocket} variant="default">
        Websocket
      </Button>
      <Link to="/create">Create Game</Link>

      {/* <ViewTransition name="test">
        <CardBack />
      </ViewTransition> */}
    </>
  );
}

function websocket() {
  const socket = new WebSocket("ws://localhost:5173/websocket");
  socket.onopen = () => {
    console.log("WebSocket connection opened");
    socket.send(`{
        "type": "join",
        "name": "max"
        }`);
  };
}
export default App;

// useEffect(() => {
//   const socket = new WebSocket("ws://localhost:5173/websocket");
//   socket.onopen = () => {
//     console.log("WebSocket connection opened");
//     socket.send(`{
//       "type": "join",
//       "name": "max"
//       }`);
//     ws.current = socket;
//   };
//   return () => {
//     ws.current?.close();
//   };
// }, []);
