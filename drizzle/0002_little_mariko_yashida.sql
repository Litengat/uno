CREATE TABLE `cards_table` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`color` text NOT NULL,
	`number` integer,
	`holder` text NOT NULL,
	FOREIGN KEY (`holder`) REFERENCES `players_table`(`id`) ON UPDATE no action ON DELETE no action
);
