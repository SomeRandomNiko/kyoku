import { AudioPlayer, AudioPlayerStatus, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import type { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import { createReadStream } from "fs";
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
  if (!interaction.inCachedGuild()) {
    await interaction.reply({ content: "This command can only be used if the bot is in the server.", ephemeral: true });
    return;
  }

  const url = interaction.options.getString("url", true);

  const voiceChannel = interaction.member.voice.channel;

  console.log(voiceChannel);

  if (!voiceChannel) {
    await interaction.reply({ content: "You must be in a voice channel to use this command.", ephemeral: true });
    return;
  }

  await interaction.reply({ content: "Downloading...", ephemeral: true });
  await downloadYoutubeAudio(url, "test.mp3");
  await interaction.editReply({ content: "Downloaded!" });

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  const player = new AudioPlayer();
  connection.subscribe(player);
  player.play(createAudioResource(createReadStream("test.mp3")));
  player.on("stateChange", (oldState, newState) => {
    if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
      connection.destroy();
    }
  });
})
  .setName("play")
  .setDescription("Play a song");

playCommand.addStringOption(option =>
  option.setName("url").setDescription("The youtube video url of the song").setRequired(true),
);

slashCommands.set("play", playCommand);
