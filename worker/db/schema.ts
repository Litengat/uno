import { relations, sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
});

export const playersTable = sqliteTable("players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  score: int("score").default(0),
  isActive: int("is_active", { mode: "boolean" }).default(true),
  hasCalledUno: int("has_called_uno", { mode: "boolean" }).default(false),
});

export const cardsTable = sqliteTable("cards", {
  id: text("id").primaryKey(),
  playerId: text("player_id").references(() => playersTable.id),
  color: text("color").notNull(), // RED, BLUE, GREEN, YELLOW, WILD
  type: text("type").notNull(), // NUMBER, SKIP, REVERSE, DRAW_TWO, WILD, WILD_DRAW_FOUR
  value: int("value"), // Only for number cards
  isDiscarded: int("is_discarded", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const gameStateTable = sqliteTable("game_state", {
  id: text("id").primaryKey().default("game"),
  status: text("status").default("WAITING"), // WAITING, ACTIVE, COMPLETED
  currentPlayerId: text("current_player_id").references(() => playersTable.id),
  direction: text("direction").default("CLOCKWISE"), // CLOCKWISE, COUNTER_CLOCKWISE
  winnerId: text("winner_id").references(() => playersTable.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const cardsrelations = relations(cardsTable, ({ one }) => ({
  holder: one(playersTable, {
    fields: [cardsTable.playerId],
    references: [playersTable.id],
  }),
}));
