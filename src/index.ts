import { getVoiceConnections } from "@discordjs/voice";
import { djsClient } from "@lib/client.js";
import { registeredCommands } from "@lib/commands.js";
import { env } from "@lib/env.js";
import * as Q from "@lib/queries.js";

console.log(`Logging in...`);

djsClient.once("ready", djsClient => {
  console.log(`Logged in as ${djsClient.user.tag}!`);

  console.log("Registering guilds...");
  const registeredGuilds = Q.syncGuilds(djsClient);
  console.log(`Registered ${registeredGuilds.length} guilds.`);

  console.log("Cleaning up deleted text channels...");
  const deletedTextChannelsCount = Q.cleanupDeletedTextChannels(djsClient);
  console.log(`Cleaned up ${deletedTextChannelsCount} text channels.`);
  console.log("Done.");
});

djsClient.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = registeredCommands.get(interaction.commandName);
    if (!command) {
      await interaction.reply({ content: "Unknown command!", ephemeral: true });
      return;
    }

    try {
      await command.run(interaction);
    } catch (error) {
      console.error(new Error(`Error running command ${command.name}`, { cause: error }));
      if (!interaction.replied) {
        await interaction.reply({ content: "An error occurred!", ephemeral: true });
      }
    }
  }
});

await djsClient.login(env.DISCORD_BOT_TOKEN);

// Destroy the client when the process receives an exit event
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
  process.on(eventType, () => {
    process.removeAllListeners();
    console.log(`\nReceived ${eventType} event, exiting...`);
    getVoiceConnections().forEach(connection => connection.destroy());
    djsClient
      .destroy()
      .then(() => process.exit(0))
      .catch(console.error);
  });
});
