import { TextChannel, type Client } from "discord.js";
import { inArray, sql } from "drizzle-orm";
import { db } from "./db.js";
import * as S from "./schema.js";

/**
 * Registers or updates guild information in the database.
 * This function inserts new guilds or updates existing ones based on the client's cache.
 * @param client The authenticated Discord client
 * @returns An array of inserted or updated guild records
 */
export function syncGuilds(client: Client<true>) {
  const guildsArray = Array.from(client.guilds.cache.values());

  return db
    .insert(S.guilds)
    .values(guildsArray)
    .onConflictDoUpdate({
      target: S.guilds.id,
      set: {
        name: sql`excluded.name`,
      },
    })
    .returning()
    .all();
}

/**
 * Removes text channels from the database that no longer exist in the Discord client.
 * This function compares the registered text channels in the database with the client's cache
 * and deletes any that are not present in the cache.
 * @param client The authenticated Discord client
 * @returns The number of text channels deleted from the database
 */
export function cleanupDeletedTextChannels(client: Client<true>) {
  const registeredTextChannelIds = db
    .select({ id: S.textChannels.id })
    .from(S.textChannels)
    .all()
    .map(textChannel => textChannel.id);

  const deletedTextChannelsIds = registeredTextChannelIds.filter(
    textChannel => !client.channels.cache.has(textChannel),
  );

  let deletedTextChannelsCount = 0;

  if (deletedTextChannelsIds.length > 0) {
    deletedTextChannelsCount = db
      .delete(S.textChannels)
      .where(inArray(S.textChannels.id, deletedTextChannelsIds))
      .returning()
      .all().length;
  }

  return deletedTextChannelsCount;
}

export function setTextChannel(guildId: string, channel: TextChannel) {
  return db
    .insert(S.textChannels)
    .values({
      id: channel.id,
      guildId,
      name: channel.name,
    })
    .onConflictDoUpdate({
      target: S.textChannels.id,
      set: {
        id: channel.id,
        name: channel.name,
      },
    })
    .returning()
    .all()[0];
}
