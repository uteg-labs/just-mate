// Builds the browser preview into out/preview: `bun run preview:build`, then `bunx serve out/preview`.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { build } from "esbuild"

const out = "out/preview"
rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })
await build({
  entryPoints: ["preview/main.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  target: "es2022",
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: `${out}/preview.js`,
  logLevel: "warning",
})
cpSync("public", out, { recursive: true })
const page = readFileSync("preview/index.html", "utf8")
writeFileSync(`${out}/page.html`, page) // body-only version (claude.ai artifact wraps it)
writeFileSync(
  `${out}/index.html`,
  `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n${page}\n</html>\n`,
)
console.log("preview →", out)
