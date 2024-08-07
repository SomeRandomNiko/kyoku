import { registeredCommands } from "@lib/commands.js";
import { env } from "@lib/env.js";
import type { RESTPutAPIApplicationGuildCommandsJSONBody } from "discord-api-types/v10";
import { ApplicationCommandType, REST, Routes } from "discord.js";

const restClient = new REST().setToken(env.DISCORD_BOT_TOKEN);

const body: RESTPutAPIApplicationGuildCommandsJSONBody = Array.from(registeredCommands.values()).map(command => ({
  name: command.name,
  description: command.description,
  type: ApplicationCommandType.ChatInput,
  options: command.options.map(option => option.toJSON()),
}));

await restClient.put(Routes.applicationGuildCommands(env.APPLICATION_ID, env.GUILD_ID), {
  body: body,
});
