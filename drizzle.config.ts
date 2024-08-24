import "dotenv/config";
// ^ Load environment variables from .env file
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "src/lib/schema.ts",
  out: "migrations",
  dbCredentials: {
    url: `file:${process.env.DATABASE_PATH}`,
  },
  migrations: {
    table: "migrations",
    prefix: "timestamp",
  },
  strict: true,
  verbose: true,
});
