// import { Router, serializeCall, deserializeAndExecute } from "./mini-trpc";

// // === Types for WebSocket Transport ===

// /**
//  * Types of messages that can be sent over the WebSocket
//  */
// export type MessageType = "request" | "response" | "error" | "notification";

// /**
//  * Base message structure for WebSocket communication
//  */
// export interface WSMessage {
//   id: string;
//   type: MessageType;
// }

// /**
//  * Request message from client to server or server to client
//  */
// export interface WSRequestMessage extends WSMessage {
//   type: "request";
//   serializedCall: string;
//   direction: "client-to-server" | "server-to-client";
// }

// /**
//  * Response message from server to client or client to server
//  */
// export interface WSResponseMessage extends WSMessage {
//   type: "response";
//   result: unknown;
// }

// /**
//  * Error message from server to client or client to server
//  */
// export interface WSErrorMessage extends WSMessage {
//   type: "error";
//   error: {
//     message: string;
//     code?: string;
//     stack?: string;
//   };
// }

// /**
//  * Notification message (no response expected)
//  */
// export interface WSNotificationMessage extends WSMessage {
//   type: "notification";
//   event: string;
//   payload?: unknown;
//   direction: "client-to-server" | "server-to-client";
// }

// // === Base WebSocket Handler (shared between client and server) ===

// /**
//  * Base WebSocket handler shared between client and server
//  */
// export class WSHandler {
//   protected pendingRequests = new Map<
//     string,
//     {
//       resolve: (value: unknown) => void;
//       reject: (reason: any) => void;
//       timeout: ReturnType<typeof setTimeout>;
//     }
//   >();

//   protected router: Router;

//   constructor(router: Router) {
//     this.router = router;
//   }

//   /**
//    * Handles an incoming message and produces a response if needed
//    */
//   public async handleMessage(rawMessage: string): Promise<string | null> {
//     try {
//       const message = JSON.parse(rawMessage) as WSMessage;

//       if (message.type === "request") {
//         const requestMessage = message as WSRequestMessage;
//         try {
//           // Execute the procedure on this end's router
//           const result = await deserializeAndExecute(
//             this.router,
//             requestMessage.serializedCall
//           );

//           // Return successful response
//           const response: WSResponseMessage = {
//             id: message.id,
//             type: "response",
//             result,
//           };
//           return JSON.stringify(response);
//         } catch (error) {
//           // Return error response
//           const errorResponse: WSErrorMessage = {
//             id: message.id,
//             type: "error",
//             error: {
//               message: error instanceof Error ? error.message : String(error),
//               stack: error instanceof Error ? error.stack : undefined,
//             },
//           };
//           return JSON.stringify(errorResponse);
//         }
//       } else if (message.type === "response") {
//         // Handle response to a previous request
//         const responseMessage = message as WSResponseMessage;
//         const request = this.pendingRequests.get(message.id);
//         if (request) {
//           clearTimeout(request.timeout);
//           request.resolve(responseMessage.result);
//           this.pendingRequests.delete(message.id);
//         }
//         return null; // No response needed for a response
//       } else if (message.type === "error") {
//         // Handle error response to a previous request
//         const errorMessage = message as WSErrorMessage;
//         const request = this.pendingRequests.get(message.id);
//         if (request) {
//           clearTimeout(request.timeout);
//           request.reject(new Error(errorMessage.error.message));
//           this.pendingRequests.delete(message.id);
//         }
//         return null; // No response needed for an error response
//       } else if (message.type === "notification") {
//         // Handle notification (could trigger events)
//         // For now, we just log it
//         const notificationMessage = message as WSNotificationMessage;
//         console.log(
//           `Received notification: ${notificationMessage.event}`,
//           notificationMessage.payload
//         );
//         return null; // No response for notifications
//       } else {
//         throw new Error(`Unknown message type: ${message.type}`);
//       }
//     } catch (error) {
//       // Handle parsing errors or other unexpected issues
//       const errorResponse: WSErrorMessage = {
//         id: "error",
//         type: "error",
//         error: {
//           message: "Failed to process message",
//           code: "PARSE_ERROR",
//         },
//       };
//       return JSON.stringify(errorResponse);
//     }
//   }

