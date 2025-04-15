CREATE TABLE `point_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `point_limits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action_type` text NOT NULL,
	`limit` integer NOT NULL,
	`period` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `point_multipliers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action_type` text NOT NULL,
	`multiplier` integer DEFAULT 1 NOT NULL,
	`start_date` integer,
	`end_date` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `post_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`value` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `point_transactions` ALTER COLUMN "reference_id" TO "reference_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `point_transactions` ADD `category_id` integer REFERENCES point_categories(id);--> statement-breakpoint
ALTER TABLE `point_transactions` ADD `multiplier_id` integer REFERENCES point_multipliers(id);--> statement-breakpoint
ALTER TABLE `posts` ALTER COLUMN "content" TO "content" text;--> statement-breakpoint
ALTER TABLE `posts` ALTER COLUMN "url" TO "url" text;--> statement-breakpoint
ALTER TABLE `posts` ALTER COLUMN "url_host" TO "url_host" text;--> statement-breakpoint
ALTER TABLE `posts` ADD `user_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `posts` ADD `post_type` text NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `content_type` text NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `gossip_id` integer REFERENCES gossips(id);--> statement-breakpoint
ALTER TABLE `user_points` ADD `category_id` integer REFERENCES point_categories(id);