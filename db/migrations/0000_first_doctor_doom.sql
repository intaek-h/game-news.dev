-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `raw_topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topics` text,
	`gen_time` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`article` text,
	`topic` text,
	`gen_time` text NOT NULL,
	`citations` text,
	`created_at` text NOT NULL,
	`updated_at` text,
	`thumnail` text
);

*/