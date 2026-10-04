// Category bento: 6 tiles of mixed size on a 3×3 grid. Picking one morphs it into a square card
// (sub-variants + "other"), the rest fold into an icon strip underneath.
const BT_NS = window.JustMateDesignSystem_dee067;
const BT_W = 346, BT_G = 8, BT_RH = 88, BT_PH = 52;
const BT_CW = (BT_W - 2 * BT_G) / 3;
// [col, row, colSpan, rowSpan] per category index → fills all 9 cells: A A B / A A C / D E F
const BT_SLOTS = [[0, 0, 2, 2], [2, 0, 1, 1], [2, 1, 1, 1], [0, 2, 1, 1], [1, 2, 1, 1], [2, 2, 1, 1]];

function BentoTile({ c, p, intent, setIntent, onPick }) {
  const { Icon, Chip, IconButton } = BT_NS;
  const [hov, setHov] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const pw = (BT_W - 4 * BT_G) / 5;
  const D = 440, E = "var(--ease-spring)";
  const layer = (on) => ({ position: "absolute", top: 0, left: 0, opacity: on ? 1 : 0, pointerEvents: on ? "auto" : "none",
    transition: on ? `opacity ${D * 0.5}ms ease ${D * 0.25}ms` : `opacity ${D * 0.2}ms ease` });
  const isOpen = p.mode === "open";
  const big = p.tw > BT_CW + 1 || p.th > BT_RH + 1;
  return (
    <div role={isOpen ? undefined : "button"} aria-label={isOpen ? undefined : c.label} onClick={isOpen ? undefined : () => onPick(c)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHov(true)} onPointerLeave={() => { setHov(false); setPress(false); }}
      onPointerDown={() => !isOpen && setPress(true)} onPointerUp={() => setPress(false)}
      style={{ position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h, borderRadius: p.mode === "pill" ? 26 : isOpen ? 28 : 20, overflow: "hidden",
        cursor: isOpen ? "default" : "pointer",
        background: isOpen ? "var(--fg-1)" : hov ? "color-mix(in oklab,var(--surface-card),rgb(var(--overlay)) 4%)" : "var(--surface-card)",
        boxShadow: isOpen ? "var(--shadow-6)" : "var(--shadow-2)", transform: press ? "scale(var(--press-scale))" : "none",
        transition: ["left", "top", "width", "height", "border-radius"].map((k) => `${k} ${D}ms ${E}`).concat([`background-color ${D * 0.5}ms ease`, `transform var(--dur-press) ${E}`, `box-shadow ${D}ms ease`]).join(", ") }}>
      <div style={{ ...layer(p.mode === "tile"), width: p.tw, height: p.th, padding: big ? "14px 14px 12px" : "12px 12px 10px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Icon name={c.icon} size={big ? 26 : 22} strokeWidth={hov ? 2 : 1.5} />
        <span style={{ fontSize: 15, lineHeight: "20px", letterSpacing: "-0.1px", fontWeight: 600, fontVariationSettings: hov ? "var(--fw-semibold)" : "var(--fw-medium)", textWrap: "balance" }}>{c.label}</span>
      </div>
      <div style={{ ...layer(p.mode === "pill"), width: pw, height: BT_PH, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name={c.icon} size={20} strokeWidth={hov ? 2 : 1.5} />
      </div>
      <div className="dark" style={{ ...layer(isOpen), width: BT_W, height: BT_W, padding: 18, boxSizing: "border-box", color: "var(--fg-1)", background: "transparent", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={{ width: 48, height: 48, borderRadius: 999, background: "var(--tint)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name={c.icon} size={24} strokeWidth={1.75} /></span>
          <IconButton icon="x" label="Close category" variant="ghost" size={36} onClick={(e) => { e.stopPropagation(); onPick(null); }} />
        </div>
        <div className="t-large-title" style={{ marginTop: 14 }}>{c.label}</div>
        <div className="t-mono" style={{ color: "var(--fg-2)", marginTop: 6 }}>pick any · {intent.length} selected</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto", paddingTop: 14 }}>
          {[...c.intents, "other"].map((i) => <Chip key={i} size="sm" icon={i === "other" ? "plus" : undefined} selected={intent.includes(i)} onClick={() => setIntent(jmToggle(intent, i))}>{i}</Chip>)}
        </div>
      </div>
    </div>
  );
}

function CategoryBento({ tab, cat, onPick, intent, setIntent }) {
  const cats = JM_CATS[tab];
  const sel = cats.findIndex((c) => c.id === cat);
  const pw = (BT_W - 4 * BT_G) / 5;
  const slot = (i) => {
    const [col, row, cs, rs] = BT_SLOTS[i];
    return { x: col * (BT_CW + BT_G), y: row * (BT_RH + BT_G), w: cs * BT_CW + (cs - 1) * BT_G, h: rs * BT_RH + (rs - 1) * BT_G };
  };
  const pos = (i) => {
    const s = slot(i);
    const base = { tw: s.w, th: s.h };
    if (sel < 0) return { ...s, ...base, mode: "tile" };
    if (i === sel) return { x: 0, y: 0, w: BT_W, h: BT_W, ...base, mode: "open" };
    const j = i < sel ? i : i - 1;
    return { x: j * (pw + BT_G), y: BT_W + BT_G, w: pw, h: BT_PH, ...base, mode: "pill" };
  };
  const H = sel < 0 ? 3 * BT_RH + 2 * BT_G : BT_W + BT_G + BT_PH;
  return (
    <div style={{ position: "relative", width: BT_W, height: H, transition: "height 440ms var(--ease-spring)", animation: "jm-up var(--dur-default) var(--ease-spring)" }}>
      {cats.map((c, i) => <BentoTile key={c.id} c={c} p={pos(i)} intent={intent} setIntent={setIntent} onPick={onPick} />)}
    </div>
  );
}
Object.assign(window, { CategoryBento });
