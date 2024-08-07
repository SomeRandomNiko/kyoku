import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
} from "@discordjs/voice";
import type { ChatInputCommandInteraction } from "discord.js";
import { bold, EmbedBuilder, SlashCommandBuilder, userMention } from "discord.js";
import { createReadStream, existsSync } from "fs";
import path from "path";
import { env } from "./env.js";
import { formatSeconds } from "./utils.js";
import { downloadYoutubeAudio, getVideoInfo } from "./ytdl.js";

export class SlashCommand extends SlashCommandBuilder {
  constructor(private callback: (interaction: ChatInputCommandInteraction<"cached">) => void | Promise<void>) {
    super();
  }

  async run(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({ content: "This command can only be used if the bot is in the server." });
      return;
    }
    await interaction.deferReply();
    return await this.callback(interaction);
  }
}

export const slashCommands = new Map<string, SlashCommand>();
const playCommand = new SlashCommand(async interaction => {
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

  const filepath = path.join(env.DOWNLOADS_PATH, videoId);

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
})
  .setName("play")
  .setDescription("Play a song");

playCommand.addStringOption(option =>
  option.setName("url").setDescription("The youtube video url of the song").setRequired(true),
);

slashCommands.set("play", playCommand);

const stopCommand = new SlashCommand(async interaction => {
  const connection = getVoiceConnection(interaction.guildId);
  if (!connection) {
    await interaction.editReply({ content: "I am not in a voice channel!" });
    return;
  }
  connection.destroy();
  await interaction.editReply({ content: "Stopped the current song." });
})
  .setName("stop")
  .setDescription("Stop the current song");

slashCommands.set("stop", stopCommand);
