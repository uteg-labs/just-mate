CREATE TABLE "venue" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"rating" double precision,
	"opens" text,
	"closes" text,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"modes" jsonb NOT NULL,
	"fits" jsonb NOT NULL,
	"partner" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- curated Kraków venues, formerly hardcoded in src/plans/venues.ts
INSERT INTO "venue" ("id", "name", "kind", "rating", "opens", "closes", "lat", "lng", "modes", "fits") VALUES
	('dvor', 'Vinotéka Dvor', 'wine_bar', 4.7, '16:00', '23:00', 50.059, 19.939, '["date"]', '["wine","dinner","late bar","cocktails"]'),
	('nook', 'Kafé Nook', 'cafe', 4.6, '08:00', '20:00', 50.064, 19.933, '["date","mate"]', '["coffee","brunch","tea","dessert","lunch"]'),
	('meeple', 'Meeple Café', 'board_game_cafe', 4.8, '12:00', '00:00', 50.057, 19.944, '["mate"]', '["board games","cards","chess","coffee","beer"]'),
	('tap', 'Tap Room 9', 'beer_bar', 4.5, '15:00', '01:00', 50.062, 19.941, '["mate"]', '["beer","pub quiz","darts","pool"]'),
	('lumen', 'Kino Lumen', 'cinema', 4.7, '12:00', '23:30', 50.065, 19.926, '["date","mate"]', '["cinema","comedy night","comedy"]'),
	('boulder', 'Boulder Hall Nord', 'climbing_gym', 4.6, '07:00', '22:00', 50.079, 19.935, '["mate"]', '["climbing","gym","yoga"]'),
	('steps', 'River steps', 'riverside', NULL, NULL, NULL, 50.051, 19.936, '["date","mate"]', '["walk","sunset","picnic","running","riverside","park bench","cycling"]'),
	('altitude', 'Altitude', 'rooftop_bar', 4.4, '17:00', '02:00', 50.066, 19.945, '["date"]', '["cocktails","rooftop","wine","dancing"]'),
	('planty', 'Planty Park', 'park', NULL, NULL, NULL, 50.06, 19.933, '["date","mate"]', '["walk","picnic","park bench","running","frisbee"]'),
	('blonia', 'Błonia Meadow', 'park', NULL, NULL, NULL, 50.06, 19.91, '["date","mate"]', '["running","frisbee","football","picnic","cycling","walk","stargazing"]'),
	('strike', 'Strike Lanes', 'bowling', 4.3, '12:00', '00:00', 50.069, 19.915, '["date","mate"]', '["bowling","arcade","pool","darts","video games"]'),
	('noodle', 'Noodle Corner', 'restaurant', 4.6, '12:00', '22:00', 50.05, 19.945, '["date","mate"]', '["ramen","street food","lunch","dinner","pizza"]'),
	('cellar', 'Blue Cellar', 'jazz_club', 4.7, '19:00', '02:00', 50.0615, 19.9375, '["date","mate"]', '["jazz club","jazz bar","live gig","gig","open mic","jam session","concert"]'),
	('arsenal', 'Arsenal Gallery', 'museum', 4.5, '10:00', '18:00', 50.0645, 19.9405, '["date","mate"]', '["exhibition","museum","street art","workshop","talk"]'),
	('corner', 'Corner Café', 'cafe', 4.5, '08:00', '21:00', 50.0675, 19.9125, '["date","mate"]', '["coffee","tea","brunch","dessert","board games","chess"]');
