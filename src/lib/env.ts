import "dotenv/config";
// ^ Load environment variables from .env file
import { z } from "zod";

const envSchema = z.object({
  DISCORD_BOT_TOKEN: z.string(),
  APPLICATION_ID: z.string(),
  GUILD_ID: z.string(),
  DOWNLOADS_PATH: z.string(),
});

const validation = envSchema.safeParse(process.env);

if (validation.error) {
  console.error("Error loading environment variables:");
  console.error(validation.error.issues);
  process.exit(1);
}

export const env = validation.data;
