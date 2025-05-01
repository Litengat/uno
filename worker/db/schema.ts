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
  cards: text().notNull(),
});
