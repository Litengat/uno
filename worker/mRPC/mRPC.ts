// mini-trpc.ts - A bi-directional tRPC implementation with Zod validation

import { z } from "zod";

// ------ CORE TYPES ------

export type Context = Record<string, any>;

export type HandlerFunction<
  TInput,
  TOutput,
  TContext extends Context = Context
> = (props: { input: TInput; ctx: TContext }) => Promise<TOutput> | TOutput;

export type StreamHandlerFunction<
  TInput,
  TOutput,
  TContext extends Context = Context
> = (props: {
  input: TInput;
  ctx: TContext;
  lastEventId?: string;
}) => AsyncGenerator<TOutput> | Promise<AsyncGenerator<TOutput>>;

export type HandlerWithMeta<TOutput> = {
  data: TOutput;
  meta: {
    id?: string;
    retry?: number;
  };
};

// ------ MESSAGE TYPES ------

export enum MessageType {
  REQUEST = "request",
  RESPONSE = "response",
  NOTIFICATION = "notification",
  STREAM_DATA = "stream_data",
  STREAM_END = "stream_end",
  ERROR = "error",
  PING = "ping",
  PONG = "pong",
}

export type Message = {
  id?: string;
  type: MessageType;
  path?: string;
  input?: any;
  result?: any;
  error?: {
    message: string;
    code?: string;
    data?: any;
  };
  meta?: Record<string, any>;
};

// ------ PROCEDURE BUILDER ------

export class ProcedureBuilder<TContext extends Context = Context> {
  private _inputSchema?: z.ZodType<any>;
  private _outputSchema?: z.ZodType<any>;

  constructor() {}

  public input<TInput>(schema: z.ZodType<TInput>) {
    this._inputSchema = schema;
    return this as ProcedureBuilder<TContext> & { _input: TInput };
  }

  public output<TOutput>(schema: z.ZodType<TOutput>) {
    this._outputSchema = schema;
    return this as ProcedureBuilder<TContext> & { _output: TOutput };
  }

  public handler<TInput, TOutput>(
    handlerFn: HandlerFunction<TInput, TOutput, TContext>
  ) {
    const inputSchema = this._inputSchema as z.ZodType<TInput> | undefined;
    const outputSchema = this._outputSchema as z.ZodType<TOutput> | undefined;

    const procedure = async (input: any, context: TContext) => {
      // Validate input if schema exists
      const validatedInput = inputSchema ? inputSchema.parse(input) : input;

      // Execute handler
      const result = await handlerFn({ input: validatedInput, ctx: context });

      // Validate output if schema exists
      const validatedOutput = outputSchema
        ? outputSchema.parse(result)
        : result;

      return validatedOutput;
    };

    // Attach schemas for introspection
    Object.assign(procedure, {
      _def: {
        inputSchema,
        outputSchema,
      },
    });

    return procedure;
  }

  public streamHandler<TInput, TOutput>(
    handlerFn: StreamHandlerFunction<TInput, TOutput, TContext>
  ) {
    const inputSchema = this._inputSchema as z.ZodType<TInput> | undefined;
    const outputSchema = this._outputSchema as z.ZodType<TOutput> | undefined;

    const procedure = async function* (
      input: any,
      context: TContext,
      lastEventId?: string
    ) {
      // Validate input if schema exists
      const validatedInput = inputSchema ? inputSchema.parse(input) : input;

      // Execute stream handler
      const generator = await handlerFn({
        input: validatedInput,
        ctx: context,
        lastEventId,
      });

      // Yield validated outputs
      for await (const item of generator) {
        const validatedOutput = outputSchema ? outputSchema.parse(item) : item;
        yield validatedOutput;
      }
    };

    // Attach schemas for introspection
    Object.assign(procedure, {
      _def: {
        inputSchema,
        outputSchema,
        isStream: true,
      },
    });

    return procedure;
  }
}

// ------ SERVER & CLIENT CORE ------

export const os = new ProcedureBuilder();

export function withEventMeta<T>(
  data: T,
  meta: { id: string; retry?: number }
): HandlerWithMeta<T> {
  return {
    data,
    meta,
  };
}

export type Router = Record<string, any>;

