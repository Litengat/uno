import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/server/db"; // your drizzle instance
import * as schema from "@/server/db/schema";
import { env } from "@/env";
import { jwt, username, anonymous } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite", // or "mysql", "sqlite"
    schema: {
      ...schema,
    },
  }),
  plugins: [
    username(),
    anonymous(),
    jwt({
      jwt: {
        definePayload: ({ user }) => {
          return {
            id: user.id,
          };
        },
      },
    }),
  ],

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
});
