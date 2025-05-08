import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../worker/trpc/router";

// Function to create client with player ID
export function createTrpcClient(playerId: string) {
  const client = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${window.location.origin}/trpc`,
        headers: () => {
          return {
            // Include playerId as a header or query param
            // Using query param here since it's easier to access in Cloudflare Workers
            // Adding it to URL
          };
        },
        fetch: (url, options) => {
          // Append playerId as query param
          const urlWithPlayerId = `${url}${
            url.includes("?") ? "&" : "?"
          }playerId=${playerId}`;
          return fetch(urlWithPlayerId, options);
        },
      }),
    ],
  });

  return client;
}
