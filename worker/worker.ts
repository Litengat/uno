import { Env } from "./index";

import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/websocket/:name", (c) => {
  // Expect to receive a WebSocket Upgrade request.
  // If there is one, accept the request and return a WebSocket Response.
  const upgradeHeader = c.req.header("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Durable Object expected Upgrade: websocket", {
      status: 426,
    });
  }
  // console.log("WebSocket Upgrade request received");
  // This example will refer to the same Durable Object,
  // since the name "foo" is hardcoded.
  const name = c.req.param("name");
  let id = c.env.GAME_ROOM.idFromName(name);
  let stub = c.env.GAME_ROOM.get(id);

  return stub.fetch(c.req.raw);
});

app.get("/create", (c) => {
  const name = crypto.randomUUID();
  // Handle the create game request
  const id = c.env.GAME_ROOM.idFromName(name);
  console.log("Creating game with ID:", id);
  return new Response(
    JSON.stringify({
      id: id.toString(),
    }),
    {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
});

export default app;
