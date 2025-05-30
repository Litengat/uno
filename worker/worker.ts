import { Env } from "./index";

<<<<<<< HEAD
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
=======
export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.split("/").filter(Boolean);

    if (path[0] === "websocket") {
      console.log(new URL(request.url).pathname);
      // Expect to receive a WebSocket Upgrade request.
      // If there is one, accept the request and return a WebSocket Response.
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return new Response("Durable Object expected Upgrade: websocket", {
          status: 426,
        });
      }
      // console.log("WebSocket Upgrade request received");
      // This example will refer to the same Durable Object,
      // since the name "foo" is hardcoded.
      const name = path[1] ?? "foo";
      let id = env.GAME_ROOM.idFromName(name);
      let stub = env.GAME_ROOM.get(id);

      return stub.fetch(request);
    }

    if (request.url.endsWith("/create")) {
      const name = crypto.randomUUID();
      // Handle the create game request
      const id = env.GAME_ROOM.idFromName(name);
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
    }

    return new Response(null, {
      status: 400,
      statusText: "Bad Request",
      headers: {
        "Content-Type": "text/plain",
      },
    });
  },
};
>>>>>>> parent of 5788069 (nuke)
