ALTER TABLE "user_match_score" ADD COLUMN "mode" text DEFAULT 'date' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_match_score" ALTER COLUMN "mode" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_match_score" DROP CONSTRAINT "user_match_score_userAId_userBId_pk";--> statement-breakpoint
ALTER TABLE "user_match_score" ADD CONSTRAINT "user_match_score_userAId_userBId_mode_pk" PRIMARY KEY("userAId","userBId","mode");
