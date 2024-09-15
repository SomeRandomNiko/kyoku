import ytdl from "@distube/ytdl-core";
import { EmbedBuilder } from "discord.js";
import { Audio } from "./Audio.js";
import * as Q from "./queries.js";
import { formatSeconds } from "./utils.js";

export class Metadata {
  private constructor(
    public videoId: string,
    public title: string,
    public channelName: string,
    public durationSeconds: number,
  ) {}

  toJSON() {
    return {
      videoId: this.videoId,
      title: this.title,
      channelName: this.channelName,
      durationSeconds: this.durationSeconds,
    };
  }

  get url() {
    return `https://www.youtube.com/watch?v=${this.videoId}`;
  }

  toDb() {
    return Q.saveMetadata({
      videoId: this.videoId,
      title: this.title,
      channelName: this.channelName,
      durationSeconds: this.durationSeconds,
    });
  }

  static fromDb(videoId: string) {
    const song = Q.getMetadata(videoId);

    if (song) {
      return new Metadata(song.videoId, song.title, song.channelName, song.durationSeconds);
    }
  }

  static async fromYoutube(videoId: string) {
    try {
      const videoInfo = await ytdl.getBasicInfo(videoId);
      const metadata = new Metadata(
        videoId,
        videoInfo.videoDetails.title,
        videoInfo.player_response.videoDetails.author,
        parseInt(videoInfo.player_response.videoDetails.lengthSeconds),
      );
      metadata.toDb();
      return metadata;
    } catch (error) {
      console.error(new Error(`Error getting video info for id "${videoId}"`, { cause: error }));
    }
  }

  static async fromId(videoId: string) {
    const metadata = Metadata.fromDb(videoId);
    if (metadata) {
      return metadata;
    }
    return await Metadata.fromYoutube(videoId);
  }

  get thumbnailUrl() {
    return `https://i.ytimg.com/vi/${this.videoId}/0.jpg`;
  }

  toEmbed() {
    return new EmbedBuilder()
      .setTitle(this.title)
      .setURL(this.url)
      .setColor("#FF0000")
      .addFields([
        { name: "Channel", value: this.channelName, inline: true },
        { name: "Duration", value: formatSeconds(this.durationSeconds), inline: true },
      ])
      .setImage(this.thumbnailUrl);
  }

  toAudio() {
    return Audio.fromId(this.videoId);
  }
}
