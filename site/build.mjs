// Builds the site into dist: `bun run build`, then `bunx serve dist` (or `bun run dev` for both).
// The films are the Remotion compositions in ../video/motion; their public assets and the submission PDFs are copied in.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { build } from "esbuild"

const out = "dist"
const motion = "../video/motion"
// canonical, hreflang and og:url always name the production origin, previews included
const host =
  process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "just-mate-site.vercel.app"
const origin = host.startsWith("http") ? host : `https://${host}`
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

// prerender each language into its own page, so the html as served carries the content
const ssr = `${out}/prerender.mjs`
await build({
  entryPoints: ["src/prerender.tsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  jsx: "automatic",
  packages: "external",
  // the tsconfig paths would pull react and remotion into the bundle; node resolves them instead
  tsconfigRaw: "{}",
  loader: { ".css": "empty" },
  // the films' font loads in the browser; at build time it has no url to fetch
  plugins: [
    {
      name: "no-fonts",
      setup(b) {
        b.onResolve({ filter: /^@remotion\/fonts$/ }, () => ({ path: "fonts", namespace: "stub" }))
        b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
          contents: "export const loadFont = () => Promise.resolve()",
        }))
      },
    },
  ],
  outfile: ssr,
  logLevel: "warning",
})
const { page, pages } = await import(`./${ssr}`)
const template = readFileSync("static/index.html", "utf8")
for (const { lang, file } of pages) writeFileSync(`${out}/${file}`, page(lang, origin, template))
rmSync(ssr)

for (const f of docs) {
  const from = `../docs/submission/${f}`
  if (existsSync(from)) cpSync(from, `${out}/${f}`)
  else console.warn(`missing ${from}: the ${f} link will 404`)
}
console.log("site →", out)
