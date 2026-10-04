ALTER TABLE "plan" DROP CONSTRAINT "plan_guestId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_guestId_user_id_fk" FOREIGN KEY ("guestId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- one embedding row per user: keep the newest before the constraint
DELETE FROM "profile_embedding" a USING "profile_embedding" b
	WHERE a."userId" = b."userId" AND (a."updatedAt", a."id") < (b."updatedAt", b."id");--> statement-breakpoint
ALTER TABLE "profile_embedding" ADD CONSTRAINT "profile_embedding_userId_unique" UNIQUE("userId");--> statement-breakpoint
-- sport venues, so every sports intent can turn into a plan
INSERT INTO "venue" ("id", "name", "kind", "rating", "opens", "closes", "lat", "lng", "modes", "fits") VALUES
	('court', 'Court Club', 'sports_centre', 4.5, '07:00', '23:00', 50.071, 19.925, '["mate"]', '["padel","tennis","basketball","gym"]'),
	('flow', 'Flow Studio', 'sports_centre', 4.8, '07:00', '21:00', 50.057, 19.945, '["date","mate"]', '["yoga","gym"]'),
	('lido', 'Lido Pool', 'pool', 4.4, '06:00', '22:00', 50.054, 19.928, '["mate"]', '["swim"]');