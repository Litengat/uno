import { z } from "zod";
import { GameRoom } from "@/GameRoom";

// Helper for creating procedures
export const os = {
  input: <TInput extends z.ZodType>(schema: TInput) => ({
    output: <TOutput extends z.ZodType>(outputSchema: TOutput) => ({
      handler: (
        handler: (opts: {
          input: z.infer<TInput>;
          ctx: { playerid: string; gameRoom: GameRoom };
        }) => Promise<z.infer<TOutput>>
      ) => ({
        input: schema,
        output: outputSchema,
        handler: async (
          input: z.infer<TInput>,
          context: { playerid: string },
          gameRoom: GameRoom
        ) => {
          return handler({
            input,
            ctx: { playerid: context.playerid, gameRoom },
          });
        },
      }),
    }),
  }),
};

// Base message type for all communications
export const BaseMessage = z.object({
  type: z.string(),
  id: z.string(),
  playerid: z.string(),
});

// Message types
export const RequestMessage = BaseMessage.extend({
  type: z.literal("request"),
  procedure: z.string(),
  input: z.any(),
});

export const ResponseMessage = BaseMessage.extend({
  type: z.literal("response"),
  procedure: z.string(),
  output: z.any(),
  error: z.string().optional(),
});

export type RequestMessage = z.infer<typeof RequestMessage>;
export type ResponseMessage = z.infer<typeof ResponseMessage>;

// Type helper for router definitions
export type ProcedureType = ReturnType<
  ReturnType<ReturnType<typeof os.input>["output"]>["handler"]
>;

export type Router = {
  [key: string]: {
    [key: string]: ProcedureType;
  };
};
