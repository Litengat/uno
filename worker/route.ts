import { z } from "zod";
import { CardColorSchema } from "./types";

// Import event handlers
import { join } from "./events/joinHandler";
import { handleStartGame } from "./events/startGameHandler";
import { handleDrawCard } from "./events/drawCardHandler";
import { handleLayDown, layDown } from "./events/layDownHandler";
import { handleLeave } from "./events/leaveHandler";
import { os } from "./mrpc/ws.server";
import { playersTable } from "./db/schema";
import { count } from "drizzle-orm";

const listUsers = os
  .input(z.object({ limit: z.number().optional() }))
  .handler(async ({ input, createMprc }) => {
    const mrpc = createMprc();
    mrpc.notifications.showMessage({ message: "Martin", title: "Martin" });
    return Array.from({ length: input.limit || 10 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
    }));
  });

export const serverRouter = {
  users: {
    getUser: os
      .input(z.object({ id: z.number() }))
      .handler(async ({ input }) => {
        return { id: input.id, name: "User " + input.id };
      }),

    listUsers: listUsers,
  },

  game: {
    join,
    layDown,
    startGame: os.input(z.object({})).handler(async ({}) => {
      console.log("GameStart");
      return { success: true };
    }),

    drawCard: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(handleDrawCard),

    // layDown: os
    //   .input(
    //     z.object({
    //       playerid: z.string(),
    //       cardId: z.string(),
    //       wildColor: CardColorSchema.optional(),
    //     })
    //   )
    //   .handler(handleLayDown),

    leave: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(handleLeave),
  },
};
