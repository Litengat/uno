CREATE TABLE `cards_table` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`color` text NOT NULL,
	`number` integer,
	`holder` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `game_table` (
	`id` integer PRIMARY KEY NOT NULL,
	`direction` integer DEFAULT 1 NOT NULL,
	`currentPlayerIndex` integer DEFAULT 0 NOT NULL,
	`startCardCount` integer DEFAULT 7
);
--> statement-breakpoint
CREATE TABLE `players_table` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`isHost` integer DEFAULT false,
	`isReady` integer DEFAULT false
);
