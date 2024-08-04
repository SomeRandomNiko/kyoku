import { env } from "@lib/env.js";
import type { RESTPutAPIApplicationGuildCommandsJSONBody } from "discord-api-types/v10";
import { ApplicationCommandOptionType, ApplicationCommandType, REST, Routes } from "discord.js";

const restClient = new REST().setToken(env.DISCORD_BOT_TOKEN);

await restClient.put(Routes.applicationGuildCommands(env.APPLICATION_ID, env.GUILD_ID), {
  body: [
    {
      name: "play",
      description: "Play a song",
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          name: "url",
          description: "The youtube video url of the song",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ] satisfies RESTPutAPIApplicationGuildCommandsJSONBody,
});
