CREATE TABLE `game_table` (
	`id` integer PRIMARY KEY NOT NULL,
	`direction` integer DEFAULT 1 NOT NULL,
	`currentPlayerIndex` integer DEFAULT 0 NOT NULL,
	`startCardCount` integer DEFAULT 7
);