export interface PeerOptions {
  // Common options for both client and server
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  debug?: boolean;

  // Specific options for WebSockets
  heartbeatInterval?: number; // in ms
}

// Base class for both client and server peer
export abstract class Peer {
  protected router: Router = {};
  protected pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason: any) => void;
      controller?: AbortController;
    }
  >();
  protected streamSubscribers = new Map<string, ((data: any) => void)[]>();
  protected options: PeerOptions;
  protected lastMessageId = 0;

  constructor(options: PeerOptions = {}) {
    this.options = {
      heartbeatInterval: 30000, // 30 seconds default
      debug: false,
      ...options,
    };
  }

  protected log(...args: any[]) {
    if (this.options.debug) {
      console.log(`[tRPC Peer]`, ...args);
    }
  }

  protected generateMessageId(): string {
    return `msg_${Date.now()}_${++this.lastMessageId}`;
  }

  protected async handleIncomingMessage(message: Message): Promise<void> {
    try {
      switch (message.type) {
        case MessageType.REQUEST:
          await this.handleRequest(message);
          break;

        case MessageType.RESPONSE:
          this.handleResponse(message);
          break;

        case MessageType.STREAM_DATA:
          this.handleStreamData(message);
          break;

        case MessageType.STREAM_END:
          this.handleStreamEnd(message);
          break;

        case MessageType.ERROR:
          this.handleError(message);
          break;

        case MessageType.PING:
          this.sendMessage({
            id: message.id,
            type: MessageType.PONG,
          });
          break;

        case MessageType.PONG:
          // Handle pong (reset timeout, etc.)
          break;

        default:
          this.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.log("Error handling message:", error);

      // If the message had an ID, send back an error
      if (message.id) {
        this.sendMessage({
          id: message.id,
          type: MessageType.ERROR,
          error: {
            message: error instanceof Error ? error.message : "Unknown error",
            data: error,
          },
        });
      }
    }
  }

  protected async handleRequest(message: Message): Promise<void> {
    if (!message.path || message.id === undefined) {
      throw new Error("Invalid request message");
    }

    try {
      const result = await this.callLocalProcedure(
        message.path,
        message.input || {}
      );

      // Check if the result is a generator (streaming response)
      if (
        result &&
        typeof result === "object" &&
        Symbol.asyncIterator in result
      ) {
        // Setup streaming
        const streamId = message.id;
        const generator = result as AsyncGenerator<any>;

        try {
          for await (const item of generator) {
            this.sendMessage({
              id: streamId,
              type: MessageType.STREAM_DATA,
              result: item,
            });
          }

          // Stream completed normally
          this.sendMessage({
            id: streamId,
            type: MessageType.STREAM_END,
          });
        } catch (streamError) {
          // Stream error
          this.sendMessage({
            id: streamId,
            type: MessageType.ERROR,
            error: {
              message:
                streamError instanceof Error
                  ? streamError.message
                  : "Stream error",
              data: streamError,
            },
          });
        }
      } else {
        // Normal response
        this.sendMessage({
          id: message.id,
          type: MessageType.RESPONSE,
          result,
        });
      }
    } catch (error) {
      this.sendMessage({
        id: message.id,
        type: MessageType.ERROR,
        error: {
          message: error instanceof Error ? error.message : "Procedure error",
          data: error,
        },
      });
    }
  }

  protected handleResponse(message: Message): void {
    if (!message.id) return;

    const request = this.pendingRequests.get(message.id);
    if (request) {
      this.pendingRequests.delete(message.id);
      request.resolve(message.result);
    }
  }

  protected handleStreamData(message: Message): void {
    if (!message.id) return;

    const subscribers = this.streamSubscribers.get(message.id) || [];
    subscribers.forEach((callback) => {
      try {
        callback(message.result);
      } catch (error) {
        this.log("Error in stream subscriber:", error);
      }
    });
  }

  protected handleStreamEnd(message: Message): void {
    if (!message.id) return;

    // Clean up subscribers
    this.streamSubscribers.delete(message.id);

    // Resolve pending request if it exists
    const request = this.pendingRequests.get(message.id);
    if (request) {
      this.pendingRequests.delete(message.id);
      request.resolve(undefined); // Resolve with undefined to signal completion
    }
  }

  protected handleError(message: Message): void {
    if (!message.id) return;

    const request = this.pendingRequests.get(message.id);
    if (request) {
      this.pendingRequests.delete(message.id);
      const error = new Error(
        message.error?.message || "Remote procedure call failed"
      );
      if (message.error?.data) {
        Object.assign(error, { details: message.error.data });
      }
      request.reject(error);
    }

    // Clean up any stream subscribers
    this.streamSubscribers.delete(message.id || "");
  }

  protected async callLocalProcedure(path: string, input: any): Promise<any> {
    const pathParts = path.split(".");

    // Find the procedure based on the path
    let current = this.router;
    for (const part of pathParts) {
      if (!current[part]) {
        throw new Error(`Path segment "${part}" not found in path "${path}"`);
      }
      current = current[part];
    }

    // Check if we found a procedure
    if (typeof current !== "function") {
      throw new Error(`No procedure found at path "${path}"`);
    }

    // Call the procedure
    const procedure = current;
    const context = {}; // Context could be extended based on connection info, etc.

    // Check if it's a streaming procedure
    if (procedure._def?.isStream) {
      return procedure(input, context);
    }

    return await procedure(input, context);
  }

  protected abstract sendMessage(message: Message): void;

  public setRouter(router: Router): void {
    this.router = router;
  }

  // Method to call a remote procedure
  public async call<TResult = any>(
    path: string,
    input?: any
  ): Promise<TResult> {
    const messageId = this.generateMessageId();

    const responsePromise = new Promise<TResult>((resolve, reject) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        reject(new Error(`RPC timeout: ${path}`));
        this.pendingRequests.delete(messageId);
      }, 60000); // 60 second timeout

      this.pendingRequests.set(messageId, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value as TResult);
        },
        reject: (reason) => {
          clearTimeout(timeout);
          reject(reason);
        },
        controller,
      });
    });

    this.sendMessage({
      id: messageId,
      type: MessageType.REQUEST,
      path,
      input,
    });

    return responsePromise;
  }

  // Method to subscribe to a streaming procedure
  public subscribe<TResult = any>(
    path: string,
    input: any,
    onData: (data: TResult) => void
  ): () => void {
    const messageId = this.generateMessageId();

    // Set up the subscribers array for this stream
    if (!this.streamSubscribers.has(messageId)) {
      this.streamSubscribers.set(messageId, []);
    }

    const subscribers = this.streamSubscribers.get(messageId)!;
    subscribers.push(onData as (data: any) => void);

    // Send the request
    this.sendMessage({
      id: messageId,
      type: MessageType.REQUEST,
      path,
      input,
    });

    // Return unsubscribe function
    return () => {
      const index = subscribers.indexOf(onData as (data: any) => void);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }

      // If no more subscribers, clean up
      if (subscribers.length === 0) {
        this.streamSubscribers.delete(messageId);
        // Could also send a cancel message to the server
      }
    };
  }

  public createProxy(): any {
    const handler = {
      get: (target: any, prop: string) => {
        if (typeof target[prop] === "object" && target[prop] !== null) {
          // Continue proxy chain for nested objects
          return new Proxy(target[prop], handler);
        }

        if (target[prop] === undefined) {
          // Build path for undefined properties
          const path = this.buildPath(target, prop);

          // Create a function to call the procedure
          const procedure = (input: any) => {
            // Check if procedure is marked as streaming in target's metadata
            const isStreaming = target._metadata?.[prop]?.isStream;

            if (isStreaming) {
              return {
                subscribe: (onData: (data: any) => void) => {
                  return this.subscribe(path, input, onData);
                },
              };
            }

            return this.call(path, input);
          };

          return procedure;
        }

        return target[prop];
      },
    };

    const proxy = new Proxy({ _path: [] }, handler);
    return proxy;
  }

  private buildPath(target: any, prop: string): string {
    const path = [...(target._path || [])];

    // Add all properties except special ones
    if (prop !== "_path" && prop !== "_metadata") {
      path.push(prop);
    }

    return path.join(".");
  }
}

