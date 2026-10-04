// Home: map + chrome underneath the morph surface, and the content for every home shape
// (select sheet → searching sheet → match badge card → compass → post-meet).
const HM_NS = window.JustMateDesignSystem_dee067;
const HM_ZONES = [
  { id: "a", x: 0.28, y: 0.30, n: 6 }, { id: "b", x: 0.72, y: 0.22, n: 3 },
  { id: "c", x: 0.64, y: 0.42, n: 9 }, { id: "d", x: 0.22, y: 0.52, n: 4 }, { id: "e", x: 0.80, y: 0.58, n: 2 },
];

function MapChrome({ shape, live, initials, intent, onProfile, tab, onTab, modeSwitch }) {
  const { ZoneGlow, StatusPill, Monogram, Badge, Segmented } = HM_NS;
  const [zone, setZone] = React.useState(null);
  const [seed, setSeed] = React.useState(7);
  React.useEffect(() => { if (live) setSeed((s) => s + 1); }, [live]);
  React.useEffect(() => { if (!zone) return; const t = setTimeout(() => setZone(null), 2400); return () => clearTimeout(t); }, [zone]);
  const show = (on) => ({ opacity: on ? 1 : 0, transform: on ? "none" : "translateY(-8px)", transition: "opacity var(--dur-default) ease, transform var(--dur-default) var(--ease-spring)", pointerEvents: on ? "auto" : "none" });
  const auth = shape === "auth";
  const searching = shape === "search";
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "var(--background)" }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--map-bg)" }}>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, var(--map-line) 0 1px, transparent 1px 64px), repeating-linear-gradient(90deg, var(--map-line) 0 1px, transparent 1px 64px), repeating-linear-gradient(32deg, transparent 0 140px, var(--map-street) 140px 146px, transparent 146px 300px), repeating-linear-gradient(-58deg, transparent 0 210px, var(--map-street) 210px 214px, transparent 214px 420px)", opacity: live ? 1 : 0.6, transition: "opacity var(--dur-default) ease" }} />
        <HeatMap width={JM_PW} height={JM_PH} visible={live} seed={seed} onZone={searching ? setZone : undefined} />
        <span style={{ position: "absolute", left: JM_PW * 0.5, top: JM_PH * 0.4, width: 14, height: 14, margin: -7, borderRadius: 999, background: "var(--self)", boxShadow: "0 0 0 4px color-mix(in oklab, var(--self) 22%, transparent), 0 0 16px color-mix(in oklab, var(--self) 60%, transparent)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 140, background: "linear-gradient(var(--background), transparent)", pointerEvents: "none" }} />
      </div>

      <div style={{ position: "absolute", top: 78, left: 24, right: 24, ...show(auth), pointerEvents: "none" }}>
        <div style={{ fontSize: 56, lineHeight: "56px", fontWeight: 700, fontVariationSettings: "var(--fw-bold)", letterSpacing: "-2px" }}>JustMate</div>
        <div className="t-title" style={{ color: "var(--fg-2)", marginTop: 10 }}>Meet for real.</div>
        <div className="t-mono" style={{ color: "var(--fg-2)", marginTop: 18 }}>no faces · no chat · no pins</div>
      </div>
      <div style={{ position: "absolute", top: 58, left: 16, right: 16, display: "flex", alignItems: "center", justifyContent: "space-between", ...show(shape === "select" || searching) }}>
        <StatusPill status={searching ? "searching" : "invisible"} intent={intent} />
        <Monogram initials={initials} size={40} onClick={onProfile} />
      </div>

      <div style={{ position: "absolute", top: 108, left: 0, right: 0, display: "flex", justifyContent: "center", ...show(shape === "select" && modeSwitch === "map") }}>
        <Segmented fullWidth={false} items={[{ value: "date", label: "Date", icon: "heart" }, { value: "mate", label: "Mate", icon: "users" }]} value={tab} onChange={onTab}
          style={{ width: 240, background: "var(--material-thin)", backdropFilter: "var(--blur-thin)", WebkitBackdropFilter: "var(--blur-thin)", boxShadow: "inset 0 1px 0 0 var(--hairline-top), var(--shadow-3)" }} />
      </div>

      <div style={{ position: "absolute", top: 106, left: 0, right: 0, display: "flex", justifyContent: "center", ...show(searching && zone) }}>
        <Badge color="glow" variant="dot" style={{ height: 32, padding: "0 14px", fontSize: 13, background: "var(--material-thin)", backdropFilter: "var(--blur-thin)", WebkitBackdropFilter: "var(--blur-thin)" }}>~{zone ? zone.n : 0} compatible around here</Badge>
      </div>

      <div style={{ position: "absolute", inset: 0, background: "var(--scrim)", opacity: shape === "match" ? 1 : 0, transition: "opacity var(--dur-default) ease", pointerEvents: "none" }} />
    </div>
  );
}

