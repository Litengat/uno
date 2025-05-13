import { GameRoom } from "@/GameRoom";
import { ProcedureType, RequestMessage, ResponseMessage } from "./protocol";
import { z } from "zod";

export class ServerRPC {
  private procedures: Map<string, ProcedureType> = new Map();
  private pendingRequests: Map<string, (response: ResponseMessage) => void> =
    new Map();

  constructor(private gameRoom: GameRoom) {}

  register(name: string, procedure: ProcedureType) {
    this.procedures.set(name, procedure);
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
        this.gameRoom
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
    this.gameRoom.sendRPC(playerid, response);
  }

  async call<T>(
    playerid: string,
    procedure: string,
    input: any
  ): Promise<{ output?: T; error?: string }> {
    const id = crypto.randomUUID();
    const request: RequestMessage = {
      type: "request",
      id,
      playerid,
      procedure,
      input,
    };

    return new Promise((resolve) => {
      this.pendingRequests.set(id, resolve);
      this.gameRoom.sendRPC(playerid, request);
    });
  }
}
