// import { Card, Player } from "~/types/Card";
// import { GameRoom } from "~/GameRoom";
// import { cardsTable, playersTable } from "~/db/schema";
// import { count, eq } from "drizzle-orm";
// import { createProcedure } from "./protocol";
// import { z } from "zod";
// import { ServerRPC } from "./ServerRPC";

// // Define RPC procedures for game events
// export const updatePlayersProcedure = createProcedure(
//   z.object({}),
//   z.object({
//     players: z.array(
//       z.object({
//         id: z.string(),
//         name: z.string(),
//         position: z.number(),
//         numberOfCards: z.number(),
//       })
//     ),
//   }),
//   async (_, { playerid }, gameRoom: GameRoom) => {
//     const players = gameRoom.db.select().from(playersTable).all();
//     const playersWithCards = players.map((player) => {
//       const result = gameRoom.db
//         .select({ count: count() })
//         .from(cardsTable)
//         .where(eq(cardsTable.holder, player.id))
//         .get();
//       return {
//         ...player,
//         numberOfCards: result?.count ?? 0,
//       };
//     });
//     return { players: playersWithCards };
//   }
// );

// export const playerLeftProcedure = createProcedure(
//   z.object({
//     playerId: z.string(),
//   }),
//   z.object({
//     success: z.boolean(),
//   }),
//   async (input, { playerid }, gameRoom: GameRoom) => {
//     gameRoom.db
//       .delete(playersTable)
//       .where(eq(playersTable.id, input.playerId))
//       .run();
//     return { success: true };
//   }
// );

// export const cardDrawnProcedure = createProcedure(
//   z.object({
//     card: z.object({
//       id: z.string(),
//       suit: z.string(),
//       value: z.string(),
//     }),
//   }),
//   z.object({
//     success: z.boolean(),
//   }),
//   async (input, { playerid }, gameRoom: GameRoom) => {
//     // Implementation for card drawn
//     return { success: true };
//   }
// );

// export const cardLaidDownProcedure = createProcedure(
//   z.object({
//     playerId: z.string(),
//     card: z.object({
//       id: z.string(),
//       suit: z.string(),
//       value: z.string(),
//     }),
//   }),
//   z.object({
//     success: z.boolean(),
//   }),
//   async (input, { playerid }, gameRoom: GameRoom) => {
//     // Implementation for card laid down
//     return { success: true };
//   }
// );

// export const updateCardCountProcedure = createProcedure(
//   z.object({
//     playerId: z.string(),
//     numberOfCards: z.number(),
//   }),
//   z.object({
//     success: z.boolean(),
//   }),
//   async (input, { playerid }, gameRoom: GameRoom) => {
//     // Implementation for updating card count
//     return { success: true };
//   }
// );

// export const gameStartedProcedure = createProcedure(
//   z.object({}),
//   z.object({
//     success: z.boolean(),
//   }),
//   async (_, { playerid }, gameRoom: GameRoom) => {
//     // Implementation for game started
//     return { success: true };
//   }
// );

// export const nextTurnProcedure = createProcedure(
//   z.object({
//     playerId: z.string(),
//   }),
//   z.object({
//     success: z.boolean(),
//   }),
//   async (input, { playerid }, gameRoom: GameRoom) => {
//     // Implementation for next turn
//     return { success: true };
//   }
// );

// // Function to register all game procedures
// export function registerGameProcedures(rpc: ServerRPC, gameRoom: GameRoom) {
//   rpc.register("updatePlayers", updatePlayersProcedure);
//   rpc.register("playerLeft", playerLeftProcedure);
//   rpc.register("cardDrawn", cardDrawnProcedure);
//   rpc.register("cardLaidDown", cardLaidDownProcedure);
//   rpc.register("updateCardCount", updateCardCountProcedure);
//   rpc.register("gameStarted", gameStartedProcedure);
//   rpc.register("nextTurn", nextTurnProcedure);
// }
