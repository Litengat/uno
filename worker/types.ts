import { z } from "zod";

export type Attachment = {
  id: string;
  name: string | undefined;
};

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  websocket: z.instanceof(WebSocket),
});
export type Player = z.infer<typeof PlayerSchema>;
