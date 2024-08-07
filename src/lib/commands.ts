import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
} from "@discordjs/voice";
import { bold, EmbedBuilder, userMention } from "discord.js";
import { createReadStream, existsSync } from "fs";
import { join } from "path";
import { env } from "./env.js";
import { MySlashCommandBuilder } from "./MySlashCommandBuilder.js";
import { formatSeconds } from "./utils.js";
import { downloadYoutubeAudio, getVideoInfo } from "./ytdl.js";

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

    const info = await getVideoInfo(url).catch(error => {
      console.error(new Error(`Error getting video info for url "${url}"`, { cause: error }));
      return null;
    });

    if (!info) {
      await interaction.editReply({ content: "Could not find video info for this url." });
      return;
    }
    const videoId = info.videoDetails.videoId;
    const thumbnailUrl = info.videoDetails.thumbnails.sort((a, b) => b.width - a.width)[0]?.url;
    const videoTitle = info.player_response.videoDetails.title;
    const channelName = info.player_response.videoDetails.author;
    const durationSeconds = parseInt(info.player_response.videoDetails.lengthSeconds);

    const filepath = join(env.DOWNLOADS_PATH, videoId);

    if (!existsSync(filepath)) {
      await downloadYoutubeAudio(url, filepath);
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
    player.play(createAudioResource(createReadStream(filepath)));
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
