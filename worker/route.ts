import { z } from "zod";
import { createOS } from "./mrpc/mini-trpc";
import { clientRouter } from "../src/ws/routes";
import { CardColorSchema } from "./types";

type client = {
  clientID: string;
};

export const os = createOS<typeof clientRouter>();

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
    join: os
      .input(
        z.object({
          playerid: z.string(),
          name: z.string(),
        })
      )
      .handler(async ({ input, createMprc }) => {
        const mrpc = createMprc();
        // Handle join game logic
        return { success: true };
      }),

    startGame: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(async ({ input, createMprc }) => {
        const mrpc = createMprc();
        // Handle start game logic
        return { success: true };
      }),

    drawCard: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(async ({ input, createMprc }) => {
        const mrpc = createMprc();
        // Handle draw card logic
        return { success: true };
      }),

    layDown: os
      .input(
        z.object({
          playerid: z.string(),
          cardId: z.string(),
          wildColor: CardColorSchema.optional(),
        })
      )
      .handler(async ({ input, createMprc }) => {
        const mrpc = createMprc();
        // Handle lay down card logic
        return { success: true };
      }),

    leave: os
      .input(
        z.object({
          playerid: z.string(),
        })
      )
      .handler(async ({ input, createMprc }) => {
        const mrpc = createMprc();
        // Handle player leave logic
        return { success: true };
      }),
  },
};
