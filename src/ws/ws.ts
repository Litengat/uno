import { WSClient } from "./ws.client";
import { serverRouter } from "../../worker/route";
// Client-side procedures that the server can call
import { clientRouter } from "./routes";

export function WS(url: string) {
  // Create WebSocket client
  const wsClient = new WSClient(clientRouter, {
    url: url,
    reconnect: true,
    onOpen: () => console.log("Connected to server"),
    onClose: () => console.log("Disconnected from server"),
    onError: (error) => console.error("WebSocket error:", error),
    onNotification: (notification) => {
      console.log(
        `Server notification: ${notification.event}`,
        notification.payload
      );
    },
  });

  // Connect to the server
  wsClient.connect();

  // Create a typed client for calling server procedures
  const serverApi = wsClient.createTypedServerCaller(serverRouter);
  return serverApi;
  // // Call server procedures
  // async function callServerProcedures() {
  //   try {
  //     // Call a procedure on the server
  //     const users = await serverApi.users.listUsers({ limit: 5 });
  //     console.log("Users from server:", users);
  //     console.log(serverApi.users.listUsers({ limit: 1 })); // Send a notification to the server
  //   } catch (error) {
  //     console.error("Error calling server procedure:", error);
  //   }
  // }

  // // Call when connected
  // if (wsClient.getConnectionStatus()) {
  //   callServerProcedures();
  // } else {
  //   wsClient.getSocket()?.addEventListener("open", callServerProcedures);
  // }
}
