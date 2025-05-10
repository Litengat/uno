import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const playersTable = sqliteTable("players_table", {
  id: text().primaryKey(),
  name: text().notNull(),
  position: int().notNull(),
  isHost: int({ mode: "boolean" }).default(false),
  isReady: int({ mode: "boolean" }).default(false),
});

export const cardsTable = sqliteTable("cards_table", {
  id: text().primaryKey(),
  type: text().notNull(),
  color: text().notNull(),
  number: int(),
  holder: text().notNull(),
  // .references(() => playersTable.id),
});

export const cardsrelations = relations(cardsTable, ({ one }) => ({
  holder: one(playersTable, {
    fields: [cardsTable.holder],
    references: [playersTable.id],
  }),
}));

export const gameTable = sqliteTable("game_table", {
  id: int().primaryKey(),
  direction: int().default(1).notNull(), // 1 or -1
  currentPlayerIndex: int().default(0).notNull(),
  startCardCount: int().default(7),
});
