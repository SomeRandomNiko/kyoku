import ytdl from "@distube/ytdl-core";
import { EmbedBuilder } from "discord.js";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { env } from "./env.js";
import { formatSeconds } from "./utils.js";

export class Metadata {
  static getMetadataFilePath(videoId: string) {
    return join(env.DOWNLOADS_PATH, `${videoId}.json`);
  }

  private constructor(
    public videoId: string,
    public title: string,
    public channelName: string,
    public durationSeconds: number,
    public thumbnailUrl?: string,
  ) {}

  toJSON() {
    return {
      videoId: this.videoId,
      title: this.title,
      channelName: this.channelName,
      durationSeconds: this.durationSeconds,
      thumbnailUrl: this.thumbnailUrl,
    };
  }

  getUrl() {
    return `https://www.youtube.com/watch?v=${this.videoId}`;
  }

  toFile() {
    const metadataFilepath = Metadata.getMetadataFilePath(this.videoId);
    writeFileSync(metadataFilepath, JSON.stringify(this.toJSON()));
  }

  static fromJSON(json: Metadata) {
    return new Metadata(json.videoId, json.title, json.channelName, json.durationSeconds, json.thumbnailUrl);
  }

  static fromCache(videoId: string) {
    const metadataFilepath = Metadata.getMetadataFilePath(videoId);
    if (!existsSync(metadataFilepath)) {
      return null;
    }
    return Metadata.fromJSON(JSON.parse(readFileSync(metadataFilepath, "utf-8")));
  }

  static async fromYoutube(videoId: string) {
    try {
      const videoInfo = await ytdl.getBasicInfo(videoId);
      const metadata = new Metadata(
        videoId,
        videoInfo.videoDetails.title,
        videoInfo.player_response.videoDetails.author,
        parseInt(videoInfo.player_response.videoDetails.lengthSeconds),
        videoInfo.videoDetails.thumbnails.sort((a, b) => b.width - a.width)[0]?.url,
      );
      metadata.toFile();
      return metadata;
    } catch (error) {
      console.error(new Error(`Error getting video info for id "${videoId}"`, { cause: error }));
      return null;
    }
  }

  static async fromId(videoId: string) {
    const metadata = Metadata.fromCache(videoId);
    if (metadata) {
      return metadata;
    }
    return await Metadata.fromYoutube(videoId);
  }

  toEmbed() {
    return new EmbedBuilder()
      .setTitle(this.title)
      .setURL(this.getUrl())
      .setColor("#FF0000")
      .addFields([
        { name: "Channel", value: this.channelName, inline: true },
        { name: "Duration", value: formatSeconds(this.durationSeconds), inline: true },
      ])
      .setImage(this.thumbnailUrl ?? null);
  }
}
