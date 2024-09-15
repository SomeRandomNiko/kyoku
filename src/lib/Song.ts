import { Audio } from "./Audio.js";
import { Metadata } from "./Metadata.js";

export class Song {
  private constructor(
    private metadata: Metadata,
    private audio: Audio,
  ) {}

  static async fromId(videoId: string) {
    const metadata = await Metadata.fromId(videoId);
    if (!metadata) {
      return;
    }
    const audio = await Audio.fromId(videoId);
    if (!audio) {
      return;
    }
    return new Song(metadata, audio);
  }

  toEmbed() {
    return this.metadata.toEmbed();
  }

  toAudioResource() {
    return this.audio.toAudioResource();
  }

  get url() {
    return this.metadata.url;
  }

  get videoId() {
    return this.metadata.videoId;
  }

  get title() {
    return this.metadata.title;
  }

  get channelName() {
    return this.metadata.channelName;
  }

  get durationSeconds() {
    return this.metadata.durationSeconds;
  }

  get thumbnailUrl() {
    return this.metadata.thumbnailUrl;
  }
}
