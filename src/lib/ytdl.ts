import ytdl from "@distube/ytdl-core";
import fs from "fs";

export function downloadYoutubeAudio(url: string, outputPath: string) {
  return new Promise((resolve, reject) => {
    ytdl(url, { filter: "audioonly" })
      .on("error", reject)
      .pipe(fs.createWriteStream(outputPath) as unknown as NodeJS.WritableStream)
      .on("finish", resolve);
  });
}

export async function getVideoInfo(url: string) {
  const info = await ytdl.getInfo(url);
  return info;
}
