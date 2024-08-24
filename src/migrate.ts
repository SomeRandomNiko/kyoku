import { env } from "@lib/env.js";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
const sqlite = new Database(env.DATABASE_PATH);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "migrations", migrationsTable: "migrations" });

sqlite.close();
