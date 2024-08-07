import type { videoInfo } from "@distube/ytdl-core";
import { createWriteStream, existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { Readable } from "stream";
import { env } from "./env.js";
import { downloadYoutubeAudio, getVideoMetadata } from "./ytdl.js";

export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const pad = (num: number): string => num.toString().padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
  } else {
    return `${pad(minutes)}:${pad(remainingSeconds)}`;
  }
}

function readCachedMetadata(videoId: string) {
  const metadataFilepath = getMetadataFilePath(videoId);
  if (!existsSync(metadataFilepath)) {
    return null;
  }
  return JSON.parse(readFileSync(metadataFilepath, "utf-8")) as videoInfo;
}

function writeCachedMetadata(videoId: string, metadata: videoInfo) {
  const metadataFilepath = getMetadataFilePath(videoId);
  writeFileSync(metadataFilepath, JSON.stringify(metadata));
}

export async function getMetadata(videoId: string) {
  const metadata = readCachedMetadata(videoId);
  if (metadata) {
    return metadata;
  }
  try {
    const info = await getVideoMetadata(videoId);
    writeCachedMetadata(videoId, info);
    return info;
  } catch (error) {
    console.error(new Error(`Error getting video info for id "${videoId}"`, { cause: error }));
    return null;
  }
}

function getAudioFilePath(videoId: string) {
  return join(env.DOWNLOADS_PATH, videoId);
}

function getMetadataFilePath(videoId: string) {
  return join(env.DOWNLOADS_PATH, `${videoId}.json`);
}

function readCachedAudioFile(videoId: string) {
  const audioFilepath = getAudioFilePath(videoId);
  if (!existsSync(audioFilepath)) {
    return null;
  }
  return audioFilepath;
}

function writeCachedAudioFile(videoId: string, stream: Readable) {
  const audioFilepath = getAudioFilePath(videoId);
  return new Promise<string>((resolve, reject) => {
    stream
      .on("error", reject)
      .pipe(createWriteStream(audioFilepath) as unknown as NodeJS.WritableStream)
      .on("finish", () => resolve(audioFilepath));
  });
}

export async function getAudioFile(videoId: string) {
  const audioFilepath = readCachedAudioFile(videoId);
  if (audioFilepath) {
    return audioFilepath;
  }
  try {
    const audioStream = await downloadYoutubeAudio(videoId);
    return await writeCachedAudioFile(videoId, audioStream);
  } catch (error) {
    console.error(new Error(`Error downloading audio stream for id "${videoId}"`, { cause: error }));
    return null;
  }
}
