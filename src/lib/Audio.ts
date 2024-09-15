import { createAudioResource } from "@discordjs/voice";
import ytdl from "@distube/ytdl-core";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Readable } from "stream";
import { env } from "./env.js";

export class Audio {
  private constructor(
    public videoId: string,
    public buffer: Buffer,
  ) {}

  static getFilePath(videoId: string) {
    return join(env.DOWNLOADS_PATH, videoId);
  }

  static async fromYoutube(videoId: string) {
    try {
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const buf: any[] = [];
        ytdl(videoId, { filter: "audioonly" })
          .on("data", chunk => buf.push(chunk))
          .on("end", () => resolve(Buffer.concat(buf)))
          .on("error", reject);
      });

      const audio = new Audio(videoId, buffer);
      audio.toFile();
      return audio;
    } catch (error) {
      console.error(new Error(`Error getting audio for id "${videoId}"`, { cause: error }));
    }
  }

  static fromCache(videoId: string) {
    const filepath = Audio.getFilePath(videoId);
    if (existsSync(filepath)) {
      return new Audio(videoId, readFileSync(filepath));
    }
  }

  static async fromId(videoId: string) {
    const audio = Audio.fromCache(videoId);
    if (audio) {
      return audio;
    }
    return await Audio.fromYoutube(videoId);
  }

  toFile() {
    const filepath = Audio.getFilePath(this.videoId);
    writeFileSync(filepath, this.buffer);
  }

  toAudioResource() {
    return createAudioResource(Readable.from(this.buffer));
  }
}
