import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";

export class SlashCommand extends SlashCommandBuilder {
  constructor(private callback: (interaction: ChatInputCommandInteraction) => void | Promise<void>) {
    super();
  }

  run(interaction: ChatInputCommandInteraction) {
    return this.callback(interaction);
  }
}

export const slashCommands = new Map<string, SlashCommand>();

const playCommand = new SlashCommand(async interaction => {
  const url = interaction.options.getString("url", true);
  console.log(url);
  await interaction.reply({ content: "Hello!", ephemeral: true });
})
  .setName("play")
  .setDescription("Play a song");

playCommand.addStringOption(option =>
  option.setName("url").setDescription("The youtube video url of the song").setRequired(true),
);

slashCommands.set("play", playCommand);
