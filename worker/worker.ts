import { Env } from "./index";

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    console.log("Request received:", request.url);
    if (request.url.endsWith("/websocket")) {
      // Expect to receive a WebSocket Upgrade request.
      // If there is one, accept the request and return a WebSocket Response.
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return new Response("Durable Object expected Upgrade: websocket", {
          status: 426,
        });
      }
      console.log("WebSocket Upgrade request received");
      // This example will refer to the same Durable Object,
      // since the name "foo" is hardcoded.
      let id = env.GAME_ROOM.idFromName("foo");
      let stub = env.GAME_ROOM.get(id);
      console.log("Stub created:", stub);
      return stub.fetch(request);
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
