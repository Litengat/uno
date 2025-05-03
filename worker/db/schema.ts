import { relations } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});

export const playersTable = sqliteTable("players_table", {
  id: text().primaryKey(),
  name: text().notNull(),
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