const HM_HEADLINES = {
  date: ["What are you up for?", "Where to tonight?", "What's the plan?", "Try something new?"],
  mate: ["What are you up for?", "Who's in for something?", "What's the plan?", "Go do something."],
};

// Rotating headline: words blur + rise in, the old line lifts out. Pauses while a category is open.
function MorphHeadline({ lines, paused }) {
  const [{ i, prev }, setPair] = React.useState({ i: 0, prev: -1 });
  React.useEffect(() => { if (paused) return; const t = setInterval(() => setPair((p) => ({ prev: p.i, i: (p.i + 1) % lines.length })), 3200); return () => clearInterval(t); }, [paused, lines]);
  return (
    <div className="t-large-title" aria-live="polite" style={{ display: "grid" }}>
      {lines.map((l, k) => {
        const st = k === i ? "in" : k === prev ? "out" : "wait";
        return (
          <span key={l} aria-hidden={st !== "in"} style={{ gridArea: "1 / 1", display: "flex", flexWrap: "wrap", columnGap: "0.26em" }}>
            {l.split(" ").map((w, j) => (
              <span key={j} style={{ display: "inline-block",
                opacity: st === "in" ? 1 : 0, filter: st === "in" ? "none" : "blur(8px)",
                transform: st === "in" ? "none" : st === "out" ? "translateY(-10px)" : "translateY(10px)",
                transition: st === "wait" ? "none" : `opacity 360ms ease ${j * 55 + (st === "in" ? 140 : 0)}ms, filter 360ms ease ${j * 55 + (st === "in" ? 140 : 0)}ms, transform 520ms var(--ease-spring) ${j * 55 + (st === "in" ? 140 : 0)}ms` }}>{w}</span>
            ))}
          </span>
        );
      })}
    </div>
  );
}

function SelectSheet({ tab, onTab, cat, setCat, intent, setIntent, onFind, modeSwitch = "map" }) {
  const { Segmented, Button, Icon, Sheet } = HM_NS;
  const pick = (c) => { if (!c || c.id === cat) { setCat(null); setIntent([]); } else { setCat(c.id); setIntent([c.intents[0]]); } };
  const date = tab === "date";
  return (
    <Sheet material={false} padding={20} style={{ background: "transparent", boxShadow: "none", paddingBottom: 22 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
          <div key={tab} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6, animation: "jm-fade var(--dur-snappy) ease" }}>
            <MorphHeadline lines={HM_HEADLINES[tab]} paused={!!cat} />
            <div className="t-footnote">{date ? "Meet someone new over something you'd do anyway." : "Find company for something you'd do anyway."}</div>
          </div>
          {modeSwitch === "header" && (
            <Segmented fullWidth={false} items={[{ value: "date", label: "", icon: "heart" }, { value: "mate", label: "", icon: "users" }]} value={tab} onChange={onTab} style={{ width: 104, flexShrink: 0 }} />
          )}
        </div>
        <CategoryBento key={tab} tab={tab} cat={cat} onPick={pick} intent={intent} setIntent={setIntent} />
        {cat ? (
          <div style={{ animation: "jm-up var(--dur-default) var(--ease-spring)" }}>
            <Button fullWidth leadingIcon="search" disabled={!intent.length} onClick={onFind}>{intent.length ? `Find people for ${jmPicksLabel(intent)}` : "Pick at least one"}</Button>
          </div>
        ) : (
          <div className="t-footnote" style={{ textAlign: "center" }}>You're invisible until you pick something.</div>
        )}
      </div>
    </Sheet>
  );
}

