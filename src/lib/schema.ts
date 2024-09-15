import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const guilds = sqliteTable("guilds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const textChannels = sqliteTable("text_channels", {
  id: text("id").primaryKey(),
  guildId: text("guild_id")
    .unique()
    .notNull()
    .references(() => guilds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const songs = sqliteTable("songs", {
  videoId: text("video_id").primaryKey(),
  title: text("title").notNull(),
  channelName: text("channel_name").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
});
