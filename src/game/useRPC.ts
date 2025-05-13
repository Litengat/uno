import { useEffect, useRef } from "react";
import { ClientRPC } from "./ClientRPC";
import { z } from "zod";

export function useRPC(ws: WebSocket | null) {
  const rpcRef = useRef<ClientRPC | null>(null);

  useEffect(() => {
    if (!ws) return;

    rpcRef.current = new ClientRPC(ws);

    // Example of registering client-side procedures
    rpcRef.current.register("clientUpdate", {
      input: z.object({
        data: z.any(),
      }),
      output: z.object({
        success: z.boolean(),
      }),
      handler: async (input) => {
        // Handle client-side updates
        console.log("Client update:", input.data);
        return { success: true };
      },
    });

    return () => {
      rpcRef.current = null;
    };
  }, [ws]);

  return {
    call: async <T>(procedure: string, input: any) => {
      if (!rpcRef.current) {
        throw new Error("RPC not initialized");
      }
      return rpcRef.current.call<T>(procedure, input);
    },
  };
}