function SearchSheet({ tab, cat, picks, setPicks, label, icon, elapsed, onStop }) {
  const { Icon, Button, Chip, Sheet } = HM_NS;
  const c = (JM_CATS[tab] || []).find((x) => x.id === cat);
  const dot = <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--glow)", boxShadow: "0 0 8px var(--glow)", animation: "jm-pulse 1s ease-in-out infinite" }} />;
  return (
    <Sheet material={false} padding={20} style={{ background: "transparent", boxShadow: "none", paddingBottom: 22 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ position: "relative", width: 56, height: 56, borderRadius: 999, background: "var(--fg-1)", color: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={icon} size={24} strokeWidth={1.75} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-mono" style={{ color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 6 }}>{dot}searching · {tab}{c ? ` · ${c.label.toLowerCase()}` : ""}</div>
            <div className="t-large-title" style={{ marginTop: 4, textWrap: "balance" }}>Looking for {label}</div>
          </div>
        </div>
        {c && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -20px", padding: "0 20px", scrollbarWidth: "none" }}>
            {[...c.intents, "other"].map((i) => <Chip key={i} size="sm" icon={i === "other" ? "plus" : undefined} selected={picks.includes(i)} onClick={() => setPicks(jmToggle(picks, i, 1))}>{i}</Chip>)}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: "var(--radius-row)", background: "var(--surface-card)", boxShadow: "var(--shadow-2)" }}>
          <div>
            <div className="t-headline">You're visible nearby</div>
            <div className="t-footnote" style={{ marginTop: 2 }}>Both phones ping at once when it's mutual.</div>
          </div>
          <span className="t-mono tabular" style={{ color: "var(--fg-1)", fontSize: 13 }}>{jmClock(elapsed)}</span>
        </div>
        <Button variant="secondary" fullWidth leadingIcon="x" onClick={onStop}>Stop searching</Button>
      </div>
    </Sheet>
  );
}

function MatchBadge({ match, intent, pronoun, adult, onAccept, onDismiss }) {
  const { Button } = HM_NS;
  const st = match.state;
  const expired = st === "expired";
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ height: JM_PH - 19, display: "flex", flexDirection: "column", padding: "0 20px 24px", boxSizing: "border-box" }}>
      <div style={{ flex: 1, minHeight: 0, opacity: expired ? 0.4 : 1, transition: "opacity var(--dur-fade) ease" }}>
        <VibeBadge design={jmBadgeDesign({ interests: match.interests || [], qa: [{ a: match.q }], mode: "x", seed: match.name })} width={262} strap={150} fadeStrap={false} eyebrow={`${pronoun} vibe · wants: ${intent}`} quote={match.q} tag={adult ? "verified · 18+" : "verified"} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px 10px" }}>
          <span className="t-mono" style={{ color: "var(--fg-2)" }}>match · nearby · on foot</span>
          {!expired && <span className="t-mono tabular" style={{ color: "var(--fg-2)" }}>0:{String(match.left).padStart(2, "0")}</span>}
        </div>
        {expired
          ? <div className="t-headline" style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "var(--muted)", color: "var(--fg-2)" }}>offer expired</div>
          : st === "accepted"
            ? <Button variant="secondary" fullWidth disabled>waiting for them…</Button>
            : <Button variant="glow" fullWidth leadingIcon="compass" onClick={onAccept}>Open compass</Button>}
        {!expired && <Button variant="ghost" fullWidth size="md" onClick={onDismiss} disabled={st === "accepted"}>Dismiss</Button>}
        <span className="t-footnote" style={{ textAlign: "center", paddingTop: 6 }}>{expired ? "you're still searching" : "unlocks only if they accept too"}</span>
      </div>
    </div>
  );
}

