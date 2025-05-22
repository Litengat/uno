// import { Eventmanager } from "@/events/EventManager";
// import { safeJsonParse } from "@/lib/utils";
// import { useHandStore, usePlayerStore } from "@/state";
// import { CardSchema } from "@/types";
// import { useParams } from "react-router";
// // import useWebSocket from "react-use-websocket";
// import z from "zod";

// // function useWebsocket() {
// //   const { id } = useParams();
// //   if (!id) {
// //     throw new Error("No game ID provided");
// //   }

// //   const url = `ws://localhost:5173/websocket/${id}`;

// //   const eventManager = new Eventmanager();

// //   const addPlayer = usePlayerStore((state) => state.addPlayer);
// //   const addCard = useHandStore((state) => state.addCard);

// //   const webSocket = useWebSocket(url, {
// //     onMessage: (event) => {
// //       const parsed = safeJsonParse(event.data);
// //       if (parsed.isErr()) {
// //         console.error("Error parsing event", parsed.error);
// //         return;
// //       }
// //       const result = eventManager.run(parsed.value);

// //       if (result.isErr()) {
// //         console.error("Error running event", result.error);
// //       }
// //     },
// //   });

//   eventManager.register({
//     type: "Join",
//     schema: z.object({
//       type: z.literal("join"),
//       playerid: z.string(),
//       name: z.string(),
//       numberOfCards: z.number(),
//     }),
//     func: (event) => {
//       addPlayer({
//         id: event.playerid,
//         name: event.name,
//         numberOfCards: event.numberOfCards,
//       });
//     },
//   });
//   eventManager.register({
//     type: "CardDrawn",
//     schema: z.object({
//       type: z.literal("CardDrawn"),
//       card: CardSchema,
//     }),
//     func: (event) => {
//       addCard(event.card);
//     },
//   });
//   return webSocket;
// }
