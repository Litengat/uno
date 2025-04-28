import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import cloudflareLogo from "./assets/Cloudflare_Logo.svg";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("unknown");
  const ws = useRef<WebSocket | null>(null);
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

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://workers.cloudflare.com/" target="_blank">
          <img
            src={cloudflareLogo}
            className="logo cloudflare"
            alt="Cloudflare logo"
          />
        </a>
      </div>
      <h1>Vite + React + Cloudflare</h1>
      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          aria-label="increment"
        >
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <button onClick={websocket} aria-label="get name">
          Name from API is: {name}
        </button>
        <p>
          Edit <code>worker/index.ts</code> to change the name
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
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