//   /**
//    * Creates a serialized request message
//    */
//   protected createRequestMessage(
//     path: string[],
//     input: unknown,
//     direction: "client-to-server" | "server-to-client"
//   ): string {
//     const id = this.generateId();
//     const serializedCall = serializeCall(path, input);

//     const requestMessage: WSRequestMessage = {
//       id,
//       type: "request",
//       serializedCall,
//       direction,
//     };

//     return JSON.stringify(requestMessage);
//   }

//   /**
//    * Creates a notification message
//    */
//   public createNotification(
//     event: string,
//     payload?: unknown,
//     direction: "client-to-server" | "server-to-client" = "server-to-client"
//   ): string {
//     const notification: WSNotificationMessage = {
//       id: this.generateId(),
//       type: "notification",
//       event,
//       payload,
//       direction,
//     };
//     return JSON.stringify(notification);
//   }

//   /**
//    * Generates a unique ID for messages
//    */
//   protected generateId(): string {
//     return crypto.randomUUID
//       ? crypto.randomUUID()
//       : `msg-${Date.now()}-${Math.random()}`;
//   }

//   /**
//    * Makes a remote procedure call and waits for the response
//    */
//   protected async makeCall<TInput, TOutput>(
//     sendMessage: (message: string) => void,
//     path: string[],
//     input: TInput,
//     direction: "client-to-server" | "server-to-client",
//     timeout = 30000
//   ): Promise<TOutput> {
//     return new Promise<TOutput>((resolve, reject) => {
//       const id = this.generateId();
//       const serializedCall = serializeCall(path, input);

//       const requestMessage: WSRequestMessage = {
//         id,
//         type: "request",
//         serializedCall,
//         direction,
//       };

//       // Set timeout for the request
//       const timeoutId = setTimeout(() => {
//         const request = this.pendingRequests.get(id);
//         if (request) {
//           request.reject(new Error(`Request timed out after ${timeout}ms`));
//           this.pendingRequests.delete(id);
//         }
//       }, timeout);

//       // Store the pending request
//       this.pendingRequests.set(id, {
//         resolve: resolve as (value: unknown) => void,
//         reject,
//         timeout: timeoutId,
//       });

//       // Send the request
//       sendMessage(JSON.stringify(requestMessage));
//     });
//   }
// }

// // === Server Implementation ===

// export interface WSServerOptions {
//   /**
//    * Custom handler for client notifications
//    */
//   onNotification?: (
//     notification: WSNotificationMessage,
//     clientId: string
//   ) => void;

//   /**
//    * Called when a client connects
//    */
//   onClientConnect?: (clientId: string) => void;

//   /**
//    * Called when a client disconnects
//    */
//   onClientDisconnect?: (clientId: string) => void;
// }

// /**
//  * Server implementation for bidirectional RPC over WebSockets
//  */
// export class WSServer extends WSHandler {
//   private clients = new Map<
//     string,
//     {
//       send: (message: string) => void;
//       clientRouter?: Router;
//     }
//   >();

//   private options: WSServerOptions;

//   constructor(router: Router, options: WSServerOptions = {}) {
//     super(router);
//     this.options = options;
//   }

//   /**
//    * Registers a new client connection
//    */
//   public registerClient(
//     clientId: string,
//     sendFn: (message: string) => void,
//     clientRouter?: Router
//   ) {
//     this.clients.set(clientId, {
//       send: sendFn,
//       clientRouter,
//     });

//     if (this.options.onClientConnect) {
//       this.options.onClientConnect(clientId);
//     }
//   }

//   /**
//    * Removes a client connection
//    */
//   public removeClient(clientId: string) {
//     this.clients.delete(clientId);

//     if (this.options.onClientDisconnect) {
//       this.options.onClientDisconnect(clientId);
//     }
//   }

//   /**
//    * Handles a message from a specific client
//    */
//   public async handleClientMessage(
//     clientId: string,
//     rawMessage: string
//   ): Promise<void> {
//     const client = this.clients.get(clientId);
//     if (!client) {
//       console.error(`Received message from unknown client: ${clientId}`);
//       return;
//     }