function CompassContent({ intent, quote, onVanish, onMet }) {
  const { CompassDial, BucketLabel, Countdown, VibeCard, Button } = HM_NS;
  const [t, setT] = React.useState(0);
  const [rot, setRot] = React.useState(38);
  React.useEffect(() => { const i = setInterval(() => { setT((x) => x + 1); setRot((r) => r * 0.86 + (Math.random() * 16 - 8)); }, 1000); return () => clearInterval(i); }, []);
  const dist = Math.max(18, 320 - t * 22);
  const bucket = dist < 30 ? "burning" : dist < 80 ? "hot" : dist < 200 ? "warm" : "cold";
  const waiting = t < 2;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 16px 36px", boxSizing: "border-box" }}>
      <Countdown seconds={600 - t * 7} label={`left · ${intent}`} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <CompassDial rotation={rot} bucket={bucket} size={290} waiting={waiting} />
        {waiting ? <span className="t-title" style={{ color: "var(--fg-2)" }}>finding signal…</span> : <BucketLabel bucket={bucket} />}
      </div>
      <VibeCard compact eyebrow="you're looking for" intent={intent} quote={quote} style={{ width: "100%", boxSizing: "border-box" }} />
      <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 14 }}>
        <Button variant="danger" size="lg" leadingIcon="x" onClick={onVanish}>Vanish</Button>
        <Button variant={bucket === "burning" ? "glow" : "secondary"} size="lg" fullWidth leadingIcon="hand" disabled={bucket !== "burning"} onClick={onMet}>We met</Button>
      </div>
    </div>
  );
}

function PostMeetContent({ match, me, myDesign, pronoun, onBack }) {
  const { Button, VibeCard, Icon } = HM_NS;
  const [keep, setKeep] = React.useState("idle");
  const m = match || { ...JM_MATCH_VIBES.date[0], name: "Mia" };
  const ask = () => { setKeep("waiting"); setTimeout(() => setKeep("yes"), 1800); };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "0 16px 36px", boxSizing: "border-box" }}>
      <div style={{ height: 384, display: "flex", justifyContent: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ transform: "rotate(4deg)", transformOrigin: "50% 0" }}><VibeBadge design={myDesign} width={150} strap={74} fadeStrap={false} eyebrow="your vibe" name={me} /></div>
        <div style={{ transform: "rotate(-4deg)", transformOrigin: "50% 0" }}><VibeBadge design={jmBadgeDesign({ interests: m.interests || [], qa: [{ a: m.q }], mode: "x", seed: m.name })} width={150} strap={110} fadeStrap={false} eyebrow={`${pronoun} vibe`} name={m.name} /></div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10 }}>
        <span className="t-mono" style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="circle-check" size={14} strokeWidth={2} />you found each other</span>
        <h1 className="t-large-title" style={{ margin: 0 }}>Say hi to {m.name}.</h1>
        <p className="t-body" style={{ margin: 0, color: "var(--fg-2)" }}>Names unlock once you've met. Nothing else does.</p>
      </div>
      <VibeCard compact eyebrow="an opener, if you need one" quote={m.opener} style={{ marginTop: 16 }} />
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <Button variant="tertiary" size="lg" leadingIcon={keep === "yes" ? "check" : "plus"} loading={keep === "waiting"} disabled={keep === "yes"} onClick={ask}>{keep === "yes" ? "Kept" : "Keep in touch"}</Button>
        <Button fullWidth size="lg" onClick={onBack}>Back to the map</Button>
      </div>
      <span className="t-footnote" style={{ textAlign: "center", marginTop: 10 }}>{keep === "yes" ? `${m.name} tapped it too. Saved on this phone.` : "Keep in touch unlocks only if they tap it too."}</span>
    </div>
  );
}
Object.assign(window, { MapChrome, SelectSheet, SearchSheet, MatchBadge, CompassContent, PostMeetContent });
