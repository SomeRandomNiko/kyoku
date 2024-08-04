import { djsClient } from "@lib/client.js";
import { env } from "@lib/env.js";
import { slashCommands } from "@lib/SlashCommand.js";

console.log(`Logging in...`);

djsClient.once("ready", djsClient => {
  console.log(`Logged in as ${djsClient.user.tag}!`);
});

djsClient.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = slashCommands.get(interaction.commandName);
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
    djsClient.destroy().catch(console.error);
  });
});
