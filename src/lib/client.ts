import { Client } from "discord.js";

export const djsClient = new Client({ intents: ["GuildMembers", "GuildVoiceStates", "Guilds"] });
