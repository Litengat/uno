import {
  createMRPCClient,
  Router,
  deserializeAndExecute,
} from "../../worker/mrpc/mini-trpc";
import {
  WSHandler,
  WSMessage,
  WSNotificationMessage,
  WSRequestMessage,
  WSResponseMessage,
  WSErrorMessage,
} from "./ws.common";

/**
 * Client-specific context for procedure handlers
 */
export type ClientContext = {};

/**
 * Options for WebSocket client
 */
export interface WSClientOptions {
  url: string;
  reconnect?: boolean;
  maxRetries?: number;
  retryDelay?: (retryCount: number) => number; // Function to calculate delay

  /**
   * Called when the connection is established
   */
  onOpen?: (event: Event) => void;

  /**
   * Called when the connection is closed
   */
  onClose?: (event: CloseEvent) => void;

  /**
   * Called when an error occurs with the WebSocket connection itself
   */
  onError?: (event: Event) => void;

  /**
   * Called when a notification is received from the server
   */
  onNotification?: (notification: WSNotificationMessage) => void;
}

const defaultRetryDelay = (retryCount: number) =>
  1000 * Math.min(Math.pow(2, retryCount), 30); // Exponential backoff up to 30s

/**
 * Client implementation for bidirectional RPC over WebSockets
 */

export class WSClient extends WSHandler {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private retryCount = 0;
  private options: WSClientOptions;
  private explicitClose = false;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(clientRouter: Router, options: WSClientOptions) {
    super(clientRouter); // This is the router for procedures the server can call on this client
    this.options = {
      reconnect: true,
      maxRetries: Infinity,
      retryDelay: defaultRetryDelay,
      ...options,
    };
  }

