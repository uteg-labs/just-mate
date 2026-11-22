// Builds the site into dist: `bun run build`, then `bunx serve dist` (or `bun run dev` for both).
// The films are the Remotion compositions in ../video/motion; their public assets and the submission PDFs are copied in.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { build } from "esbuild"

const out = "dist"
const motion = "../video/motion"
const host = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? ""
const origin = host && !host.startsWith("http") ? `https://${host}` : host
const docs = ["JustMate-Deck.pdf", "JustMate-Whitepaper.pdf"]

// aliased imports resolve from this folder, so ../video/motion/src shares our one react and remotion
const shared = ["react", "react-dom", "remotion", "@remotion/fonts", "@remotion/player"]

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
// the poll (/poll, rewritten in vercel.json) is its own bundle so site.js stays as it is
const bundles = { site: "src/main.tsx", poll: "src/poll.tsx" }
for (const [name, entry] of Object.entries(bundles)) {
  await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    format: "iife",
    jsx: "automatic",
    target: "es2022",
    alias: Object.fromEntries(shared.map((p) => [p, p])),
    define: { "process.env.NODE_ENV": '"production"' },
    outfile: `${out}/${name}.js`,
    logLevel: "warning",
  })
}
cpSync(`${motion}/public`, out, { recursive: true })
cpSync("static", out, { recursive: true })
writeFileSync(
  `${out}/index.html`,
  readFileSync("static/index.html", "utf8").replaceAll("%ORIGIN%", origin),
)

const site = origin || "https://just-mate-site.vercel.app"
const expires = new Date()
expires.setUTCMonth(expires.getUTCMonth() + 11)
const today = new Date().toISOString().slice(0, 10)
const files = {
  "robots.txt": `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`,
  "sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
  "llms.txt": `# JustMate

> JustMate ("Meet for real") is an app that gets lonely people out of the door and in front of someone compatible: a small plan near you with one person, or a walk to someone nearby right now. No faces, no chat. Built by a team at HackYeah 2026. The site is in English and Polish (add ?lang=pl).

## Pages

- [Home](${site}/): the film, use-case clips, app screens and the waitlist

## Source

- [Source code and docs](https://github.com/uteg-labs/just-mate): the monorepo with the app, server, matching model and this site
- [Deck](${site}/JustMate-Deck.pdf): the HackYeah 2026 submission deck
- [Whitepaper](${site}/JustMate-Whitepaper.pdf): how the product and matching work
`,
  ".well-known/security.txt": `Contact: https://github.com/uteg-labs/just-mate/security/advisories/new\nExpires: ${expires.toISOString()}\nPreferred-Languages: en, pl\nCanonical: ${site}/.well-known/security.txt\n`,
}
for (const [name, body] of Object.entries(files)) {
  mkdirSync(dirname(`${out}/${name}`), { recursive: true })
  writeFileSync(`${out}/${name}`, body)
}
for (const f of docs) {
  const from = `../docs/submission/${f}`
  if (existsSync(from)) cpSync(from, `${out}/${f}`)
  else console.warn(`missing ${from}: the ${f} link will 404`)
}
console.log("site →", out)