//     try {
//       const message = JSON.parse(rawMessage) as WSMessage;

//       // Handle special case for notifications from client
//       if (message.type === "notification") {
//         const notification = message as WSNotificationMessage;
//         if (this.options.onNotification) {
//           this.options.onNotification(notification, clientId);
//         }
//         return;
//       }

//       // For all other messages, use the standard handler
//       const response = await this.handleMessage(rawMessage);
//       if (response) {
//         client.send(response);
//       }
//     } catch (error) {
//       console.error("Error handling client message:", error);
//     }
//   }

//   /**
//    * Calls a procedure on a specific client
//    */
//   public async callClient<TInput, TOutput>(
//     clientId: string,
//     path: string[],
//     input: TInput,
//     timeout = 30000
//   ): Promise<TOutput> {
//     const client = this.clients.get(clientId);
//     if (!client) {
//       throw new Error(`Client not found: ${clientId}`);
//     }

//     return this.makeCall<TInput, TOutput>(
//       (message) => client.send(message),
//       path,
//       input,
//       "server-to-client",
//       timeout
//     );
//   }

//   /**
//    * Sends a notification to a specific client
//    */
//   public sendNotification(
//     clientId: string,
//     event: string,
//     payload?: unknown
//   ): void {
//     const client = this.clients.get(clientId);
//     if (!client) {
//       throw new Error(`Client not found: ${clientId}`);
//     }

//     const notification = this.createNotification(
//       event,
//       payload,
//       "server-to-client"
//     );
//     client.send(notification);
//   }

//   /**
//    * Broadcasts a notification to all connected clients
//    */
//   public broadcastNotification(event: string, payload?: unknown): void {
//     const notification = this.createNotification(
//       event,
//       payload,
//       "server-to-client"
//     );
//     for (const client of this.clients.values()) {
//       client.send(notification);
//     }
//   }

//   /**
//    * Creates a typed client for calling procedures on a specific client
//    */
//   public createTypedClientCaller<TClientRouter extends Router>(
//     clientId: string,
//     clientRouter: TClientRouter
//   ) {
//     return createTypedCaller(clientRouter, (path, input) =>
//       this.callClient(clientId, path, input)
//     );
//   }
// }

// // === Client Implementation ===

// /**
//  * Options for WebSocket client
//  */
// export interface WSClientOptions {
//   url: string;
//   reconnect?: boolean;
//   maxRetries?: number;
//   retryDelay?: number;

//   /**
//    * Called when the connection is established
//    */
//   onOpen?: () => void;

//   /**
//    * Called when the connection is closed
//    */
//   onClose?: () => void;

//   /**
//    * Called when an error occurs
//    */
//   onError?: (error: Event) => void;

//   /**
//    * Called when a notification is received from the server
//    */
//   onNotification?: (notification: WSNotificationMessage) => void;
// }

// /**
//  * Client implementation for bidirectional RPC over WebSockets
//  */
// export class WSClient extends WSHandler {
//   private socket: WebSocket | null = null;
//   private isConnected = false;
//   private retryCount = 0;
//   private options: WSClientOptions;

//   constructor(clientRouter: Router, options: WSClientOptions) {
//     super(clientRouter);
//     this.options = options;
//   }

//   /**
//    * Connects to the WebSocket server
//    */
//   public connect(): void {
//     if (
//       this.socket &&
//       (this.socket.readyState === WebSocket.OPEN ||
//         this.socket.readyState === WebSocket.CONNECTING)
//     ) {
//       return;
//     }

//     this.socket = new WebSocket(this.options.url);

//     this.socket.onopen = () => {
//       this.isConnected = true;
//       this.retryCount = 0;
//       if (this.options.onOpen) this.options.onOpen();
//     };

//     this.socket.onclose = () => {
//       this.isConnected = false;
//       if (this.options.onClose) this.options.onClose();

