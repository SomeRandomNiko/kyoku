import ytdl from "@distube/ytdl-core";
import { bold, userMention } from "discord.js";
import { MusicPlayer } from "./MusicPlayer.js";
import { MySlashCommandBuilder } from "./MySlashCommandBuilder.js";
import { Song } from "./Song.js";

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

    let videoId: string;

    try {
      videoId = ytdl.getVideoID(url);
    } catch (error) {
      console.error(new Error(`Error getting video id for url "${url}"`, { cause: error }));
      await interaction.editReply({ content: "Could not find video id for this url." });
      return;
    }

    const song = await Song.fromId(videoId);

    if (!song) {
      await interaction.editReply({ content: "Could not find song" });
      return;
    }

    const musicPlayer = MusicPlayer.getMusicPlayerOfGuild(interaction.guildId);

    if (musicPlayer) {
      musicPlayer.addSong(song);
      await interaction.editReply({ content: "Added song to queue." });
      return;
    }

    try {
      const musicPlayer = await MusicPlayer.create(voiceChannel);

      musicPlayer.play(song);

      await interaction.editReply({
        content: `Playing ${bold(song.title)}, requested by ${userMention(interaction.user.id)}`,
        embeds: [song.toEmbed()],
      });
    } catch (error) {
      console.error(new Error(`Error getting music player`, { cause: error }));
      await interaction.editReply({ content: "Error getting music player" });
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
    const musicPlayer = MusicPlayer.getMusicPlayerOfGuild(interaction.guildId);

    if (!musicPlayer) {
      await interaction.editReply({ content: "I am not in a voice channel!" });
      return;
    }

    musicPlayer.destroy();
    await interaction.editReply({ content: "Stopped the current song." });
  });

registerCommand(stopCommand);

const pauseCommand = new MySlashCommandBuilder()
  .setName("pause")
  .setDescription("Pause the player")
  .setCallback(async interaction => {
    const musicPlayer = MusicPlayer.getMusicPlayerOfGuild(interaction.guildId);

    if (!musicPlayer) {
      await interaction.editReply({ content: "I am not in a voice channel!" });
      return;
    }

    if (!musicPlayer.isPlaying) {
      await interaction.editReply({ content: "I am already paused!" });
      return;
    }

    musicPlayer.pause();
    await interaction.editReply({ content: "Paused the player." });
  });

registerCommand(pauseCommand);

const resumeCommand = new MySlashCommandBuilder()
  .setName("resume")
  .setDescription("Resume the player")
  .setCallback(async interaction => {
    const musicPlayer = MusicPlayer.getMusicPlayerOfGuild(interaction.guildId);

    if (!musicPlayer) {
      await interaction.editReply({ content: "I am not in a voice channel!" });
      return;
    }

    if (musicPlayer.isPlaying) {
      await interaction.editReply({ content: "I am already playing!" });
      return;
    }

    musicPlayer.resume();
    await interaction.editReply({ content: "Resumed the player." });
  });

registerCommand(resumeCommand);

const skipCommand = new MySlashCommandBuilder()
  .setName("skip")
  .setDescription("Skip the current song")
  .setCallback(async interaction => {
    const musicPlayer = MusicPlayer.getMusicPlayerOfGuild(interaction.guildId);

    if (!musicPlayer) {
      await interaction.editReply({ content: "I am not in a voice channel!" });
      return;
    }

    musicPlayer.skip();
    await interaction.editReply({ content: "Skipped the current song." });
  });

registerCommand(skipCommand);
