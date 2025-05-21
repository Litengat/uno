import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./components/SignInForm";
import { Button } from "./components/ui/button";
// import { unstable_ViewTransition as ViewTransition } from "react";

import { Link } from "react-router";
import { SignOutButton } from "./components/SignOutButton";
import { Games } from "./components/Games";

function App() {
  return (
    <>
      <Authenticated>
        <Link to="/cardtest">Card </Link>

        <Button onClick={websocket} variant="default">
          Websocket
        </Button>
        <SignOutButton />
        <Link to="/create">Create Game</Link>
        <Games />
      </Authenticated>
      <Unauthenticated>
        <p className="text-xl text-slate-600">Sign in to play UNO</p>
        <SignInForm />
      </Unauthenticated>
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
