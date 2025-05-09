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