// ------ WEBSOCKET SERVER IMPLEMENTATION ------

export interface WebSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(event: string, handler: (event: any) => void): void;
  removeEventListener(event: string, handler: (event: any) => void): void;
}

export interface WebSocketServerOptions extends PeerOptions {
  // Server-specific options
  pingInterval?: number;
  // You can add more server-specific options here
}

export class WebSocketServerPeer extends Peer {
  private ws: WebSocketLike;
  private pingInterval?: NodeJS.Timeout;

  constructor(ws: WebSocketLike, options: WebSocketServerOptions = {}) {
    super(options);
    this.ws = ws;

    // Set up WebSocket event listeners
    this.setupWebSocketListeners();

    // Start heartbeat
    if (options.heartbeatInterval) {
      this.startHeartbeat();
    }
  }

  private setupWebSocketListeners(): void {
    const messageHandler = (event: { data: string }) => {
      try {
        const message = JSON.parse(event.data) as Message;
        this.handleIncomingMessage(message);
      } catch (error) {
        this.log("Error parsing message:", error);
      }
    };

    const closeHandler = () => {
      this.cleanup();
      if (this.options.onClose) {
        this.options.onClose();
      }
    };

    const errorHandler = (error: any) => {
      this.log("WebSocket error:", error);
      if (this.options.onError) {
        this.options.onError(
          error instanceof Error ? error : new Error("WebSocket error")
        );
      }
    };

    this.ws.addEventListener("message", messageHandler);
    this.ws.addEventListener("close", closeHandler);
    this.ws.addEventListener("error", errorHandler);
  }

