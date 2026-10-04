// Onboarding steps with their own inner state: live questions → vibe, appearance swiping, selfie verification.
const OS_NS = window.JustMateDesignSystem_dee067;
const JM_Q_TOTAL = 4;

function StepQuestions({ profile, setProfile, live, eyebrow, next }) {
  const { Button, Chip, VibeCard, Icon } = OS_NS;
  const qa = profile.qa || [];
  const done = qa.length >= JM_Q_TOTAL;
  const [cur, setCur] = React.useState(null);
  const [pick, setPick] = React.useState(null);
  const [own, setOwn] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const req = React.useRef(0);
  const ask = async (list) => {
    const id = ++req.current; setBusy(true);
    const q = await jmNextQuestion({ mode: profile.mode, name: profile.name, interests: profile.interests, qa: list, live });
    if (id === req.current) { setCur(q); setBusy(false); }
  };
  const vibe = async (list, avoid) => {
    const id = ++req.current; setBusy(true);
    const v = await jmVibe({ mode: profile.mode, interests: profile.interests, qa: list, live, avoid });
    if (id === req.current) { setProfile((p) => ({ ...p, vibe: v })); setBusy(false); }
  };
  React.useEffect(() => { if (done) { if (!profile.vibe) vibe(qa); } else ask(qa); return () => { req.current++; }; }, []);
  const answer = own.trim() || pick;
  const submit = () => {
    if (!answer || busy) return;
    const list = [...qa, { q: cur.question, a: answer }];
    setProfile((p) => ({ ...p, qa: list, vibe: "" }));
    setCur(null); setPick(null); setOwn("");
    if (list.length >= JM_Q_TOTAL) vibe(list); else ask(list);
  };
  const trail = qa.length > 0 && (
    <div className="t-footnote" style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <span className="t-mono" style={{ color: "var(--fg-3)" }}>so far</span>
      {qa.map((x, i) => <span key={i} style={{ color: "var(--fg-1)" }}>{x.a}{i < qa.length - 1 ? " ·" : ""}</span>)}
    </div>
  );

  if (done) return (
    <ObStep eyebrow="about you · your vibe" title="Your badge" sub="Designed from your picks. All a match sees."
      cta={<Button fullWidth disabled={busy || !profile.vibe} onClick={next}>Keep this vibe</Button>}
      footer={<div style={{ display: "flex", justifyContent: "center" }}><Button variant="tertiary" size="md" leadingIcon="shuffle" disabled={busy} onClick={() => vibe(qa, profile.vibe)}>Reroll</Button></div>}>
      <div style={{ marginTop: -8, overflow: "hidden", margin: "-8px -16px 0", padding: "0 16px" }}>
        <VibeBadge design={jmBadgeDesign(profile)} width={224} strap={64} lifted={busy} turnKey={profile.vibe || "pending"}
          eyebrow={`${(profile.name.trim() || "you").toLowerCase()} · wants: ${profile.interests[0] || "coffee"}`}
          quote={busy || !profile.vibe ? "writing…" : profile.vibe} tag={profile.mode === "date" ? "date" : "mate"} />
      </div>
      <div className="t-footnote" style={{ textAlign: "center", marginTop: -6 }}>Colours from {profile.interests.slice(0, 3).join(", ") || "your picks"}. Pattern from your {qa.length} answers.</div>
    </ObStep>
  );

  return (
    <ObStep eyebrow={`about you · question ${qa.length + 1} of ${JM_Q_TOTAL}`}
      cta={<Button fullWidth disabled={busy || !answer} onClick={submit}>{qa.length + 1 < JM_Q_TOTAL ? "Next question" : "Write my vibe"}</Button>} footer={trail}>
      {busy || !cur ? <Thinking text={qa.length ? "reading your answers…" : "getting a feel for you…"} /> : (
        <div key={cur.question} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "jm-up var(--dur-default) var(--ease-spring)" }}>
          <h1 className="t-large-title" style={{ margin: 0, textWrap: "balance" }}>{cur.question}</h1>
          <div className="t-footnote" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -6 }}>
            <Icon name="sparkles" size={14} />{cur.source === "live" ? (qa.length ? "Written from your last answer" : `Written from ${profile.interests.slice(0, 2).join(" and ")}`) : "Sample question · live questions off"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
            {cur.options.map((o) => <Chip key={o} selected={pick === o && !own.trim()} onClick={() => { setPick(o); setOwn(""); }}>{o}</Chip>)}
          </div>
          <TextField label="or in your own words" value={own} onChange={setOwn} placeholder="say it your way" onEnter={submit} />
        </div>
      )}
    </ObStep>
  );
}

