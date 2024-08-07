import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
} from "@discordjs/voice";
import { bold, userMention } from "discord.js";
import { createReadStream } from "fs";
import { Metadata } from "./Metadata.js";
import { MySlashCommandBuilder } from "./MySlashCommandBuilder.js";
import { getAudioFile } from "./utils.js";
import { getVideoID } from "./ytdl.js";

export const registeredCommands = new Map<string, MySlashCommandBuilder>();

function registerCommand(command: MySlashCommandBuilder) {
  registeredCommands.set(command.name, command);
}

const playCommand = new MySlashCommandBuilder()
  .setName("play")
  .setDescription("Play a song")
  .setCallback(async interaction => {
    const url = interaction.options.getString("url", true);

    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      await interaction.editReply({ content: "You must be in a voice channel to use this command." });
      return;
    }

    const videoId = await getVideoID(url).catch(error => {
      console.error(new Error(`Error getting video id for url "${url}"`, { cause: error }));
      return null;
    });

    if (!videoId) {
      await interaction.editReply({ content: "Could not find video id for this url." });
      return;
    }

    const metadata = await Metadata.fromId(videoId);

    if (!metadata) {
      await interaction.editReply({ content: "Could not find metadata" });
      return;
    }

    const audioFilePath = await getAudioFile(videoId);

    if (!audioFilePath) {
      await interaction.editReply({ content: "Could not find audio file for this url." });
      return;
    }

    await interaction.editReply({
      content: `Playing ${bold(metadata.title)}, requested by ${userMention(interaction.user.id)}`,
      embeds: [metadata.toEmbed()],
    });

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = new AudioPlayer();
    connection.subscribe(player);
    player.play(createAudioResource(createReadStream(audioFilePath)));
    player.on("stateChange", (oldState, newState) => {
      if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
        connection.destroy();
      }
    });
  });

playCommand.addStringOption(option =>
  option.setName("url").setDescription("The youtube video url of the song").setRequired(true),
);

registerCommand(playCommand);

const stopCommand = new MySlashCommandBuilder()
  .setName("stop")
  .setDescription("Stop the current song")
  .setCallback(async interaction => {
    const connection = getVoiceConnection(interaction.guildId);
    if (!connection) {
      await interaction.editReply({ content: "I am not in a voice channel!" });
      return;
    }
    connection.destroy();
    await interaction.editReply({ content: "Stopped the current song." });
  });

registerCommand(stopCommand);
