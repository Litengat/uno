import { z } from "zod";
import { createOS } from "./mrpc/mini-trpc";
import { clientRouter } from "../src/ws/routes";
import { CardColorSchema } from "./types";
import { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
// Import event handlers
import { join } from "./game/events/joinHandler";
import { handleStartGame } from "./game/events/startGameHandler";
import { handleDrawCard } from "./game/events/drawCardHandler";
import { handleLayDown } from "./game/events/layDownHandler";
import { handleLeave } from "./game/events/leaveHandler";
import { ServerContext } from "./mrpc/ws.server";

type client = {
  clientID: string;
  db: DrizzleSqliteDODatabase;
};

export const os = createOS<ServerContext>();

export const serverRouter = {
  users: {
    getUser: os
      .input(z.object({ id: z.number() }))
      .handler(async ({ input }) => {
        return { id: input.id, name: "User " + input.id };
      }),

    listUsers: os
      .input(z.object({ limit: z.number().optional() }))
      .handler(async ({ input, createMprc }) => {
        const mrpc = createMprc();
        mrpc.notifications.showMessage({ message: "Martin", title: "Martin" });
        return Array.from({ length: input.limit || 10 }, (_, i) => ({
          id: i + 1,
          name: `User ${i + 1}`,
        }));
      }),
  },

  game: {
    join: join,
    startGame: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(handleStartGame),

    drawCard: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(handleDrawCard),

    layDown: os
      .input(
        z.object({
          playerid: z.string(),
          cardId: z.string(),
          wildColor: CardColorSchema.optional(),
        })
      )
      .handler(handleLayDown),

    leave: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(handleLeave),
  },
};
