"use server";

import { eq } from "drizzle-orm";
import { db } from "./db";
import { user } from "./db/schema";

export async function isUsernameUsed(username: string) {
  return (
    (await db.select().from(user).where(eq(user.username, username)).limit(1))
      .length === 0
  );
}
export async function getUser(id: string) {
  return await db.select().from(user).where(eq(user.id, id)).get();
}
