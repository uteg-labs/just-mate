// Renders half-size stills for quick review: node scripts/stills.mjs Main 0 120 480

import { mkdirSync } from "node:fs"
import path from "node:path"
import { bundle } from "@remotion/bundler"
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer"

mkdirSync("out/stills", { recursive: true })
const [comp, ...frames] = process.argv.slice(2)
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") })
const browser = await openBrowser("chrome", { browserExecutable: process.env.REMOTION_CHROME })
const composition = await selectComposition({ serveUrl, id: comp, puppeteerInstance: browser })
for (const f of frames) {
  await renderStill({
    composition,
    serveUrl,
    frame: Number(f),
    output: `out/stills/${comp}-${String(f).padStart(4, "0")}.png`,
    puppeteerInstance: browser,
    scale: 0.5,
  })
  process.stdout.write(`${f} `)
}
await browser.close({ silent: true })
