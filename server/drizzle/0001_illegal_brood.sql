CREATE TABLE "profile" (
	"userId" text PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"age" integer NOT NULL,
	"interests" text[] NOT NULL,
	"qa" jsonb NOT NULL,
	"vibe" text NOT NULL,
	"date" jsonb NOT NULL,
	"mate" jsonb NOT NULL,
	"adult" boolean NOT NULL,
	"verified" boolean NOT NULL,
	"taste" double precision NOT NULL,
	"settings" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;