import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";

export class MySlashCommandBuilder extends SlashCommandBuilder {
  private callback?: (interaction: ChatInputCommandInteraction<"cached">) => void | Promise<void>;

  async run(interaction: ChatInputCommandInteraction) {
    if (!this.callback) {
      await interaction.reply({ content: "This command has not been set up yet." });
      return;
    }

    if (!interaction.inCachedGuild()) {
      await interaction.reply({ content: "This command can only be used if the bot is in the server." });
      return;
    }

    await interaction.deferReply();
    return await this.callback(interaction);
  }

  setCallback(callback: (interaction: ChatInputCommandInteraction<"cached">) => void | Promise<void>) {
    this.callback = callback;
    return this;
  }
}
