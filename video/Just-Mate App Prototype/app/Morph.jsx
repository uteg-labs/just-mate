// One continuous surface that morphs between shapes (sheet → island → card → fullscreen), dynamic-island style.
// Geometry springs; content layers cross-fade with a slight blur + scale so nothing reflows mid-morph.
const JM_SHAPES = {
  auth: { k: "sheet", tone: "paper" }, select: { k: "sheet", tone: "paper" },
  onboard: { k: "full", tone: "page" }, settings: { k: "full", tone: "page" },
  search: { k: "sheet", tone: "paper" }, match: { k: "card", tone: "ink" },
  compass: { k: "full", tone: "night" }, postmeet: { k: "full", tone: "night" },
};
const JM_TONES = {
  paper: { bg: "var(--material-thick)", blur: true, shadow: "inset 0 1px 0 0 var(--hairline-top), var(--shadow-6)", scope: "light" },
  page: { bg: "var(--background)", shadow: "none", scope: "light" },
  ink: { bg: "#000", shadow: "var(--shadow-8)", scope: "dark" },
  night: { bg: "var(--jm-ink)", shadow: "none", scope: "dark" },
};
const JM_ISLAND_W = 230;

function jmGeom(name, h) {
  const k = JM_SHAPES[name].k;
  if (k === "sheet") return { left: 8, top: JM_PH - 8 - h, width: JM_PW - 16, height: h, r: 40 };
  if (k === "card") return { left: 8, top: 11, width: JM_PW - 16, height: h, r: 40 };
  if (k === "island") return { left: (JM_PW - JM_ISLAND_W) / 2, top: 11, width: JM_ISLAND_W, height: 37, r: 18.5 };
  return { left: 0, top: 0, width: JM_PW, height: JM_PH, r: 48 };
}

function MorphLayer({ name, active, dur, render, onHeight }) {
  const ref = React.useRef(null);
  const [entered, setEntered] = React.useState(false);
  const k = JM_SHAPES[name].k;
  const auto = k === "sheet" || k === "card";
  const g = jmGeom(name, 0);
  React.useLayoutEffect(() => {
    if (!auto) return;
    const el = ref.current;
    onHeight(name, el.offsetHeight);
    const ro = new ResizeObserver(() => onHeight(name, el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  React.useEffect(() => {
    let r2; const r = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setEntered(true)); });
    const t = setTimeout(() => setEntered(true), 60);
    return () => { cancelAnimationFrame(r); cancelAnimationFrame(r2); clearTimeout(t); };
  }, []);
  const on = active && entered;
  const E = "var(--ease-spring)";
  return (
    <div ref={ref} className={JM_TONES[JM_SHAPES[name].tone].scope} aria-hidden={!active}
      style={{ position: "absolute", top: 0, left: "50%", width: g.width, marginLeft: -g.width / 2, height: auto ? "auto" : g.height,
        background: "transparent", color: "var(--fg-1)", fontFamily: "var(--font-sans)",
        opacity: on ? 1 : 0, transform: on ? "none" : "scale(0.94)", filter: on ? "none" : "blur(6px)", transformOrigin: "50% 0",
        transition: on
          ? `opacity ${dur * 0.5}ms ease ${dur * 0.28}ms, transform ${dur}ms ${E}, filter ${dur * 0.5}ms ease ${dur * 0.28}ms`
          : `opacity ${dur * 0.22}ms ease, transform ${dur * 0.5}ms ${E}, filter ${dur * 0.22}ms ease`,
        pointerEvents: active ? "auto" : "none" }}>
      {render(name)}
    </div>
  );
}

function Morph({ shape, render, dur = 520, onClick }) {
  const [heights, setHeights] = React.useState({});
  const [layers, setLayers] = React.useState([shape]);
  const [animate, setAnimate] = React.useState(false);
  const cur = React.useRef(shape);
  React.useEffect(() => { const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true))); return () => cancelAnimationFrame(r); }, []);
  React.useLayoutEffect(() => {
    if (cur.current === shape) return;
    cur.current = shape;
    setLayers((ls) => (ls.includes(shape) ? ls : [...ls, shape]));
    const t = setTimeout(() => setLayers((ls) => ls.filter((s) => s === cur.current)), dur + 120);
    return () => clearTimeout(t);
  }, [shape, dur]);
  const onHeight = React.useCallback((n, h) => setHeights((p) => (p[n] === h ? p : { ...p, [n]: h })), []);
  const g = jmGeom(shape, heights[shape] || 320);
  const tone = JM_TONES[JM_SHAPES[shape].tone];
  const E = "var(--ease-spring)";
  const tr = animate
    ? ["left", "top", "width", "height", "border-radius"].map((p) => `${p} ${dur}ms ${E}`).concat([`background-color ${dur * 0.6}ms ease`, `box-shadow ${dur}ms ease`]).join(", ")
    : "none";
  return (
    <div onClick={onClick} data-shape={shape}
      style={{ position: "absolute", zIndex: 20, left: g.left, top: g.top, width: g.width, height: g.height, borderRadius: g.r, overflow: "hidden",
        background: tone.bg, backdropFilter: tone.blur ? "var(--blur-thick)" : "none", WebkitBackdropFilter: tone.blur ? "var(--blur-thick)" : "none",
        boxShadow: tone.shadow, transition: tr, cursor: onClick ? "pointer" : "default" }}>
      {layers.map((n) => <MorphLayer key={n} name={n} active={n === shape} dur={dur} render={render} onHeight={onHeight} />)}
    </div>
  );
}
Object.assign(window, { Morph, JM_SHAPES, jmGeom });