  /**
   * Connects to the WebSocket server
   */
  public connect(): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      console.log("WebSocket already open or connecting.");
      return;
    }

    this.explicitClose = false;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    console.log(`Attempting to connect to ${this.options.url}...`);
    this.socket = new WebSocket(this.options.url);

    this.socket.onopen = (event) => {
      this.isConnected = true;
      this.retryCount = 0;
      console.log("WebSocket connected.");
      if (this.options.onOpen) this.options.onOpen(event);
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      console.log(
        `WebSocket closed (code: ${event.code}, reason: ${event.reason}, explicit: ${this.explicitClose})`
      );
      if (this.options.onClose) this.options.onClose(event);

      // Reject all pending requests
      this.pendingRequests.forEach((request, id) => {
        clearTimeout(request.timeout);
        request.reject(new Error("WebSocket connection closed"));
        this.pendingRequests.delete(id);
      });
      this.pendingRequests.clear();

      if (!this.explicitClose && this.options.reconnect) {
        if (this.retryCount < (this.options.maxRetries ?? Infinity)) {
          this.retryCount++;
          const delay = (this.options.retryDelay || defaultRetryDelay)(
            this.retryCount
          );
          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${this.retryCount})...`
          );
          this.reconnectTimeoutId = setTimeout(() => this.connect(), delay);
        } else {
          console.log("Max reconnection retries reached.");
        }
      }
    };

    this.socket.onerror = (event) => {
      console.error("WebSocket error:", event);
      if (this.options.onError) this.options.onError(event);
      // Note: 'onclose' will usually be called after 'onerror' when a connection fails.
    };
    this.socket.onmessage = async (event) => {
      try {
        const rawData = event.data;
        if (typeof rawData !== "string") {
          console.error("Received non-string WebSocket message:", rawData);
          return;
        }
        const message = JSON.parse(rawData) as WSMessage;

        // Handle notification specially
        if (message.type === "notification") {
          const notification = message as WSNotificationMessage;
          if (
            notification.direction === "server-to-client" &&
            this.options.onNotification
          ) {
            this.options.onNotification(notification);
          } else if (notification.direction !== "server-to-client") {
            console.warn(
              "Client received a notification not intended for it:",
              notification
            );
          }
          return;
        }

        // For all other messages, use the standard handler
        const response = await this.handleMessage(rawData);
        if (response) {
          this.sendRaw(response);
        }
      } catch (error) {
        console.error(
          "Failed to process WebSocket message:",
          error,
          "Raw data:",
          event.data
        );
      }
    };
  }

  /**
   * Disconnects from the WebSocket server
   */
  public disconnect(): void {
    this.explicitClose = true;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.socket) {
      this.socket.close();
      // this.socket = null; // onclose will handle cleanup
    }
  }

  /**
   * Sends a raw message to the server
   */
  private sendRaw(message: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected or not open.");
    }
    this.socket.send(message);
  }

  /**
   * Calls a procedure on the server
   */
  public async callServer<TInput, TOutput>(
    path: string[],
    input: TInput,
    timeout = 30000
  ): Promise<TOutput> {
    if (
      !this.isConnected ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      // Wait for connection if not connected and reconnect is enabled
      await this.reconnect();
    }

    return this.makeCall<TInput, TOutput>(
      (msg) => this.sendRaw(msg),
      path,
      input,
      "client-to-server",
      timeout
    );
  }

  async reconnect() {
    // Wait for connection if not connected and reconnect is enabled
    if (
      this.options.reconnect &&
      (!this.socket || this.socket.readyState !== WebSocket.OPEN)
    ) {
      console.log(
        "WebSocket not connected. Waiting for connection to call server..."
      );
      await new Promise<void>((resolve, reject) => {
        const checkConnection = () => {
          if (
            this.isConnected &&
            this.socket &&
            this.socket.readyState === WebSocket.OPEN
          ) {
            this.socket.removeEventListener("open", tempOnOpen);
            resolve();
          } else if (
            this.explicitClose ||
            this.retryCount >= (this.options.maxRetries ?? Infinity)
          ) {
            this.socket?.removeEventListener("open", tempOnOpen);
            reject(
              new Error("WebSocket permanently closed or max retries reached.")
            );
          }
        };
        const tempOnOpen = () => checkConnection();

        if (this.socket) {
          this.socket.addEventListener("open", tempOnOpen);
        } else {
          throw new Error("WebSocket not connected.");
        }
        checkConnection(); // Initial check
      });
    }
  }

  /**
   * Sends a notification to the server
   */
  public sendNotification(event: string, payload?: unknown): void {
    if (
      !this.isConnected ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      console.warn("WebSocket not connected. Notification not sent.");
      // Optionally queue or throw error
      return;
    }

    const notification = this.createNotification(
      event,
      payload,
      "client-to-server"
    );
    this.sendRaw(notification);
  }

  /**
   * Checks if the client is connected to the server
   */
  public getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Gets the underlying WebSocket instance
   */
  public getSocket(): WebSocket | null {
    return this.socket;
  }

  /**
   * Handles an incoming message and produces a response if needed
   */
  public async handleMessage(rawMessage: string): Promise<string | null> {
    try {
      const message = JSON.parse(rawMessage) as WSMessage;

      if (message.type === "request") {
        const requestMessage = message as WSRequestMessage;
        try {
          // Execute the procedure on this end's router
          const result = await deserializeAndExecute(
            this.router,
            requestMessage.serializedCall,
            {}
          );

          // Return successful response
          const response: WSResponseMessage = {
            id: message.id,
            type: "response",
            result,
          };
          return JSON.stringify(response);
        } catch (error) {
          // Return error response
          const errorResponse: WSErrorMessage = {
            id: message.id,
            type: "error",
            error: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
          };
          return JSON.stringify(errorResponse);
        }
      } else if (message.type === "response") {
        // Handle response to a previous request
        const responseMessage = message as WSResponseMessage;
        const request = this.pendingRequests.get(message.id);
        if (request) {
          clearTimeout(request.timeout);
          request.resolve(responseMessage.result);
          this.pendingRequests.delete(message.id);
        }
        return null; // No response needed for a response
      } else if (message.type === "error") {
        // Handle error response to a previous request
        const errorMessage = message as WSErrorMessage;
        const request = this.pendingRequests.get(message.id);
        if (request) {
          clearTimeout(request.timeout);
          request.reject(new Error(errorMessage.error.message));
          this.pendingRequests.delete(message.id);
        }
        return null; // No response needed for an error response
      } else if (message.type === "notification") {
        // Handle notification (could trigger events)
        const notificationMessage = message as WSNotificationMessage;
        if (
          notificationMessage.direction === "server-to-client" &&
          this.options.onNotification
        ) {
          this.options.onNotification(notificationMessage);
        }
        return null; // No response for notifications
      } else {
        throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      // Handle parsing errors or other unexpected issues
      const errorResponse: WSErrorMessage = {
        id: "error",
        type: "error",
        error: {
          message: "Failed to process message",
          code: "PARSE_ERROR",
        },
      };
      return JSON.stringify(errorResponse);
    }
  }

  /**
   * Creates a typed client for calling procedures on the server.
   * @param serverRouterDefinition A "dummy" router object that mirrors the server's router structure.
   *                               This is used for type inference and path generation.
   */
  public createTypedServerCaller<TServerRouter extends Router>(
    serverRouterDefinition: TServerRouter // Pass a definition of the server's router
  ): ReturnType<typeof createMRPCClient<TServerRouter>> {
    return createMRPCClient(serverRouterDefinition, (path, input) =>
      this.callServer(path, input)
    );
  }
}
