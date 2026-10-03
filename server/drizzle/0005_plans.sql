CREATE TABLE "plan" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"mode" text NOT NULL,
	"category" text NOT NULL,
	"intents" jsonb NOT NULL,
	"venueId" text NOT NULL,
	"alts" jsonb NOT NULL,
	"slots" jsonb NOT NULL,
	"startsAt" timestamp with time zone NOT NULL,
	"flex" boolean NOT NULL,
	"until" text NOT NULL,
	"state" text NOT NULL,
	"ownerId" text NOT NULL,
	"guestId" text,
	"accepted" jsonb NOT NULL,
	"passed" jsonb NOT NULL,
	"suggestedBy" text,
	"expiresAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_anchor" (
	"userId" text PRIMARY KEY NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_guestId_user_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_anchor" ADD CONSTRAINT "plan_anchor_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plan_ownerId_idx" ON "plan" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "plan_guestId_idx" ON "plan" USING btree ("guestId");