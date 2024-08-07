import { createWriteStream, existsSync } from "fs";
import { join } from "path";
import type { Readable } from "stream";
import { env } from "./env.js";
import { downloadYoutubeAudio } from "./ytdl.js";

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

function getAudioFilePath(videoId: string) {
  return join(env.DOWNLOADS_PATH, videoId);
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