  private startHeartbeat(): void {
    const interval = this.options.heartbeatInterval || 30000;

    this.pingInterval = setInterval(() => {
      try {
        this.sendMessage({
          type: MessageType.PING,
          id: this.generateMessageId(),
        });
      } catch (error) {
        this.log("Error sending ping:", error);
      }
    }, interval);
  }

  private cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }

    // Cancel all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error("Connection closed"));
    });
    this.pendingRequests.clear();

    // Clear all stream subscribers
    this.streamSubscribers.clear();
  }

  protected sendMessage(message: Message): void {
    if (this.ws && this.ws.send) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public close(code?: number, reason?: string): void {
    try {
      this.cleanup();
      this.ws.close(code, reason);
    } catch (error) {
      this.log("Error closing WebSocket:", error);
    }
  }
}

// Helper function to create a server WebSocket peer
export function createWebSocketServerPeer(
  ws: WebSocketLike,
  router: Router,
  options?: WebSocketServerOptions
): WebSocketServerPeer {
  const peer = new WebSocketServerPeer(ws, options);
  peer.setRouter(router);
  return peer;
}

// ------ WEBSOCKET CLIENT IMPLEMENTATION ------

export interface WebSocketClientOptions extends PeerOptions {
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  autoConnect?: boolean;
}

export class WebSocketClientPeer extends Peer {
  private url: string;
  private wsInstance?: WebSocketLike;
  private reconnectAttempts = 0;
  private reconnectTimeout?: NodeJS.Timeout;
  private isConnecting = false;
  private clientOptions: WebSocketClientOptions;

  constructor(url: string, options: WebSocketClientOptions = {}) {
    super(options);
    this.url = url;
    this.clientOptions = {
      reconnect: true,
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      autoConnect: true,
      ...options,
    };

    if (this.clientOptions.autoConnect) {
      this.connect();
    }
  }

