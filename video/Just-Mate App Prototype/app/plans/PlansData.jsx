// Plans: data (places, seed plans), date helpers, and the shared map + marker + pressable primitives.
const PD_NS = window.JustMateDesignSystem_dee067;
const PL_SELF = { x: 0.5, y: 0.56 };
const PL_PLACES = [
  { id: "dvor", modes: ["date"], why: "quiet courtyard, two-seat tables", name: "Vinotéka Dvor", kind: "wine bar", icon: "wine", rating: 4.7, hours: "open till 23:00", walk: 9, x: 0.30, y: 0.30, fits: ["wine", "dinner", "late bar", "cocktails"] },
  { id: "nook", modes: ["date","mate"], why: "slow mornings, big windows", name: "Kafé Nook", kind: "café", icon: "coffee", rating: 4.6, hours: "open till 20:00", walk: 5, x: 0.68, y: 0.38, fits: ["coffee", "brunch", "tea", "dessert", "lunch"] },
  { id: "meeple", modes: ["mate"], why: "300 games, staff who teach them", name: "Meeple Café", kind: "board-game café", icon: "dice-5", rating: 4.8, hours: "open till 00:00", walk: 7, x: 0.20, y: 0.64, fits: ["board games", "cards", "chess", "coffee", "beer"] },
  { id: "tap", modes: ["mate"], why: "pub quiz on thursdays", name: "Tap Room 9", kind: "craft beer bar", icon: "beer", rating: 4.5, hours: "open till 01:00", walk: 6, x: 0.76, y: 0.70, fits: ["beer", "pub quiz", "darts", "pool", "late bar"] },
  { id: "lumen", modes: ["date"], why: "late screenings, tiny bar", name: "Kino Lumen", kind: "arthouse cinema", icon: "film", rating: 4.7, hours: "screenings till 22:30", walk: 11, x: 0.44, y: 0.13, fits: ["cinema", "comedy night"] },
  { id: "boulder", modes: ["mate"], why: "beginner walls till 22:00", name: "Boulder Hall Nord", kind: "climbing gym", icon: "mountain", rating: 4.6, hours: "open till 22:00", walk: 14, x: 0.86, y: 0.25, fits: ["climbing", "gym"] },
  { id: "steps", modes: ["date","mate"], why: "sunset side of the river", name: "River steps", kind: "riverside", icon: "trees", rating: null, hours: "always open", walk: 8, x: 0.42, y: 0.86, fits: ["walk", "sunset", "picnic", "running", "riverside", "park bench"] },
  { id: "altitude", modes: ["date"], why: "rooftop with the whole city", name: "Altitude", kind: "rooftop bar", icon: "martini", rating: 4.4, hours: "open till 02:00", walk: 12, x: 0.12, y: 0.40, fits: ["cocktails", "rooftop", "wine", "dancing"] },
];
const plPlace = (id) => PL_PLACES.find((p) => p.id === id);
const plFits = (place, intents) => (intents || []).some((i) => place.fits.includes(i));
const plSpotWalk = (x, y) => Math.max(2, Math.round(Math.hypot(x - PL_SELF.x, (y - PL_SELF.y) * 1.3) * 26));

