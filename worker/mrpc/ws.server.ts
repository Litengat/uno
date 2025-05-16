import { inferClientType, Router } from "./mini-trpc";
import {
  WSHandler,
  WSMessage,
  WSNotificationMessage,
} from "../../src/ws/ws.common";
import { createMRPCClient } from "./mini-trpc";

export interface WSServerOptions<TRouter extends Router> {
  /**
   * Custom handler for client notifications
   */
  onNotification?: (
    notification: WSNotificationMessage,
    clientId: string
  ) => void;

  /**
   * Called when a client connects
   */
  onClientConnect?: (clientId: string) => void;

  /**
   * Called when a client disconnects
   */
  onClientDisconnect?: (clientId: string) => void;

  mrpc?: (clientID: string) => inferClientType<TRouter>;
}

/**
 * Server implementation for bidirectional RPC over WebSockets
 */
export class WSServer<TRouter extends Router> extends WSHandler {
  private clients = new Map<
    string,
    {
      send: (message: string) => void;
    }
  >();
  clientRouter?: Router;

  private options: WSServerOptions<TRouter>;

  constructor(
    router: Router,
    clientRouter?: Router,
    options: WSServerOptions<TRouter> = {}
  ) {
    super(router);
    this.options = options;
    this.clientRouter = clientRouter;
  }

  /**
   * Registers a new client connection
   */
  public registerClient(clientId: string, sendFn: (message: string) => void) {
    this.clients.set(clientId, {
      send: sendFn,
    });

    if (this.options.onClientConnect) {
      this.options.onClientConnect(clientId);
    }
  }

  /**
   * Removes a client connection
   */
  public removeClient(clientId: string) {
    this.clients.delete(clientId);

    if (this.options.onClientDisconnect) {
      this.options.onClientDisconnect(clientId);
    }
  }

  /**
   * Handles a message from a specific client
   */
  public async handleClientMessage(
    clientId: string,
    rawMessage: string
  ): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      console.error(`Received message from unknown client: ${clientId}`);
      return;
    }

    try {
      const message = JSON.parse(rawMessage) as WSMessage;

      // Handle special case for notifications from client
      if (message.type === "notification") {
        const notification = message as WSNotificationMessage;
        if (notification.direction === "client-to-server") {
          if (this.options.onNotification) {
            this.options.onNotification(notification, clientId);
          }
        } else {
          // This case should ideally not happen if directions are set correctly
          console.warn(
            "Server received a notification not intended for it:",
            notification
          );
        }
        return;
      }

      const mrpc = () => {
        if (!this.options.mrpc) {
          return;
        }
        return this.options.mrpc(clientId);
      };

      // For all other messages, use the standard handler
      const response = await this.handleMessage(rawMessage, mrpc);
      if (response) {
        client.send(response);
      }
    } catch (error) {
      console.error(`Error handling client message from ${clientId}:`, error);
      // Optionally send an error message back to the client
      // const errorResponse = ... create WSErrorMessage ...;
      // client.send(JSON.stringify(errorResponse));
    }
  }

  /**
   * Calls a procedure on a specific client
   */
  public async callClient<TInput, TOutput>(
    clientId: string,
    path: string[],
    input: TInput,
    timeout = 30000
  ): Promise<TOutput> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    return this.makeCall<TInput, TOutput>(
      (message) => client.send(message),
      path,
      input,
      "server-to-client",
      timeout
    );
  }

  /**
   * Sends a notification to a specific client
   */
  public sendNotification(
    clientId: string,
    event: string,
    payload?: unknown
  ): void {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const notification = this.createNotification(
      event,
      payload,
      "server-to-client"
    );
    client.send(notification);
  }

  /**
   * Broadcasts a notification to all connected clients
   */
  public broadcastNotification(event: string, payload?: unknown): void {
    const notification = this.createNotification(
      event,
      payload,
      "server-to-client"
    );
    for (const client of this.clients.values()) {
      client.send(notification);
    }
  }

  /**
   * Creates a typed client for calling procedures on a specific client.
   * Requires the client's Router definition to be provided when the client was registered.
   */
  public createTypedClientCaller<TClientRouter extends Router>(
    clientId: string
  ): ReturnType<typeof createMRPCClient<TClientRouter>> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }
    if (!this.clientRouter) {
      throw new Error(
        `Client router not available for client ${clientId}. Cannot create typed caller.`
      );
    }

    return createMRPCClient(this.clientRouter as TClientRouter, (path, input) =>
      this.callClient(clientId, path, input)
    );
  }
}
