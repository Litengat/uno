// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  sqliteTable,
  sqliteTableCreator,
} from "drizzle-orm/sqlite-core";

export * from "./auth-schema";
