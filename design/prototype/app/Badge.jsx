// 3D lanyard badge for vibe lines. Drops in on a strap, tilts toward the pointer, swings when dragged.
const BD_NS = window.JustMateDesignSystem_dee067;
const BD_NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
const BD_TONES = { mint: ["var(--self)", "var(--glow)", "var(--glow-core)"], amber: ["var(--glow)", "var(--temp-hot)", "var(--glow-core)"] };
const BD_METAL = "linear-gradient(90deg, color-mix(in oklab, var(--jm-ink), white 26%), var(--jm-ink) 55%, color-mix(in oklab, var(--jm-ink), white 14%))";

// Deterministic badge design from what the user picked: palette from interests, blob layout + pattern from answers.
const BD_PALETTE = { amber: "var(--glow)", cream: "var(--glow-core)", mint: "var(--self)", sky: "var(--temp-cold)", ember: "var(--temp-hot)", iris: "var(--focus-ring)" };
const BD_TONE_OF = { coffee: "amber", wine: "ember", cinema: "iris", books: "cream", travel: "sky", cooking: "ember", hiking: "mint", techno: "iris", jazz: "amber", art: "iris", dogs: "cream", yoga: "mint", photography: "sky", "street food": "ember",
  "board games": "amber", climbing: "mint", running: "sky", gym: "ember", football: "mint", padel: "sky", gaming: "iris", "pub quiz": "amber", cycling: "sky", concerts: "iris", coding: "iris", chess: "cream" };
const BD_ICON_OF = { coffee: "coffee", wine: "wine", cinema: "film", travel: "map", cooking: "utensils", hiking: "mountain", techno: "music", jazz: "music", art: "palette", dogs: "footprints", yoga: "sun", photography: "camera", "street food": "utensils",
  "board games": "dice-5", climbing: "mountain", running: "footprints", gym: "dumbbell", gaming: "gamepad-2", cycling: "bike", concerts: "ticket", chess: "dice-5", "film cameras": "camera", "pub quiz": "sparkles" };
const BD_PATTERNS = ["dots", "lines", "rings", "grid", "none"];
const bdHash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; };
function jmBadgeDesign({ interests = [], qa = [], mode = "date", seed = "" }) {
  const h = bdHash(interests.join("|") + "#" + qa.map((x) => x.a).join("|") + "#" + seed);
  const r = (k, n) => ((h >>> (k * 3)) ^ (h >>> 17)) % n;
  const keys = Object.keys(BD_PALETTE);
  const tones = [];
  interests.forEach((i, k) => { const t = BD_TONE_OF[i] || keys[bdHash(i) % keys.length]; if (!tones.includes(t)) tones.push(t); });
  let k = 0; while (tones.length < 3) { const t = keys[(r(k, keys.length) + k) % keys.length]; if (!tones.includes(t)) tones.push(t); k++; }
  return {
    colors: tones.slice(0, 3).map((t) => BD_PALETTE[t]),
    blobs: [[14 + r(1, 22), 18 + r(2, 22)], [64 + r(3, 26), 4 + r(4, 20)], [36 + r(5, 28), 42 + r(6, 18)]],
    pattern: BD_PATTERNS[qa.length ? r(7, BD_PATTERNS.length) : 4],
    angle: [35, 60, 120, 145][r(8, 4)],
    icon: interests.map((i) => BD_ICON_OF[i]).find(Boolean) || "sparkle",
    tags: interests.slice(0, 3),
    serial: String(h % 10000).padStart(4, "0"),
    mode,
  };
}
const bdPattern = (d) => {
  const w = "rgb(255 255 255 / .42)";
  if (d.pattern === "dots") return `radial-gradient(circle, ${w} 1px, transparent 1.6px) 0 0 / 9px 9px`;
  if (d.pattern === "lines") return `repeating-linear-gradient(${d.angle}deg, ${w} 0 1px, transparent 1px 7px)`;
  if (d.pattern === "rings") return `repeating-radial-gradient(circle at ${d.blobs[0][0]}% ${d.blobs[0][1]}%, ${w} 0 1px, transparent 1px 11px)`;
  if (d.pattern === "grid") return `linear-gradient(${w} 1px, transparent 1px) 0 0 / 14px 14px, linear-gradient(90deg, ${w} 1px, transparent 1px) 0 0 / 14px 14px`;
  return "none";
};

