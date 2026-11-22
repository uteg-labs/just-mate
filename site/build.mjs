// Builds the site into dist: `bun run build`, then `bunx serve dist` (or `bun run dev` for both).
// The films are the Remotion compositions in ../video/motion; their public assets and the submission PDFs are copied in.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
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

// the footer and the legal pages are rendered to plain HTML here, so they are in the served page
const analytics = '<script defer src="/_vercel/insights/script.js"></script>'
const prerender = `${out}/prerender.mjs`
await build({
  entryPoints: ["src/prerender.tsx"],
  bundle: true,
  format: "esm",
  platform: "node",
  jsx: "automatic",
  packages: "external",
  outfile: prerender,
  logLevel: "warning",
})
const { allPages, footerHtml, pageHtml } = await import(`./${prerender}`)
rmSync(prerender)
writeFileSync(
  `${out}/index.html`,
  readFileSync("static/index.html", "utf8")
    .replaceAll("%ORIGIN%", origin)
    .replace("%FOOT%", footerHtml("en"))
    .replace("%ANALYTICS%", analytics),
)
for (const { lang, page } of allPages) {
  const file = `${out}/${lang === "pl" ? "pl/" : ""}${page}.html`
  mkdirSync(`${out}/pl`, { recursive: true })
  writeFileSync(file, pageHtml(lang, page, origin, analytics))
}
const urls = [
  "/",
  ...allPages.map(({ lang, page }) => (lang === "pl" ? `/pl/${page}` : `/${page}`)),
]
writeFileSync(
  `${out}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${origin}${u}</loc></url>`).join("\n")}\n</urlset>\n`,
)
writeFileSync(`${out}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
for (const f of docs) {
  const from = `../docs/submission/${f}`
  if (existsSync(from)) cpSync(from, `${out}/${f}`)
  else console.warn(`missing ${from}: the ${f} link will 404`)
}
console.log("site →", out)
