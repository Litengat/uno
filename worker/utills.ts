import { ok, err } from "neverthrow";
export function sendError(ws: WebSocket, message: string): void {
  ws.send(
    JSON.stringify({
      type: "error",
      message,
    })
  );
}

export function safeJsonParse(jsonString: string) {
  try {
    return ok(JSON.parse(jsonString));
  } catch (e: unknown) {
    console.error("Json parse error", e);
    return err("Json failed to parse");
  }
}