const PL_WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PL_WDL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PL_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const plDate = (off) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
const plDayWord = (off) => (off === 0 ? "today" : off === 1 ? "tomorrow" : PL_WDL[plDate(off).getDay()]);
const plDayChip = (off) => (off === 0 ? "today" : off === 1 ? "tomorrow" : `${PL_WD[plDate(off).getDay()].toLowerCase()} ${plDate(off).getDate()}`);
const plDateMono = (off) => { const d = plDate(off); return `${PL_WD[d.getDay()]} ${d.getDate()} ${PL_MON[d.getMonth()]}`.toLowerCase(); };
const plMinus = (t, m) => { const [h, mm] = t.split(":").map(Number); const v = h * 60 + mm - m; return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`; };
const plCap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const plSlots = (p) => (p.slots && p.slots.length ? p.slots : [{ day: p.day, time: p.time }]);
const plTitle = (p) => `${plCap(jmPicksLabel(p.intents))}, ${plDayWord(p.day)} ${p.time}${plSlots(p).length > 1 ? ` +${plSlots(p).length - 1}` : ""}`;
const plSlotGroups = (slots) => { const g = {}; slots.forEach((x) => (g[x.day] = [...(g[x.day] || []), x.time].sort())); return Object.keys(g).map(Number).sort((a, b) => a - b).map((day) => ({ day, times: g[day] })); };
const plPlacesFor = (mode, interests = []) => PL_PLACES.filter((p) => p.modes.includes(mode)).map((p) => { const hit = p.fits.find((f) => interests.includes(f)); return { ...p, reason: hit ? `you like ${hit}` : p.why }; }).sort((a, b) => (b.reason.startsWith("you") - a.reason.startsWith("you")) || a.walk - b.walk);
const PL_STREETS = "repeating-linear-gradient(0deg, var(--map-line) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, var(--map-line) 0 1px, transparent 1px 64px), repeating-linear-gradient(32deg, transparent 0 140px, var(--map-street) 140px 146px, transparent 146px 300px), repeating-linear-gradient(-58deg, transparent 0 210px, var(--map-street) 210px 214px, transparent 214px 420px)";
const plPlaceOf = (p) => (p.spot ? { id: "spot", name: "Your spot", kind: "dropped on the map", icon: "map-pin", rating: null, hours: "outdoors", walk: plSpotWalk(p.spot.x, p.spot.y), x: p.spot.x, y: p.spot.y } : p.place === "auto" ? null : plPlace(p.place));
const plDesign = (v) => jmBadgeDesign({ interests: v.interests || [], qa: [{ a: v.q }], mode: "x", seed: v.name });

const PL_SEED = [
  { id: "p1", kind: "proposal", mode: "date", intents: ["wine"], day: 5, time: "19:30", place: "dvor", alts: ["altitude", "nook"], match: 94, walkThem: 7, expires: "6 h",
    vibe: { name: "Mia", q: "reads the menu twice — orders the first thing", opener: "what are you ordering? first answer only", interests: ["cooking", "wine", "books"] } },
  { id: "p2", kind: "proposal", mode: "mate", intents: ["board games"], day: 7, time: "15:00", place: "meeple", alts: ["tap", "nook"], match: 88, walkThem: 9, expires: "1 day",
    vibe: { name: "Robin", q: "will lose at chess — will demand a rematch", opener: "best of three, or are you scared?", interests: ["chess", "board games", "gaming"] } },
  { id: "c1", kind: "confirmed", mode: "mate", intents: ["climbing"], day: 1, time: "18:00", place: "boulder", match: 91,
    vibe: { name: "Kai", q: "knows every climbing gym in town — still scared of ladders", opener: "best wall in town, go", interests: ["climbing", "hiking", "gym"] } },
  { id: "i1", kind: "invite", mode: "mate", intents: ["running"], day: 8, time: "09:00", slots: [{ day: 8, time: "09:00" }, { day: 9, time: "09:00" }, { day: 9, time: "11:00" }], place: "steps", status: "open", until: "day",
    taker: { name: "Noa", match: 86, q: "early bird with a film camera — opinions on oat milk", opener: "what's the last thing you shot on film?", interests: ["photography", "running", "coffee"] } },
];
const PL_TAKERS = [
  { name: "Leo", match: 89, q: "plans the trip — forgets the charger", opener: "where's the last place you forgot something?", interests: ["travel", "cinema", "wine"] },
  { name: "Sam", match: 84, q: "techno on fridays — crosswords on sundays", opener: "seven letters, means 'found by compass'?", interests: ["concerts", "pub quiz", "coding"] },
];

// Pressable surface (FF press: scale on press-in, hover tint on pointer).
function PlTap({ onClick, style, children, radius = "var(--radius-row)", level = 2, ...rest }) {
  const [h, setH] = React.useState(false);
  const [p, setP] = React.useState(false);
  return (
    <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick && onClick()} {...rest}
      onPointerEnter={(e) => e.pointerType === "mouse" && setH(true)} onPointerLeave={() => { setH(false); setP(false); }}
      onPointerDown={() => setP(true)} onPointerUp={() => setP(false)}
      style={{ position: "relative", borderRadius: radius, background: h ? "color-mix(in oklab,var(--surface-card),rgb(var(--overlay)) 4%)" : "var(--surface-card)", boxShadow: `var(--shadow-${level})`,
        cursor: "pointer", transform: p ? "scale(var(--press-scale))" : "none", transition: "transform var(--dur-press) var(--ease-spring), background-color var(--dur-fast) ease", ...style }}>
      {children}
    </div>
  );
}

function PlMarker({ place, at, selected, compact, onClick }) {
  const { Icon } = PD_NS;
  const label = !compact || selected;
  const pt = at || place;
  const edge = pt.x > 0.72 ? "r" : pt.x < 0.28 ? "l" : "c";
  return (
    <button type="button" aria-label={place.name} onClick={(e) => { e.stopPropagation(); onClick && onClick(place); }}
      style={{ position: "absolute", left: `${pt.x * 100}%`, top: `${pt.y * 100}%`, transform: `translate(${edge === "r" ? "calc(-100% + 15px)" : edge === "l" ? "-15px" : "-50%"},-100%)`, zIndex: selected ? 3 : 2, border: 0, padding: 0, background: "transparent",
        display: "flex", flexDirection: "column", alignItems: edge === "r" ? "flex-end" : edge === "l" ? "flex-start" : "center", cursor: onClick ? "pointer" : "default", fontFamily: "var(--font-sans)",
        transition: "left var(--dur-default) var(--ease-spring), top var(--dur-default) var(--ease-spring)" }}>
      <span style={{ height: selected ? 32 : 28, padding: label ? (selected ? "0 12px 0 10px" : "0 10px 0 8px") : 0, width: label ? "auto" : 28, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap",
        background: selected ? "var(--fg-1)" : "var(--surface-card)", color: selected ? "var(--background)" : "var(--fg-1)", boxShadow: selected ? "var(--shadow-5)" : "var(--shadow-3)",
        fontSize: selected ? 13 : 12, fontWeight: 600, fontVariationSettings: "var(--fw-semibold)", transition: "background-color var(--dur-snappy) ease, color var(--dur-snappy) ease, height var(--dur-snappy) var(--ease-spring)" }}>
        <Icon name={place.icon} size={selected ? 15 : 14} strokeWidth={selected ? 2 : 1.75} />{label && place.name}
      </span>
      <span style={{ width: 2, height: selected ? 8 : 5, margin: edge === "c" ? 0 : "0 14px", background: selected ? "var(--fg-1)" : "var(--fg-3)", borderRadius: 2 }} />
    </button>
  );
}

// Pale street map with venue markers. Tap a venue (onPick) or blank map (onSpot). Only your own dot is ever drawn.
function PlanMap({ height = 200, radius = 24, selected, onPick, onSpot, route = true, compact = false, places = PL_PLACES, cy0 = 0.6, bare = false, style }) {
  const ref = React.useRef(null);
  // compact maps frame you + the place; full maps show true positions
  let pos = (p) => p;
  if (compact && selected) {
    const cx = (PL_SELF.x + selected.x) / 2, cy = (PL_SELF.y + selected.y) / 2;
    const dx = Math.abs(selected.x - PL_SELF.x) || 1e-3, dy = Math.abs(selected.y - PL_SELF.y) || 1e-3;
    const k = Math.min(1, 0.56 / dx, 0.38 / dy);
    pos = (p) => ({ x: 0.5 + (p.x - cx) * k, y: cy0 + (p.y - cy) * k });
  }
  const S = pos(PL_SELF), P = selected ? pos(selected) : null;
  const click = (e) => { if (!onSpot) return; const r = ref.current.getBoundingClientRect(); onSpot({ x: Math.min(.94, Math.max(.06, (e.clientX - r.left) / r.width)), y: Math.min(.94, Math.max(.12, (e.clientY - r.top) / r.height)) }); };
  const shown = compact ? (selected ? [selected] : []) : places;
  const extra = selected && !places.some((p) => p.id === selected.id) && !compact ? [selected] : [];
  return (
    <div ref={ref} onClick={click} style={{ position: "relative", height, borderRadius: radius, overflow: bare ? "visible" : "hidden", background: bare ? "transparent" : "var(--map-bg)", cursor: onSpot ? "crosshair" : "default", flexShrink: 0, ...style }}>
      {!bare && <div style={{ position: "absolute", inset: 0, background: PL_STREETS }} />}
      {P && <span style={{ position: "absolute", left: `${P.x * 100}%`, top: `${P.y * 100}%`, width: 150, height: 150, margin: -75, borderRadius: 999, pointerEvents: "none",
        background: "radial-gradient(circle, color-mix(in oklab, var(--glow) 55%, transparent), transparent 68%)", mixBlendMode: "var(--glow-blend)", transition: "left var(--dur-default) var(--ease-spring), top var(--dur-default) var(--ease-spring)" }} />}
      {route && selected && <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <line x1={`${S.x * 100}%`} y1={`${S.y * 100}%`} x2={`${P.x * 100}%`} y2={`${P.y * 100}%`} stroke="var(--fg-1)" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.1 7" />
      </svg>}
      <span style={{ position: "absolute", left: `${S.x * 100}%`, top: `${S.y * 100}%`, width: 14, height: 14, margin: -7, borderRadius: 999, background: "var(--self)", boxShadow: "0 0 0 4px color-mix(in oklab, var(--self) 22%, transparent), 0 0 16px color-mix(in oklab, var(--self) 60%, transparent)" }} />
      {[...shown, ...extra].map((p) => <PlMarker key={p.id} place={p} at={pos(p)} compact={compact} selected={!!selected && selected.id === p.id} onClick={onPick} />)}
    </div>
  );
}

function PlSwatch({ design, w = 40 }) {
  const [a, b, c] = design.colors, bl = design.blobs;
  return (
    <span style={{ position: "relative", width: w, height: Math.round(w * 1.38), borderRadius: 9, flexShrink: 0, overflow: "hidden", background: "var(--surface-chip)", boxShadow: "var(--shadow-3)" }} className="light">
      <span style={{ position: "absolute", inset: "0 0 38% 0", background: `radial-gradient(70% 60% at ${bl[0][0]}% ${bl[0][1]}%, color-mix(in oklab, ${a} 85%, white), transparent 72%), radial-gradient(60% 55% at ${bl[1][0]}% ${bl[1][1]}%, color-mix(in oklab, ${b} 75%, white), transparent 70%), radial-gradient(90% 70% at ${bl[2][0]}% ${bl[2][1]}%, color-mix(in oklab, ${c} 90%, white), transparent 75%)`,
        WebkitMaskImage: "linear-gradient(#000 40%, transparent)", maskImage: "linear-gradient(#000 40%, transparent)" }} />
      <span style={{ position: "absolute", top: 5, left: "50%", width: 7, height: 7, marginLeft: -3.5, borderRadius: 999, background: "var(--background)", boxShadow: "inset 0 1px 1px rgb(0 0 0 / .3)" }} />
    </span>
  );
}

function PlIconDisc({ icon, size = 40, solid }) {
  const { Icon } = PD_NS;
  return <span style={{ width: size, height: size, borderRadius: 999, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: solid ? "var(--fg-1)" : "var(--surface-chip)", color: solid ? "var(--background)" : "var(--fg-1)" }}><Icon name={icon} size={Math.round(size * 0.45)} strokeWidth={1.75} /></span>;
}

const plPlaceMeta = (pl) => [pl.kind, pl.rating ? `★ ${pl.rating}` : null, `${pl.walk} min walk`].filter(Boolean).join(" · ");

Object.assign(window, { PL_SELF, PL_PLACES, plPlace, plFits, plSpotWalk, plDate, plDayWord, plDayChip, plDateMono, plMinus, plCap, plTitle, plSlots, plSlotGroups, plPlacesFor, PL_STREETS, plPlaceOf, plDesign, PL_SEED, PL_TAKERS, PlTap, PlMarker, PlanMap, PlSwatch, PlIconDisc, plPlaceMeta });
