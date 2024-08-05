import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { downloadYoutubeAudio } from "./ytdl.js";

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
  await interaction.reply({ content: "Downloading...", ephemeral: true });
  await downloadYoutubeAudio(url, "test.mp3");
  await interaction.editReply({ content: "Downloaded!" });
})
  .setName("play")
  .setDescription("Play a song");

playCommand.addStringOption(option =>
  option.setName("url").setDescription("The youtube video url of the song").setRequired(true),
);

slashCommands.set("play", playCommand);
