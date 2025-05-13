import { z } from "zod";
import {
  ProcedureType,
  RequestMessage,
  ResponseMessage,
} from "../../worker/game/protocol";

export class ClientRPC {
  private procedures: Map<string, ProcedureType> = new Map();
  private pendingRequests: Map<string, (response: ResponseMessage) => void> =
    new Map();
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "rpc") {
        this.handleMessage(message.payload);
      }
    });
  }

  register<TInput extends z.ZodType, TOutput>(
    name: string,
    procedure: {
      input: TInput;
      output: z.ZodType<TOutput>;
      handler: (
        input: z.infer<TInput>,
        context: { playerid: string }
      ) => Promise<TOutput>;
    }
  ) {
    this.procedures.set(name, {
      input: procedure.input,
      output: procedure.output,
      handler: procedure.handler,
    });
  }

  async handleMessage(message: RequestMessage | ResponseMessage) {
    if (message.type === "request") {
      await this.handleRequest(message);
    } else if (message.type === "response") {
      this.handleResponse(message);
    }
  }

  private async handleRequest(message: RequestMessage) {
    const procedure = this.procedures.get(message.procedure);
    if (!procedure) {
      this.sendResponse(message.id, message.playerid, message.procedure, {
        error: `Procedure ${message.procedure} not found`,
      });
      return;
    }

    try {
      const input = procedure.input.parse(message.input);
      const output = await procedure.handler(
        input,
        {
          playerid: message.playerid,
        },
        null as any
      );
      this.sendResponse(message.id, message.playerid, message.procedure, {
        output,
      });
    } catch (error) {
      this.sendResponse(message.id, message.playerid, message.procedure, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private handleResponse(message: ResponseMessage) {
    const resolve = this.pendingRequests.get(message.id);
    if (resolve) {
      resolve(message);
      this.pendingRequests.delete(message.id);
    }
  }

  private sendResponse(
    id: string,
    playerid: string,
    procedure: string,
    data: { output?: any; error?: string }
  ) {
    const response: ResponseMessage = {
      type: "response",
      id,
      playerid,
      procedure,
      ...data,
    };
    this.ws.send(JSON.stringify({ type: "rpc", payload: response }));
  }

  async call<T>(
    procedure: string,
    input: any
  ): Promise<{ output?: T; error?: string }> {
    const id = crypto.randomUUID();
    const request: RequestMessage = {
      type: "request",
      id,
      playerid: "client", // This will be replaced by the server
      procedure,
      input,
    };

    return new Promise((resolve) => {
      this.pendingRequests.set(id, resolve);
      this.ws.send(JSON.stringify({ type: "rpc", payload: request }));
    });
  }
}
