import { env } from "@/env";
import { createAuthClient } from "better-auth/react";

console.log(env.NEXT_PUBLIC_APP_URL);

export const authClient = createAuthClient({
  baseURL: "",
});

export const { signIn, signOut, signUp, useSession } = authClient;
