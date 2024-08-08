import {
  AudioPlayerStatus,
  createAudioPlayer,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
  type AudioPlayer,
  type VoiceConnection,
} from "@discordjs/voice";
import type { VoiceBasedChannel } from "discord.js";
import { Queue } from "./Queue.js";
import type { Song } from "./Song.js";

export class MusicPlayer {
  static guildMusicPlayers = new Map<string, MusicPlayer>();

  private constructor(
    public guildId: string,
    private audioPlayer: AudioPlayer,
    private connection: VoiceConnection,
    private queue: Queue<Song>,
  ) {}

  static async create(channel: VoiceBasedChannel) {
    const player = MusicPlayer.guildMusicPlayers.get(channel.guildId);
    if (player) {
      return player;
    }

    const audioPlayer = createAudioPlayer();
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guildId,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    const musicPlayer = new MusicPlayer(channel.guildId, audioPlayer, connection, new Queue());

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5000);
      connection.subscribe(audioPlayer);
      audioPlayer.on("stateChange", (oldState, newState) => {
        if (oldState.status === AudioPlayerStatus.Playing && newState.status === AudioPlayerStatus.Idle) {
          if (!musicPlayer.queue.isEmpty()) {
            const nextSong = musicPlayer.queue.dequeue()!;
            musicPlayer.play(nextSong);
          } else {
            musicPlayer.destroy();
          }
        }
      });

      MusicPlayer.guildMusicPlayers.set(channel.guildId, musicPlayer);

      return musicPlayer;
    } catch (error) {
      throw new Error(`Error joining voice channel`, { cause: error });
    }
  }

  static getMusicPlayerOfGuild(guildId: string) {
    return MusicPlayer.guildMusicPlayers.get(guildId);
  }

  destroy() {
    this.audioPlayer.stop();
    this.connection.destroy();
    MusicPlayer.guildMusicPlayers.delete(this.guildId);
  }

  addSong(song: Song) {
    this.queue.enqueue(song);
  }

  skip() {
    const song = this.queue.dequeue();
    if (!song) {
      this.destroy();
      return;
    }
    this.play(song);
  }

  play(song: Song) {
    this.audioPlayer.play(song.toAudioResource());
  }

  pause() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing) {
      this.audioPlayer.pause();
    }
  }

  resume() {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      this.audioPlayer.unpause();
    }
  }

  get isPlaying() {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing;
  }
}
