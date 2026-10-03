ALTER TABLE "user" ADD COLUMN "interests" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "character" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "appearance" text;