function StepSwipe({ eyebrow, next, set }) {
  const { Button, IconButton, Icon, Card } = OS_NS;
  const total = JM_SWIPES.length;
  const [idx, setIdx] = React.useState(0);
  const [liked, setLiked] = React.useState(0);
  const [dx, setDx] = React.useState(0);
  const [fly, setFly] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const start = React.useRef(null);
  const finished = idx >= total;
  const commit = (d) => {
    if (fly || finished) return;
    setFly(d);
    setTimeout(() => { if (d > 0) setLiked((l) => l + 1); setIdx((i) => i + 1); setFly(0); setDx(0); }, 300);
  };
  React.useEffect(() => { if (finished) set({ taste: liked }); }, [finished]);
  const down = (e) => { if (fly) return; const el = e.currentTarget; start.current = { x: e.clientX, s: el.getBoundingClientRect().width / el.offsetWidth }; setDragging(true); el.setPointerCapture(e.pointerId); };
  const move = (e) => { if (start.current) setDx((e.clientX - start.current.x) / start.current.s); };
  const up = () => { if (!start.current) return; start.current = null; setDragging(false); if (Math.abs(dx) > 90) commit(dx > 0 ? 1 : -1); else setDx(0); };
  const visible = JM_SWIPES.slice(idx, idx + 3);
  const stamp = (on, label, icon, side) => (
    <span className="t-mono" style={{ position: "absolute", top: 20, [side]: 20, height: 32, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 999,
      background: "var(--fg-1)", color: "var(--background)", opacity: on, transform: `rotate(${side === "left" ? -6 : 6}deg) scale(${0.9 + on * 0.1})` }}>
      <Icon name={icon} size={14} strokeWidth={2} />{label}
    </span>
  );
  return (
    <ObStep eyebrow={eyebrow} title="Who catches your eye?" sub="Swipe sample photos. Your taste trains on this phone and never leaves it."
      cta={<Button fullWidth disabled={!finished} onClick={next}>{finished ? "Verify me" : `${total - idx} left to swipe`}</Button>}>
      <div style={{ position: "relative", flex: 1, minHeight: 330, marginTop: 4 }}>
        {finished ? (
          <Card level={3} style={{ position: "absolute", inset: "0 0 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", animation: "jm-up var(--dur-default) var(--ease-spring)" }}>
            <span style={{ color: "var(--success)" }}><Icon name="circle-check" size={32} strokeWidth={1.75} /></span>
            <div className="t-title">Taste saved on this phone</div>
            <div className="t-mono" style={{ color: "var(--fg-2)", whiteSpace: "nowrap" }}>{liked} into it · {total - liked} not for me</div>
          </Card>
        ) : visible.map((c, j) => {
          const top = j === 0;
          const x = top ? (fly ? fly * 520 : dx) : 0;
          const like = top ? Math.min(1, Math.max(0, fly > 0 ? 1 : dx / 90)) : 0;
          const nope = top ? Math.min(1, Math.max(0, fly < 0 ? 1 : -dx / 90)) : 0;
          return (
            <div key={c.n} onPointerDown={top ? down : undefined} onPointerMove={top ? move : undefined} onPointerUp={top ? up : undefined} onPointerCancel={top ? up : undefined}
              style={{ position: "absolute", inset: "0 0 24px", borderRadius: 32, overflow: "hidden", background: "var(--surface-card)", boxShadow: "var(--shadow-6)", touchAction: "none",
                cursor: top ? (dragging ? "grabbing" : "grab") : "default", zIndex: 3 - j, userSelect: "none",
                transform: top ? `translateX(${x}px) rotate(${x / 18}deg)` : `translateY(${j * 12}px) scale(${1 - j * 0.05})`,
                transition: top && dragging ? "none" : `transform ${fly ? 300 : 400}ms var(--ease-spring)` }}>
              <div style={{ position: "absolute", inset: "0 0 76px", background: "repeating-linear-gradient(135deg, var(--surface-raised) 0 14px, var(--surface-chip) 14px 28px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <span className="t-mono" style={{ color: "var(--fg-2)", background: "var(--surface-card)", padding: "6px 10px", borderRadius: 999 }}>sample photo {String(c.n).padStart(2, "0")}</span>
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 76, padding: "0 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
                <span className="t-headline">{c.traits}</span>
                <span className="t-mono" style={{ color: "var(--fg-3)" }}>{c.n} of {total} · on-device only</span>
              </div>
              {stamp(like, "into it", "heart", "left")}
              {stamp(nope, "not for me", "x", "right")}
            </div>
          );
        }).reverse()}
      </div>
      {!finished && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 28 }}>
          <IconButton icon="x" label="Not for me" variant="tint" size={60} iconSize={24} onClick={() => commit(-1)} />
          <span className="t-mono tabular" style={{ color: "var(--fg-2)", minWidth: 40, textAlign: "center" }}>{idx + 1} / {total}</span>
          <IconButton icon="heart" label="Into it" variant="solid" size={60} iconSize={24} onClick={() => commit(1)} />
        </div>
      )}
    </ObStep>
  );
}

