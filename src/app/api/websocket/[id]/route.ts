import { env } from "@/env";
import { auth } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { headers } from "next/headers";
// Assuming you're using Clerk. Adjust imports for your auth solution.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;
  if (typeof id !== "string") {
    console.error("Id is not a string");
    return;
  }
  if (req.method !== "GET") {
    console.error("not get");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  // --- Authentication Check ---
  // Replace this with your actual authentication logic.
  // Example using Clerk:
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    // User is not authenticated
    console.log({ message: "Unauthorized" });
    return res.status(401).json({ message: "Unauthorized" });
  }

  // --- Redirect to Cloudflare Worker WebSocket Endpoint ---
  // IMPORTANT: Use wss:// for secure connections in production.
  const cloudflareWorkerWebSocketUrl = `${env.NEXT_PUBLIC_WEBSOCKET_URL}/${id}`;
  console.log(cloudflareWorkerWebSocketUrl);
  // Use a 307 Temporary Redirect to allow the client to re-attempt the request
  // with the same method (GET) to the new URL.
  res.redirect(307, cloudflareWorkerWebSocketUrl);
}
