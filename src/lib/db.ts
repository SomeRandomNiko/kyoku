import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { env } from "./env.js";
import * as schema from "./schema.js";
const sqlite = new Database(env.DATABASE_PATH);
export const db = drizzle(sqlite, { schema });
