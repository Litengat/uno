DROP TABLE `users_table`;--> statement-breakpoint
ALTER TABLE `players_table` ADD `position` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `players_table` ADD `isHost` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `players_table` ADD `isReady` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `players_table` ADD `isTurn` integer DEFAULT false;