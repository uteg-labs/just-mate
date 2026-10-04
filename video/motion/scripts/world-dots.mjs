// Builds the dot-grid world map used in the stats scene (run once: node scripts/world-dots.mjs).
import { readFileSync, writeFileSync } from "node:fs"
import { geoContains, geoEqualEarth } from "d3-geo"
import { feature } from "topojson-client"

const topo = JSON.parse(
  readFileSync(new URL("../node_modules/world-atlas/land-110m.json", import.meta.url)),
)
const land = feature(topo, topo.objects.land)
const W = 1600
const H = 780
const proj = geoEqualEarth().fitExtent(
  [
    [0, 0],
    [W, H],
  ],
  { type: "Sphere" },
)
const STEP = 14
const dots = []
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const ll = proj.invert([x, y])
    if (ll && ll[1] > -58 && geoContains(land, ll)) dots.push([Math.round(x), Math.round(y)])
  }
}
writeFileSync(
  new URL("../src/data/world-dots.json", import.meta.url),
  JSON.stringify({ w: W, h: H, step: STEP, dots }),
)
console.log(dots.length, "dots")
