// Density heatmap: hundreds of soft points stretched along the street grid, accumulated into an alpha field,
// then colour-mapped (paper → glow core → glow → hot) with faint isolines. Never pins, never individual dots.
const HT_CLUSTERS = [
  { x: 0.28, y: 0.30, n: 6 }, { x: 0.72, y: 0.22, n: 3 }, { x: 0.64, y: 0.42, n: 9 }, { x: 0.22, y: 0.52, n: 4 },
  { x: 0.80, y: 0.58, n: 2 }, { x: 0.47, y: 0.17, n: 2 }, { x: 0.48, y: 0.60, n: 3 }, { x: 0.12, y: 0.20, n: 1 },
];
function htRng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function htHex(v, fb) { const s = (v || "").trim().replace("#", ""); if (s.length !== 6) return fb; return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)); }
function htPalette(el) {
  const cs = getComputedStyle(el);
  const core = htHex(cs.getPropertyValue("--glow-core"), [255, 217, 160]);
  const glow = htHex(cs.getPropertyValue("--glow"), [255, 178, 63]);
  const hot = htHex(cs.getPropertyValue("--temp-hot"), [255, 122, 26]);
  const stops = [[0, core, 0], [0.16, core, 0.32], [0.42, glow, 0.62], [0.72, hot, 0.78], [1, hot, 0.92]];
  const out = new Uint8ClampedArray(256 * 4);
  for (let k = 0; k < 256; k++) {
    const t = k / 255;
    let j = 0; while (j < stops.length - 2 && t > stops[j + 1][0]) j++;
    const [t0, c0, a0] = stops[j], [t1, c1, a1] = stops[j + 1];
    const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    for (let ch = 0; ch < 3; ch++) out[k * 4 + ch] = c0[ch] + (c1[ch] - c0[ch]) * f;
    let a = a0 + (a1 - a0) * f;
    if (k > 130 && k % 42 < 2) { a = Math.min(1, a + 0.14); for (let ch = 0; ch < 3; ch++) out[k * 4 + ch] = hot[ch] * 0.92; }
    out[k * 4 + 3] = a * 255;
  }
  return out;
}

function HeatMap({ width, height, visible = true, clusters = HT_CLUSTERS, seed = 7, spread = 1, onZone, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const S = 0.5, W = Math.round(width * S), H = Math.round(height * S);
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, W, H);
    const rnd = htRng(seed * 9973 + 11);
    const angles = [32, -58].map((a) => (a * Math.PI) / 180);
    clusters.forEach((c) => {
      const cx = c.x * W + (rnd() - 0.5) * 10, cy = c.y * H + (rnd() - 0.5) * 10;
      const count = 30 + c.n * 20;
      for (let i = 0; i < count; i++) {
        const ang = angles[(i + (rnd() > 0.7 ? 1 : 0)) % 2] + (rnd() - 0.5) * 0.35;
        const along = (rnd() + rnd() + rnd() - 1.5) * (30 + c.n * 8) * S * 1.05 * spread;
        const across = (rnd() + rnd() - 1) * (7 + c.n * 1.2) * S * 0.95 * spread;
        const px = cx + Math.cos(ang) * along - Math.sin(ang) * across;
        const py = cy + Math.sin(ang) * along + Math.cos(ang) * across;
        const r = (8 + rnd() * 10) * S * spread;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, `rgba(0,0,0,${0.05 + rnd() * 0.04 + c.n * 0.004})`); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2);
      }
    });
    const tmp = document.createElement("canvas"); tmp.width = W; tmp.height = H;
    const tc = tmp.getContext("2d"); tc.filter = "blur(4px)"; tc.drawImage(cv, 0, 0);
    ctx.clearRect(0, 0, W, H); ctx.drawImage(tmp, 0, 0);
    const img = ctx.getImageData(0, 0, W, H), d = img.data, pal = htPalette(cv);
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]; if (!a) continue;
      const k = Math.min(255, (a * 1.1) | 0) * 4;
      d[i] = pal[k]; d[i + 1] = pal[k + 1]; d[i + 2] = pal[k + 2]; d[i + 3] = pal[k + 3];
    }
    ctx.putImageData(img, 0, 0);
  }, [width, height, seed, clusters, spread]);
  const click = (e) => {
    if (!onZone) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * width, y = ((e.clientY - r.top) / r.height) * height;
    let best = null, bd = 1e9;
    clusters.forEach((c) => { const dd = Math.hypot(c.x * width - x, c.y * height - y); if (dd < bd) { bd = dd; best = c; } });
    if (best && bd < 90) onZone(best);
  };
  return (
    <canvas ref={ref} onClick={click} aria-label="where compatible people are, roughly"
      style={{ position: "absolute", left: 0, top: 0, width, height, filter: "blur(5px)", mixBlendMode: "var(--glow-blend)",
        opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.94)", transformOrigin: "50% 42%",
        transition: "opacity var(--dur-default) ease, transform 700ms var(--ease-spring)", pointerEvents: onZone ? "auto" : "none", cursor: onZone ? "pointer" : "default", ...style }} />
  );
}
Object.assign(window, { HeatMap, HT_CLUSTERS });
