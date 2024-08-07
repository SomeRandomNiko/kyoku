import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
} from "@discordjs/voice";
import { bold, EmbedBuilder, userMention } from "discord.js";
import { createReadStream } from "fs";
import { MySlashCommandBuilder } from "./MySlashCommandBuilder.js";
import { formatSeconds, getAudioFile, getMetadata } from "./utils.js";
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

    const metadata = await getMetadata(videoId);

    if (!metadata) {
      await interaction.editReply({ content: "Could not find video info for this url." });
      return;
    }

    const thumbnailUrl = metadata.videoDetails.thumbnails.sort((a, b) => b.width - a.width)[0]?.url;
    const videoTitle = metadata.player_response.videoDetails.title;
    const channelName = metadata.player_response.videoDetails.author;
    const durationSeconds = parseInt(metadata.player_response.videoDetails.lengthSeconds);

    const audioFilePath = await getAudioFile(videoId);

    if (!audioFilePath) {
      await interaction.editReply({ content: "Could not find audio file for this url." });
      return;
    }

    await interaction.editReply({
      content: `Playing ${bold(videoTitle)}, requested by ${userMention(interaction.user.id)}`,
      embeds: [
        new EmbedBuilder()
          .setTitle(videoTitle)
          .setURL(url)
          .setColor("#FF0000")
          .addFields([
            { name: "Channel", value: channelName, inline: true },
            { name: "Duration", value: formatSeconds(durationSeconds), inline: true },
          ])
          .setImage(thumbnailUrl ?? null),
      ],
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