//       // Attempt to reconnect if enabled
//       if (
//         this.options.reconnect &&
//         (this.options.maxRetries === undefined ||
//           this.retryCount < this.options.maxRetries)
//       ) {
//         this.retryCount++;
//         const delay =
//           this.options.retryDelay || 1000 * Math.min(this.retryCount, 10);
//         setTimeout(() => this.connect(), delay);
//       }

//       // Reject all pending requests
//       this.pendingRequests.forEach((request, id) => {
//         clearTimeout(request.timeout);
//         request.reject(new Error("WebSocket connection closed"));
//         this.pendingRequests.delete(id);
//       });
//     };

//     this.socket.onerror = (error) => {
//       if (this.options.onError) this.options.onError(error);
//     };

//     this.socket.onmessage = async (event) => {
//       try {
//         const message = JSON.parse(event.data) as WSMessage;

//         // Handle notification specially
//         if (message.type === "notification" && this.options.onNotification) {
//           this.options.onNotification(message as WSNotificationMessage);
//           return;
//         }

//         // For all other messages, use the standard handler
//         const response = await this.handleMessage(event.data);
//         if (response) {
//           this.sendRaw(response);
//         }
//       } catch (error) {
//         console.error("Failed to process WebSocket message:", error);
//       }
//     };
//   }

//   /**
//    * Disconnects from the WebSocket server
//    */
//   public disconnect(): void {
//     if (this.socket) {
//       this.socket.close();
//       this.socket = null;
//     }
//   }

//   /**
//    * Sends a raw message to the server
//    */
//   private sendRaw(message: string): void {
//     if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
//       throw new Error("WebSocket not connected");
//     }

//     this.socket.send(message);
//   }

//   /**
//    * Calls a procedure on the server
//    */
//   public async callServer<TInput, TOutput>(
//     path: string[],
//     input: TInput,
//     timeout = 30000
//   ): Promise<TOutput> {
//     if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
//       throw new Error("WebSocket not connected");
//     }

//     return this.makeCall<TInput, TOutput>(
//       (message) => this.sendRaw(message),
//       path,
//       input,
//       "client-to-server",
//       timeout
//     );
//   }

//   /**
//    * Sends a notification to the server
//    */
//   public sendNotification(event: string, payload?: unknown): void {
//     if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
//       throw new Error("WebSocket not connected");
//     }

//     const notification = this.createNotification(
//       event,
//       payload,
//       "client-to-server"
//     );
//     this.sendRaw(notification);
//   }

//   /**
//    * Checks if the client is connected to the server
//    */
//   public getConnectionStatus(): boolean {
//     return this.isConnected;
//   }

//   /**
//    * Gets the underlying WebSocket instance
//    */
//   public getSocket(): WebSocket | null {
//     return this.socket;
//   }

//   /**
//    * Creates a typed client for calling procedures on the server
//    */
//   public createTypedServerCaller<TServerRouter extends Router>(
//     serverRouter: TServerRouter
//   ) {
//     return createTypedCaller(serverRouter, (path, input) =>
//       this.callServer(path, input)
//     );
//   }
// }

// // === Utility Functions ===

// /**
//  * Creates a typed caller for remote procedures
//  */
// function createTypedCaller<TRouter extends Router>(
//   router: TRouter,
//   callFn: <TInput, TOutput>(path: string[], input: TInput) => Promise<TOutput>
// ) {
//   // Helper function to recursively create a proxy
//   function createRecursiveProxy(path: string[] = []): any {
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
//               return createRecursiveProxy(newPath);
//             }
//             current = current[segment];
//           }

//           if (current && typeof current === "object" && "_def" in current) {
//             // This is a procedure, create a function that calls it remotely
//             return (input: any) => {
//               return callFn(newPath, input);
//             };
//           }

//           // Continue building the path
//           return createRecursiveProxy(newPath);
//         },
//       }
//     );
//   }

//   return createRecursiveProxy();
// }

// // === Example Usage ===

// /**
//  * Example of bidirectional RPC with a Node.js server and browser client
//  */
// function exampleBidirectionalUsage() {
//   // Define server and client routers
//   /*

//   // === SERVER SIDE ===

