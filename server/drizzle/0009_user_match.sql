CREATE TABLE "user_match" (
	"id" text PRIMARY KEY NOT NULL,
	"userAId" text NOT NULL,
	"userBId" text NOT NULL,
	"sessionId" text,
	"mode" text NOT NULL,
	"category" text NOT NULL,
	"intent" text NOT NULL,
	"compatibilityScore" double precision NOT NULL,
	"rankingScore" double precision NOT NULL,
	"algorithmVersion" text NOT NULL,
	"state" text DEFAULT 'offered' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"startedAt" timestamp with time zone,
	"endedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_match_score" (
	"userAId" text NOT NULL,
	"userBId" text NOT NULL,
	"scoreAToB" double precision NOT NULL,
	"scoreBToA" double precision NOT NULL,
	"score" double precision NOT NULL,
	"algorithmVersion" text NOT NULL,
	"calculatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_match_score_userAId_userBId_pk" PRIMARY KEY("userAId","userBId")
);
--> statement-breakpoint
ALTER TABLE "user_match" ADD CONSTRAINT "user_match_userAId_user_id_fk" FOREIGN KEY ("userAId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_match" ADD CONSTRAINT "user_match_userBId_user_id_fk" FOREIGN KEY ("userBId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_match_score" ADD CONSTRAINT "user_match_score_userAId_user_id_fk" FOREIGN KEY ("userAId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_match_score" ADD CONSTRAINT "user_match_score_userBId_user_id_fk" FOREIGN KEY ("userBId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_match_userAId_createdAt_idx" ON "user_match" USING btree ("userAId","createdAt");--> statement-breakpoint
CREATE INDEX "user_match_userBId_createdAt_idx" ON "user_match" USING btree ("userBId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "user_match_sessionId_uidx" ON "user_match" USING btree ("sessionId");--> statement-breakpoint
CREATE INDEX "user_match_score_userBId_idx" ON "user_match_score" USING btree ("userBId");
