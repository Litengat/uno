import { Button } from "./components/ui/button";
// import { unstable_ViewTransition as ViewTransition } from "react";

import { Link } from "react-router";
import Index from "./lobby/Index";
import { useAuth } from "./components/AuthContext";
import { useEffect } from "react";

function App() {
  const auth = useAuth();
  console.log(auth.loaded);
  return !auth.loaded ? (
    <div>
      <div>Loading...</div>
      <button onClick={auth.logout}>Logout</button>
    </div>
  ) : (
    <div>
      {auth.loggedIn ? (
        <div>
          <p>
            <span>Logged in</span>
            {auth.userId && <span> as {auth.userId}</span>}
          </p>
          {status !== "" && <p>API call: {status}</p>}
          <button onClick={auth.logout}>Logout</button>
        </div>
      ) : (
        <button onClick={auth.login}>Login with OAuth</button>
      )}
    </div>
  );

  return (
    <>
      {/* <Link to="/cardtest">Card </Link>

      <Button onClick={websocket} variant="default">
        Websocket
      </Button>
      <Link to="/create">Create Game</Link> */}
      <Index />
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
