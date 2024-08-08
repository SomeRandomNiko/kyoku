import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { bold, userMention } from "discord.js";
import { Audio } from "./Audio.js";
import { Metadata } from "./Metadata.js";
import { MySlashCommandBuilder } from "./MySlashCommandBuilder.js";

export const registeredCommands = new Map<string, MySlashCommandBuilder>();
const audioPlayers = new Map<string, AudioPlayer>();

function registerCommand(command: MySlashCommandBuilder) {
  registeredCommands.set(command.name, command);
}

function getAudioPlayer(guildId: string) {
  const player = audioPlayers.get(guildId);
  if (player) {
    return player;
  }

  const newPlayer = createAudioPlayer();
  audioPlayers.set(guildId, newPlayer);
  return newPlayer;
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

    let videoId: string;

    try {
      videoId = ytdl.getVideoID(url);
    } catch (error) {
      console.error(new Error(`Error getting video id for url "${url}"`, { cause: error }));
      await interaction.editReply({ content: "Could not find video id for this url." });
      return;
    }

    const metadata = await Metadata.fromId(videoId);

    if (!metadata) {
      await interaction.editReply({ content: "Could not find metadata" });
      return;
    }

    const audio = await Audio.fromId(videoId);

    if (!audio) {
      await interaction.editReply({ content: "Could not find audio" });
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

    const audioPlayer = getAudioPlayer(interaction.guildId);

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5000);
      connection.subscribe(audioPlayer);
      audioPlayer.play(audio.toAudioResource());
      audioPlayer.on("stateChange", (oldState, newState) => {
        if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
          connection.destroy();
        }
      });
    } catch (error) {
      console.error(new Error(`Error joining voice channel`, { cause: error }));
      await interaction.editReply({ content: "Could not join voice channel." });
      return;
    }
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
