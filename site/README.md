# JustMate · site

The public web page: the `Main` film as the hero, then one section per use case with its clip (Tomek, Lucía, Ania, Marta, Piotr), the business model, what's real in the demo and a waitlist. EN and PL (`?lang=pl`, or the browser language).

The films are the Remotion compositions from [`video/motion`](../video/motion), played in a `<Player>`: a clip starts muted when scrolled into view, shows the voiceover as captions, and one tap plays it from the start with sound. Only one clip speaks at a time.

```bash
cd site
bun install
bun run dev             # build → dist and serve it locally (the waitlist form needs Vercel)
bun run build           # build only
bun run typecheck
```

- Copy and captions: `src/copy.ts` (EN + PL, team, links). PL captions are keyed like `video/motion/scripts/vo.json`.
- Real app screens under the Plan section: `static/shots/` (from `docs/submission/screens`).
- The build copies `video/motion/public` (screens, badges, audio, font) and the deck and whitepaper PDFs from `docs/submission/`.
- `build.mjs` aliases react and remotion to this folder, so the compositions in `video/motion/src` use the same copy as the Player. `video/motion/node_modules` is not needed.
- Waitlist: `api/waitlist.ts`, a Vercel function that stores `email → {role, city, lang, at}` in the Redis hash `waitlist`.

## Deploy (Vercel)

Import the repo with **Root Directory** `site`. Install, build and output come from `vercel.json`; files outside the root directory must stay included in the build (the Vercel default). Then add **Upstash for Redis** from the Vercel Marketplace to the project so `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set. `SITE_URL` (optional) overrides the absolute URL used for the social card.

Read the list:

```bash
curl -s -H "Authorization: Bearer $KV_REST_API_TOKEN" "$KV_REST_API_URL/hgetall/waitlist"
```