//   // Server-side procedures that clients can call
//   const serverRouter = {
//     users: {
//       getUser: os.input(z.object({ id: z.number() }))
//         .handler(async ({ input }) => {
//           return { id: input.id, name: 'User ' + input.id };
//         }),

//       listUsers: os.input(z.object({ limit: z.number().optional() }))
//         .handler(async ({ input }) => {
//           return Array.from({ length: input.limit || 10 }, (_, i) => ({
//             id: i + 1,
//             name: `User ${i + 1}`
//           }));
//         })
//     }
//   };

//   // Create WebSocket server
//   import { WebSocketServer } from 'ws';
//   import http from 'http';

//   const server = http.createServer();
//   const wss = new WebSocketServer({ server });
//   const mrpcServer = new WSServer(serverRouter, {
//     onClientConnect: (clientId) => console.log(`Client connected: ${clientId}`),
//     onClientDisconnect: (clientId) => console.log(`Client disconnected: ${clientId}`),
//     onNotification: (notification, clientId) => {
//       console.log(`Notification from client ${clientId}:`, notification);
//     }
//   });

//   // Handle connections
//   wss.on('connection', (ws, req) => {
//     const clientId = req.headers['sec-websocket-key'] || `client-${Date.now()}`;

//     // Register the client
//     mrpcServer.registerClient(clientId, (message) => ws.send(message));

//     ws.on('message', async (message) => {
//       await mrpcServer.handleClientMessage(clientId, message.toString());
//     });

//     ws.on('close', () => {
//       mrpcServer.removeClient(clientId);
//     });

//     // Example of calling a procedure on the client
//     setTimeout(async () => {
//       try {
//         // Create a typed client for this specific client
//         const clientCaller = mrpcServer.createTypedClientCaller(clientId, clientRouter);

//         // Call a procedure on the client
//         const result = await clientCaller.notifications.showMessage({
//           title: 'Hello from server',
//           message: 'This is a server-initiated call!'
//         });

//         console.log('Client responded:', result);

//         // Send a notification to the client
//         mrpcServer.sendNotification(clientId, 'serverEvent', {
//           message: 'Something happened on the server!'
//         });
//       } catch (error) {
//         console.error('Error calling client procedure:', error);
//       }
//     }, 1000);
//   });

//   server.listen(3000, () => {
//     console.log('WebSocket server listening on port 3000');
//   });

//   // === CLIENT SIDE ===

//   // Client-side procedures that the server can call
//   const clientRouter = {
//     notifications: {
//       showMessage: os.input(
//         z.object({
//           title: z.string(),
//           message: z.string()
//         })
//       ).handler(async ({ input }) => {
//         // Show a message to the user
//         alert(`${input.title}\n${input.message}`);
//         return { success: true, shown: new Date().toISOString() };
//       })
//     }
//   };

//   // Create WebSocket client
//   const wsClient = new WSClient(clientRouter, {
//     url: 'ws://localhost:3000',
//     reconnect: true,
//     onOpen: () => console.log('Connected to server'),
//     onClose: () => console.log('Disconnected from server'),
//     onError: (error) => console.error('WebSocket error:', error),
//     onNotification: (notification) => {
//       console.log(`Server notification: ${notification.event}`, notification.payload);
//     }
//   });

//   // Connect to the server
//   wsClient.connect();

//   // Create a typed client for calling server procedures
//   const serverApi = wsClient.createTypedServerCaller(serverRouter);

//   // Call server procedures
//   async function callServerProcedures() {
//     try {
//       // Call a procedure on the server
//       const users = await serverApi.users.listUsers({ limit: 5 });
//       console.log('Users from server:', users);

//       // Send a notification to the server
//       wsClient.sendNotification('clientEvent', {
//         message: 'Something happened on the client!'
//       });
//     } catch (error) {
//       console.error('Error calling server procedure:', error);
//     }
//   }

//   // Call when connected
//   if (wsClient.getConnectionStatus()) {
//     callServerProcedures();
//   } else {
//     wsClient.getSocket()?.addEventListener('open', callServerProcedures);
//   }

//   */
// }