function StepVerify({ profile, set, eyebrow, next }) {
  const { Button, Icon, CheckRow } = OS_NS;
  const date = profile.mode === "date";
  const [phase, setPhase] = React.useState(profile.verified ? "done" : "idle");
  const scan = () => { setPhase("scanning"); setTimeout(() => { setPhase("done"); set({ verified: true }); }, 2300); };
  const ok = phase === "done" && (!date || profile.adult);
  const msg = { idle: "center your face in the oval", scanning: "hold still…", done: date ? "real person · photo deleted" : "real person · photo deleted" }[phase];
  return (
    <ObStep eyebrow={eyebrow} title={date ? "Prove you're real, and 18+" : "Prove you're real"} sub="One selfie, checked once, then deleted. Nobody ever sees it."
      footer={<span className="t-mono" style={{ color: "var(--fg-3)", textAlign: "center" }}>production path · simulated in this build</span>}
      cta={phase === "done"
        ? <Button fullWidth disabled={!ok} leadingIcon="map" onClick={next}>Enter the map</Button>
        : <Button fullWidth leadingIcon="camera" loading={phase === "scanning"} onClick={scan}>Take selfie</Button>}>
      <div className="dark" style={{ position: "relative", height: date ? 300 : 360, borderRadius: 32, background: "var(--jm-ink)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, transition: "height var(--dur-default) var(--ease-spring)" }}>
        <svg width="190" height="240" viewBox="0 0 190 240" style={{ overflow: "visible" }}>
          <ellipse cx="95" cy="120" rx="80" ry="106" fill="none" stroke="var(--fg-3)" strokeWidth="1.5" strokeDasharray={phase === "idle" ? "5 8" : "0"} />
          <ellipse cx="95" cy="120" rx="106" ry="80" fill="none" stroke={phase === "done" ? "var(--success)" : "var(--glow)"} strokeWidth="3" strokeLinecap="round"
            pathLength="100" strokeDasharray="100" strokeDashoffset={phase === "idle" ? 100 : 0} transform="rotate(-90 95 120)"
            style={{ transition: `stroke-dashoffset ${phase === "scanning" ? 2200 : 0}ms var(--ease-out-quad), stroke var(--dur-fade) ease` }} />
        </svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: phase === "done" ? "var(--success)" : "var(--fg-3)", transition: "color var(--dur-fade) ease" }}>
          <Icon name={phase === "done" ? "shield-check" : "scan-face"} size={44} strokeWidth={1.25} />
        </span>
        <span className="t-mono" style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", color: phase === "done" ? "var(--fg-1)" : "var(--fg-2)" }}>{msg}</span>
      </div>
      {date && <CheckRow label="I'm 18 or older" description="Required for dating. Checked against your selfie." checked={!!profile.adult} onToggle={() => set({ adult: !profile.adult })} />}
    </ObStep>
  );
}
Object.assign(window, { StepQuestions, StepSwipe, StepVerify });