function VibeBadge({ design, lifted = false, eyebrow, quote, name, tag = "verified", tone = "mint", width = 240, strap = 120, turnKey, dim = false, fadeStrap = true }) {
  const { Icon } = BD_NS;
  const h = Math.round(width * 1.38);
  const holeY = 26;
  const ref = React.useRef(null);
  const drag = React.useRef(null);
  const [pt, setPt] = React.useState(null);
  const [swing, setSwing] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [a, b, c] = design ? design.colors : BD_TONES[tone] || BD_TONES.mint;
  const bl = design ? design.blobs : [[22, 30], [86, 8], [55, 55]];
  const move = (e) => {
    const r = ref.current.getBoundingClientRect();
    const s = r.width / width || 1;
    setPt({ x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) });
    if (drag.current != null) setSwing(Math.max(-24, Math.min(24, ((e.clientX - drag.current) / s) * 0.14)));
  };
  const down = (e) => { drag.current = e.clientX; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); };
  const up = () => { drag.current = null; setDragging(false); setSwing(0); };
  const rx = pt ? (0.5 - pt.y) * 16 : 0, ry = pt ? (pt.x - 0.5) * 22 : 0;
  const hole = `radial-gradient(circle 11px at 50% ${holeY}px, transparent 10.5px, #000 11.5px)`;
  const masked = { WebkitMaskImage: hole, maskImage: hole };
  const fill = { position: "absolute", inset: 0, borderRadius: 20 };
  const small = width < 240;
  return (
    <div className="light" style={{ background: "transparent", display: "flex", justifyContent: "center", userSelect: "none" }}>
      <div style={{ transform: lifted ? "translateY(-130%)" : "none", transition: lifted ? "transform 420ms cubic-bezier(.5,0,.75,0)" : "none" }}>
      <div key={turnKey} style={{ animation: "badge-drop 1300ms ease-out both", transformOrigin: "50% 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", transform: `rotate(${swing}deg)`, transformOrigin: "50% 0",
          transition: dragging ? "transform 60ms linear" : "transform 1100ms var(--ease-momentum)" }}>
          <div style={{ width: 40, height: strap, position: "relative",
            background: `repeating-linear-gradient(45deg, rgb(255 255 255 / .38) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgb(0 0 0 / .05) 0 1px, transparent 1px 3px), linear-gradient(180deg, var(--surface-chip) 0%, color-mix(in oklab, ${a} 34%, var(--surface-chip)) 45%, color-mix(in oklab, ${c} 60%, var(--surface-chip)) 80%, var(--surface-chip))`,
            boxShadow: "inset 3px 0 4px -2px rgb(0 0 0 / .14), inset -3px 0 4px -2px rgb(0 0 0 / .14)",
            WebkitMaskImage: fadeStrap ? "linear-gradient(transparent, #000 40px)" : "none", maskImage: fadeStrap ? "linear-gradient(transparent, #000 40px)" : "none" }}>
            <span style={{ position: "absolute", bottom: 20, left: "50%", width: 12, height: 12, marginLeft: -6, borderRadius: 999, background: "var(--background)", boxShadow: "inset 0 1px 2px rgb(0 0 0 / .35), 0 0 0 2px color-mix(in oklab, var(--surface-chip), white 50%)" }} />
          </div>
          <div style={{ position: "relative", zIndex: 2, width: 60, height: 96, marginTop: -6, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
            <span style={{ width: 46, height: 24, borderRadius: "7px 7px 13px 13px", border: "4px solid var(--jm-ink)", boxSizing: "border-box", boxShadow: "inset 0 1px 0 rgb(255 255 255 / .16), 0 1px 0 rgb(255 255 255 / .12)" }} />
            <span style={{ width: 14, height: 10, marginTop: -2, borderRadius: 3, background: BD_METAL }} />
            <span style={{ position: "relative", width: 30, height: 46, borderRadius: "12px 12px 9px 15px", background: BD_METAL, boxShadow: "inset 0 1px 0 rgb(255 255 255 / .2), 0 6px 10px -4px rgb(0 0 0 / .4)" }}>
              <span style={{ position: "absolute", left: 7, top: 10, bottom: 8, width: 2, borderRadius: 2, background: "rgb(255 255 255 / .14)" }} />
            </span>
            <span style={{ width: 11, height: 22, marginTop: -4, borderRadius: "0 0 6px 6px", background: BD_METAL }} />
          </div>
          <div ref={ref} onPointerMove={move} onPointerLeave={() => drag.current == null && setPt(null)} onPointerDown={down} onPointerUp={up} onPointerCancel={up}
            style={{ position: "relative", zIndex: 1, width, height: h, marginTop: -30, cursor: dragging ? "grabbing" : "grab", touchAction: "none",
              transformStyle: "preserve-3d", transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`, transformOrigin: `50% ${holeY}px`,
              transition: pt && !dragging ? "transform 120ms ease-out" : "transform 700ms var(--ease-spring)" }}>
            <div style={{ ...fill, transformStyle: "preserve-3d" }}>
              <div style={{ ...fill, boxShadow: "0 34px 50px -22px rgb(0 0 0 / .38), 0 10px 20px -10px rgb(0 0 0 / .2)", transform: "translateZ(-4px)" }} />
              <div style={{ ...fill, ...masked, background: "color-mix(in oklab, var(--surface-chip), black 16%)", transform: "translateZ(-3px)" }} />
              <div style={{ ...fill, ...masked, overflow: "hidden", background: "var(--surface-chip)", boxShadow: "inset 0 1px 0 rgb(255 255 255 / .8), inset 0 0 0 1px rgb(0 0 0 / .05)", opacity: dim ? 0.55 : 1, transition: "opacity var(--dur-fade) ease" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "60%",
                  background: `radial-gradient(70% 60% at ${bl[0][0]}% ${bl[0][1]}%, color-mix(in oklab, ${a} 85%, white), transparent 72%), radial-gradient(60% 55% at ${bl[1][0]}% ${bl[1][1]}%, color-mix(in oklab, ${b} 75%, white), transparent 70%), radial-gradient(90% 70% at ${bl[2][0]}% ${bl[2][1]}%, color-mix(in oklab, ${c} 90%, white), transparent 75%)`,
                  WebkitMaskImage: "linear-gradient(#000 45%, transparent)", maskImage: "linear-gradient(#000 45%, transparent)", transition: "background 600ms ease" }} />
                {design && design.pattern !== "none" && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "52%", background: bdPattern(design), WebkitMaskImage: "linear-gradient(#000 30%, transparent)", maskImage: "linear-gradient(#000 30%, transparent)" }} />}
                <div style={{ position: "absolute", inset: 0, backgroundImage: BD_NOISE, opacity: 0.22, mixBlendMode: "multiply" }} />
                <div style={{ position: "absolute", inset: 0, opacity: pt ? 1 : 0, transition: "opacity var(--dur-default) ease", mixBlendMode: "soft-light",
                  background: pt ? `radial-gradient(circle at ${pt.x * 100}% ${pt.y * 100}%, rgb(255 255 255 / .9), transparent 50%)` : "none" }} />
                <div style={{ position: "absolute", top: 22, left: 20, display: "flex", alignItems: "center", color: "var(--surface-card)" }}>
                  <span style={{ width: 26, height: 1.5, borderRadius: 2, background: "currentColor", opacity: 0.9 }} />
                  {design && design.icon !== "sparkle" ? <Icon name={design.icon} size={15} strokeWidth={2} style={{ marginLeft: 4 }} /> : <Icon name="sparkle" size={14} strokeWidth={2} style={{ fill: "currentColor", marginLeft: -2 }} />}
                </div>
                {design && !(small && name) && <span className="t-mono tabular" style={{ position: "absolute", top: 22, right: 20, color: "var(--surface-card)", opacity: 0.95 }}>no. {design.serial}</span>}
                <div style={{ position: "absolute", left: 20, right: 20, top: "46%", bottom: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div className="t-mono" style={{ color: "var(--fg-2)" }}>{eyebrow}</div>
                    {name ? <div style={{ marginTop: 6, fontSize: small ? 20 : 26, lineHeight: small ? "24px" : "30px", letterSpacing: "0.2px", textTransform: "uppercase", fontWeight: 450, fontVariationSettings: "var(--fw-medium)", color: "var(--fg-1)" }}>{name}</div> : <p style={{ margin: "8px 0 0", fontSize: small ? 17 : 19, lineHeight: small ? "23px" : "25px", letterSpacing: "-0.2px", fontStyle: "italic", fontWeight: 500, fontVariationSettings: "var(--fw-medium)", color: "var(--fg-1)", textWrap: "pretty" }}>“{quote}”</p>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {design && !name && design.tags.length > 0 && <div className="t-mono" style={{ color: "var(--fg-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{design.tags.join(" · ")}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <span style={{ fontSize: small ? 15 : 17, lineHeight: "20px", fontWeight: 700, fontVariationSettings: "var(--fw-bold)", letterSpacing: "-0.6px", color: "var(--fg-1)" }}>JustMate</span>
                    {!(name && small) && <span className="t-mono" style={{ color: "var(--fg-2)", display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="shield-check" size={12} strokeWidth={2} />{tag}</span>}
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
Object.assign(window, { VibeBadge, jmBadgeDesign });
