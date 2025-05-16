import {
  Router,
  serializeCall,
  deserializeAndExecute,
  inferClientType,
} from "../../worker/mrpc/mini-trpc";

// === Types for WebSocket Transport ===

/**
 * Types of messages that can be sent over the WebSocket
 */
export type MessageType = "request" | "response" | "error" | "notification";

/**
 * Base message structure for WebSocket communication
 */
export interface WSMessage {
  id: string;
  type: MessageType;
}

/**
 * Request message from client to server or server to client
 */
export interface WSRequestMessage extends WSMessage {
  type: "request";
  serializedCall: any;
  direction: "client-to-server" | "server-to-client";
}

/**
 * Response message from server to client or client to server
 */
export interface WSResponseMessage extends WSMessage {
  type: "response";
  result: unknown;
}

/**
 * Error message from server to client or client to server
 */
export interface WSErrorMessage extends WSMessage {
  type: "error";
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Notification message (no response expected)
 */
export interface WSNotificationMessage extends WSMessage {
  type: "notification";
  event: string;
  payload?: unknown;
  direction: "client-to-server" | "server-to-client";
}

// === Base WebSocket Handler (shared between client and server) ===

/**
 * Base WebSocket handler shared between client and server
 */
export class WSHandler {
  protected pendingRequests = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (reason: any) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();

  protected router: Router;
  constructor(router: Router) {
    this.router = router;
  }

  /**
   * Handles an incoming message and produces a response if needed
   */
  public async handleMessage<TRouter extends Router>(
    rawMessage: string,
    mrpc: () => inferClientType<TRouter> | undefined
  ): Promise<string | null> {
    try {
      const message = JSON.parse(rawMessage) as WSMessage;

      if (message.type === "request") {
        const requestMessage = message as WSRequestMessage;
        try {
          // Execute the procedure on this end's router
          const result = await deserializeAndExecute(
            this.router,
            requestMessage.serializedCall,
            mrpc
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
        // For now, we just log it
        const notificationMessage = message as WSNotificationMessage;
        console.log(
          `Received notification: ${notificationMessage.event}`,
          notificationMessage.payload
        );
        return null; // No response for notifications
      } else {
        throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      // Handle parsing errors or other unexpected issues
      const errorResponse: WSErrorMessage = {
        id: "error", // Consider if a unique ID is needed or if the original message ID can be used if available
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
   * Creates a serialized request message
   */
  protected createRequestMessage(
    path: string[],
    input: unknown,
    direction: "client-to-server" | "server-to-client"
  ): string {
    const id = this.generateId();
    const serializedCall = serializeCall(path, input);

    const requestMessage: WSRequestMessage = {
      id,
      type: "request",
      serializedCall,
      direction,
    };

    return JSON.stringify(requestMessage);
  }

  /**
   * Creates a notification message
   */
  public createNotification(
    event: string,
    payload?: unknown,
    direction: "client-to-server" | "server-to-client" = "server-to-client"
  ): string {
    const notification: WSNotificationMessage = {
      id: this.generateId(),
      type: "notification",
      event,
      payload,
      direction,
    };
    return JSON.stringify(notification);
  }

  /**
   * Generates a unique ID for messages
   */
  protected generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `msg-${Date.now()}-${Math.random()}`;
  }

  /**
   * Makes a remote procedure call and waits for the response
   */
  protected async makeCall<TInput, TOutput>(
    sendMessage: (message: string) => void,
    path: string[],
    input: TInput,
    direction: "client-to-server" | "server-to-client",
    timeout = 30000
  ): Promise<TOutput> {
    return new Promise<TOutput>((resolve, reject) => {
      const id = this.generateId();
      const serializedCall = serializeCall(path, input);

      const requestMessage: WSRequestMessage = {
        id,
        type: "request",
        serializedCall,
        direction,
      };

      // Set timeout for the request
      const timeoutId = setTimeout(() => {
        const request = this.pendingRequests.get(id);
        if (request) {
          request.reject(new Error(`Request timed out after ${timeout}ms`));
          this.pendingRequests.delete(id);
        }
      }, timeout);

      // Store the pending request
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout: timeoutId,
      });

      // Send the request
      sendMessage(JSON.stringify(requestMessage));
    });
  }
}

// // === Utility Functions ===

// /**
//  * Creates a typed caller for remote procedures
//  */
// export function createTypedCaller<TRouter extends Router>(
//   router: TRouter,
//   callFn: <TInput, TOutput>(path: string[], input: TInput) => Promise<TOutput>
// ): inferClientType<TRouter> {
//   // Helper function to recursively create a proxy
//   function createRecursiveProxy(path: string[] = []) {
//     return new Proxy(
//       {},
//       {
//         get(target, prop: string) {
//           // Skip internal properties
//           if (prop === "then" || prop === "catch" || prop === "finally") {
//             return undefined;
//           }

//           // Build the path as we chain properties
//           const newPath = [...path, prop];

//           // Check if this is a leaf node (procedure) or another router
//           let current: any = router;
//           for (const segment of newPath) {
//             if (!current || !current[segment]) {
//               // If the path doesn't exist in the router, assume it's a deeper path
//               // and continue building the proxy.
//               return createRecursiveProxy(newPath);
//             }
//             current = current[segment];
//           }

//           // Check if 'current' is a procedure definition (e.g., has a _def property)
//           if (current && typeof current === "object" && "_def" in current) {
//             // This is a procedure, create a function that calls it remotely
//             return (input: any) => {
//               const validatedInput = current._def.input.parse(input);
//               return callFn(newPath, validatedInput);
//             };
//           }

//           // Otherwise, it's part of a path to a nested router or procedure,
//           // so continue building the proxy.
//           return createRecursiveProxy(newPath);
//         },
//       }
//     );
//   }

//   return createRecursiveProxy();
// }
