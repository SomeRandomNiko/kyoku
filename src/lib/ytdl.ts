import ytdl from "@distube/ytdl-core";

export function downloadYoutubeAudio(videoId: string) {
  return ytdl(videoId, { filter: "audioonly" });
}

export async function getVideoMetadata(url: string) {
  const info = await ytdl.getBasicInfo(url);
  return info;
}

export function getVideoID(url: string) {
  return new Promise<string>((resolve, reject) => {
    try {
      const id = ytdl.getVideoID(url);
      resolve(id);
    } catch (error) {
      reject(error);
    }
  });
}
