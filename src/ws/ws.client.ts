import {
  createMRPCClient,
  inferClientType,
  Router,
} from "../../worker/mrpc/mini-trpc";
import { WSHandler, WSMessage, WSNotificationMessage } from "./ws.common";

/**
 * Options for WebSocket client
 */
export interface WSClientOptions<ClientRouter extends Router> {
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

  /**
   * Called when a MRPC client is created
   */
  mrpc?: () => inferClientType<ClientRouter>;
}

const defaultRetryDelay = (retryCount: number) =>
  1000 * Math.min(Math.pow(2, retryCount), 30); // Exponential backoff up to 30s

/**
 * Client implementation for bidirectional RPC over WebSockets
 */

export class WSClient<ClientRouter extends Router> extends WSHandler {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private retryCount = 0;
  private options: WSClientOptions<ClientRouter>;
  private explicitClose = false;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(clientRouter: Router, options: WSClientOptions<ClientRouter>) {
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
        const response = await this.handleMessage(rawData, () => {
          if (!this.options.mrpc) {
            return;
          }
          return this.options.mrpc();
        });
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
              if (this.options.onOpen)
                this.socket.removeEventListener("open", tempOnOpen);
              resolve();
            } else if (
              this.explicitClose ||
              this.retryCount >= (this.options.maxRetries ?? Infinity)
            ) {
              if (this.options.onOpen)
                this.socket?.removeEventListener("open", tempOnOpen);
              reject(
                new Error(
                  "WebSocket permanently closed or max retries reached."
                )
              );
            }
          };
          const tempOnOpen = () => checkConnection();

          if (this.socket) {
            this.socket.addEventListener("open", tempOnOpen);
          }
          checkConnection(); // Initial check
        });
      } else {
        throw new Error("WebSocket not connected.");
      }
    }

    return this.makeCall<TInput, TOutput>(
      (msg) => this.sendRaw(msg),
      path,
      input,
      "client-to-server",
      timeout
    );
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
