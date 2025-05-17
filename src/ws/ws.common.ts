import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
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
