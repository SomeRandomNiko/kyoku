import { djsClient } from "@lib/client.js";
import { env } from "@lib/env.js";

console.log(`Logging in...`);

djsClient.once("ready", djsClient => {
  console.log(`Logged in as ${djsClient.user.tag}!`);
});

djsClient.on("interactionCreate", async interaction => {
  if (interaction.isRepliable()) {
    await interaction.reply({ content: "Hello!", ephemeral: true });
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
