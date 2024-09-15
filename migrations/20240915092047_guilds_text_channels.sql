CREATE TABLE `guilds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `text_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `text_channels_guild_id_unique` ON `text_channels` (`guild_id`);