  public async connect(): Promise<void> {
    if (this.wsInstance || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.wsInstance = await this.createWebSocket();
      this.setupWebSocketListeners();
      this.isConnecting = false;
      this.reconnectAttempts = 0;

      if (this.options.onOpen) {
        this.options.onOpen();
      }
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error);
    }
  }

  private createWebSocket(): Promise<WebSocketLike> {
    return new Promise((resolve, reject) => {
      try {
        // Use browser WebSocket or a custom implementation passed in options
        const WebSocketClass =
          typeof WebSocket !== "undefined" ? WebSocket : null;

        if (!WebSocketClass) {
          reject(new Error("WebSocket is not available"));
          return;
        }

        const ws = new WebSocketClass(this.url);

        const onOpen = () => {
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          resolve(ws as unknown as WebSocketLike);
        };

        const onError = (event: any) => {
          ws.removeEventListener("open", onOpen);
          ws.removeEventListener("error", onError);
          reject(new Error("Failed to connect to WebSocket server"));
        };

        ws.addEventListener("open", onOpen);
        ws.addEventListener("error", onError);
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupWebSocketListeners(): void {
    if (!this.wsInstance) return;

    const messageHandler = (event: { data: string }) => {
      try {
        const message = JSON.parse(event.data) as Message;
        this.handleIncomingMessage(message);
      } catch (error) {
        this.log("Error parsing message:", error);
      }
    };

    const closeHandler = () => {
      this.log("WebSocket closed");
      this.cleanup();

      if (this.clientOptions.reconnect) {
        this.attemptReconnect();
      } else if (this.options.onClose) {
        this.options.onClose();
      }
    };

    const errorHandler = (error: any) => {
      this.log("WebSocket error:", error);
      if (this.options.onError) {
        this.options.onError(
          error instanceof Error ? error : new Error("WebSocket error")
        );
      }
    };

    this.wsInstance.addEventListener("message", messageHandler);
    this.wsInstance.addEventListener("close", closeHandler);
    this.wsInstance.addEventListener("error", errorHandler);
  }

  private handleConnectionError(error: any): void {
    this.log("Connection error:", error);

    if (this.clientOptions.reconnect) {
      this.attemptReconnect();
    } else if (this.options.onError) {
      this.options.onError(
        error instanceof Error ? error : new Error("Connection error")
      );
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const maxAttempts = this.clientOptions.maxReconnectAttempts || 5;

    if (this.reconnectAttempts >= maxAttempts) {
      this.log(`Max reconnect attempts (${maxAttempts}) reached`);
      if (this.options.onError) {
        this.options.onError(
          new Error("Failed to reconnect after maximum attempts")
        );
      }
      return;
    }

    this.reconnectAttempts++;
    const delay = this.clientOptions.reconnectDelay || 1000;
    const jitteredDelay =
      delay *
      Math.pow(1.5, this.reconnectAttempts - 1) *
      (0.9 + Math.random() * 0.2);

    this.log(
      `Attempting to reconnect in ${Math.round(jitteredDelay)}ms (attempt ${
        this.reconnectAttempts
      }/${maxAttempts})`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, jitteredDelay);
  }

  private cleanup(): void {
    // Clean up any state
    this.wsInstance = undefined;

    // Cancel all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error("Connection closed"));
    });
    this.pendingRequests.clear();

    // Clear all stream subscribers
    this.streamSubscribers.clear();
  }

  protected sendMessage(message: Message): void {
    if (!this.wsInstance) {
      throw new Error("WebSocket is not connected");
    }

    this.wsInstance.send(JSON.stringify(message));
  }

  public close(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.wsInstance) {
      try {
        this.cleanup();
        this.wsInstance.close(1000, "Client closed connection");
        this.wsInstance = undefined;
      } catch (error) {
        this.log("Error closing WebSocket:", error);
      }
    }
  }

  public isConnected(): boolean {
    return !!this.wsInstance;
  }
}

// Helper function to create a client WebSocket peer
export function createWebSocketClientPeer(
  url: string,
  router: Router,
  options?: WebSocketClientOptions
): WebSocketClientPeer {
  const peer = new WebSocketClientPeer(url, options);
  peer.setRouter(router);
  return peer;
}

// Helper function for creating a router structure for the client
export function createClientRouter(router: Router) {
  const clientRouter: any = {};

  // Recursively process the router to create a structure with metadata
  function processRouter(current: any, target: any, path: string[] = []) {
    for (const key of Object.keys(current)) {
      const value = current[key];
      const newPath = [...path, key];

      if (typeof value === "function") {
        // Found a procedure, add metadata
        if (!target._metadata) target._metadata = {};
        target._metadata[key] = {
          isStream: value._def?.isStream || false,
        };
      } else if (typeof value === "object" && value !== null) {
        // Found a nested router
        if (!target[key]) target[key] = { _path: newPath };
        processRouter(value, target[key], newPath);
      }
    }
  }

  processRouter(router, clientRouter);
  return clientRouter;
}
