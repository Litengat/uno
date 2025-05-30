import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { anonymousClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient(), anonymousClient()],
});

export const { signIn, signOut, signUp, useSession } = authClient;
