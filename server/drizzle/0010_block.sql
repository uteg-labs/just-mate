CREATE TABLE "block" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blockerId" text NOT NULL,
	"blockedId" text NOT NULL,
	"reason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_blockerId_user_id_fk" FOREIGN KEY ("blockerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_blockedId_user_id_fk" FOREIGN KEY ("blockedId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "block_blockerId_blockedId_uidx" ON "block" USING btree ("blockerId","blockedId");--> statement-breakpoint
CREATE INDEX "block_blockedId_idx" ON "block" USING btree ("blockedId");