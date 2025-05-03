PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cards_table` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`color` text NOT NULL,
	`number` integer,
	`holder` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_cards_table`("id", "type", "color", "number", "holder") SELECT "id", "type", "color", "number", "holder" FROM `cards_table`;--> statement-breakpoint
DROP TABLE `cards_table`;--> statement-breakpoint
ALTER TABLE `__new_cards_table` RENAME TO `cards_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;