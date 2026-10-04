// Onboarding: mode pick, then "about you" (name, interests, live questions → vibe), then "who you're after", then verification.
const OB_NS = window.JustMateDesignSystem_dee067;
const JM_FLOWS = {
  date: ["mode", "name", "interests", "questions", "who", "swipe", "verify"],
  mate: ["mode", "name", "interests", "questions", "who", "schedule", "verify"],
};
const JM_GROUP = { mode: "welcome", name: "about you", interests: "about you", questions: "about you", who: "who you're after", swipe: "who you're after", schedule: "who you're after", verify: "last step" };

function ObStep({ eyebrow, title, sub, children, cta, footer }) {
  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, padding: "20px 2px 4px", margin: "0 -2px", scrollbarWidth: "none" }}>
        {eyebrow && <span className="t-mono" style={{ color: "var(--fg-2)" }}>{eyebrow}</span>}
        {title && <h1 className="t-large-title" style={{ margin: 0 }}>{title}</h1>}
        {sub && <p className="t-body" style={{ margin: 0, color: "var(--fg-2)" }}>{sub}</p>}
        {children}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14 }}>{footer}{cta}</div>
    </>
  );
}

function ModeCard({ icon, title, tag, desc, selected, onClick }) {
  const { Icon } = OB_NS;
  const [p, setP] = React.useState(false);
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}
      style={{ width: "100%", minHeight: selected ? 156 : 128, border: 0, borderRadius: "var(--radius-card)", padding: 20, boxSizing: "border-box", cursor: "pointer", textAlign: "left",
        display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16, fontFamily: "var(--font-sans)",
        background: selected ? "var(--fg-1)" : "var(--surface-card)", color: selected ? "var(--background)" : "var(--fg-1)", boxShadow: selected ? "var(--shadow-6)" : "var(--shadow-3)",
        transform: p ? "scale(var(--press-scale))" : "scale(1)",
        transition: "min-height var(--dur-default) var(--ease-spring), background-color var(--dur-snappy) var(--ease-spring), color var(--dur-snappy) ease, transform var(--dur-press) var(--ease-spring), box-shadow var(--dur-default) ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <span style={{ width: 44, height: 44, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
          background: selected ? "color-mix(in oklab, var(--background) 14%, transparent)" : "var(--surface-raised)", transition: "background-color var(--dur-snappy) ease" }}>
          <Icon name={icon} size={20} strokeWidth={selected ? 2 : 1.5} />
        </span>
        <span className="t-mono" style={{ opacity: 0.7 }}>{tag}</span>
      </div>
      <div>
        <div className="t-large-title">{title}</div>
        <div style={{ fontSize: 15, lineHeight: "20px", marginTop: 4, opacity: 0.72 }}>{desc}</div>
      </div>
    </button>
  );
}

function StepMode({ profile, setProfile, eyebrow, next }) {
  const { Button } = OB_NS;
  const pick = (v) => v !== profile.mode && setProfile((p) => ({ ...p, mode: v, interests: [], qa: [], vibe: "" }));
  return (
    <ObStep eyebrow={eyebrow} title="What are you here for?" sub="Pick one to start. You can switch on the map any time."
      cta={<Button fullWidth trailingIcon="arrow-right" onClick={next}>Start with you</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
        <ModeCard icon="heart" title="Date" tag="love" desc="Someone to fall for, a few streets away." selected={profile.mode === "date"} onClick={() => pick("date")} />
        <ModeCard icon="users" title="Mate" tag="friends" desc="People to grab a beer or a game with, right now." selected={profile.mode === "mate"} onClick={() => pick("mate")} />
      </div>
    </ObStep>
  );
}

function StepName({ profile, set, eyebrow, next }) {
  const { Button, Segmented } = OB_NS;
  const n = profile.name.trim();
  return (
    <ObStep eyebrow={eyebrow} title="What should we call you?" sub="First name only. A match sees it once you've met."
      cta={<Button fullWidth disabled={!n} onClick={next}>{n ? `Call me ${n}` : "Type your name"}</Button>}>
      <TextField label="first name" value={profile.name} onChange={(v) => set({ name: v })} placeholder="e.g. Alex" onEnter={() => n && next()} style={{ paddingTop: 8 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FieldLabel>I am</FieldLabel>
        <Segmented items={[{ value: "woman", label: "woman" }, { value: "man", label: "man" }, { value: "nb", label: "non-binary" }]} value={profile.gender} onChange={(v) => set({ gender: v })} />
      </div>
    </ObStep>
  );
}

function StepInterests({ profile, set, live, eyebrow, next }) {
  const { Button, Chip } = OB_NS;
  const picked = profile.interests;
  const base = JM_INTERESTS[profile.mode];
  const [related, setRelated] = React.useState({});
  const [loading, setLoading] = React.useState([]);
  const toggle = (i) => {
    const on = !picked.includes(i);
    set({ interests: on ? [...picked, i] : picked.filter((x) => x !== i) });
    if (on && !related[i]) {
      setLoading((l) => [...l, i]);
      jmRelated({ item: i, mode: profile.mode, live, have: [...base, ...Object.values(related).flat()] }).then((list) => {
        setRelated((r) => ({ ...r, [i]: list }));
        setLoading((l) => l.filter((x) => x !== i));
      });
    }
  };
  const out = [], seen = new Set();
  const walk = (i, depth) => {
    if (seen.has(i)) return; seen.add(i); out.push({ i, depth });
    if (!picked.includes(i)) return;
    (related[i] || []).forEach((r) => walk(r, depth + 1));
    if (loading.includes(i)) out.push({ load: i });
  };
  base.forEach((i) => walk(i, 0));
  picked.forEach((p) => walk(p, 1));
  const left = Math.max(0, 3 - picked.length);
  return (
    <ObStep eyebrow={eyebrow} title={profile.mode === "date" ? "What are you into?" : "What do you like doing?"} sub="Pick at least 3. Each pick opens related ones."
      cta={<Button fullWidth disabled={left > 0} onClick={next}>{left ? `Pick ${left} more` : "That's me"}</Button>}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
        {out.map((x) => x.load
          ? <span key={"load-" + x.load} aria-label="loading related" style={{ height: 40, width: 56, borderRadius: 999, background: "var(--surface-chip)", boxShadow: "inset 0 0 0 1px var(--separator)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, animation: "jm-pop var(--dur-snappy) var(--ease-spring)" }}>
              {[0, 1, 2].map((k) => <span key={k} style={{ width: 5, height: 5, borderRadius: 999, background: "var(--fg-3)", animation: `jm-pulse 1s ease-in-out ${k * 0.15}s infinite` }} />)}
            </span>
          : <span key={x.i} style={{ display: "inline-flex", animation: x.depth ? "jm-pop var(--dur-default) var(--ease-spring)" : "none" }}>
              <Chip selected={picked.includes(x.i)} icon={x.depth && !picked.includes(x.i) ? "plus" : undefined} onClick={() => toggle(x.i)}>{x.i}</Chip>
            </span>)}
      </div>
    </ObStep>
  );
}

function StepWho({ profile, set, eyebrow, next }) {
  const { Button, Segmented, Chip } = OB_NS;
  const date = profile.mode === "date";
  const row = (label, el, right) => <div style={{ display: "flex", flexDirection: "column", gap: 8 }}><FieldLabel right={right}>{label}</FieldLabel>{el}</div>;
  const age = row("age", <RangeSlider min={18} max={60} value={profile.age} onChange={(v) => set({ age: v })} />, `${profile.age[0]} – ${profile.age[1]}${profile.age[1] === 60 ? "+" : ""}`);
  if (date) return (
    <ObStep eyebrow={eyebrow} title="Who are you looking for?" sub="Used for matching only. Nobody sees your settings."
      cta={<Button fullWidth onClick={next}>Train my taste</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingTop: 8 }}>
        {row("interested in", <Segmented items={[{ value: "women", label: "women" }, { value: "men", label: "men" }, { value: "everyone", label: "everyone" }]} value={profile.seek} onChange={(v) => set({ seek: v })} />)}
        {age}
        {row("looking for", <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{["something real", "see where it goes", "something light"].map((x) => <Chip key={x} selected={profile.looking === x} onClick={() => set({ looking: x })}>{x}</Chip>)}</div>)}
      </div>
    </ObStep>
  );
  return (
    <ObStep eyebrow={eyebrow} title="Who's your kind of mate?" sub="Matching uses this. It stays on your side."
      cta={<Button fullWidth onClick={next}>Sounds right</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, paddingTop: 8 }}>
        {row("who", <Segmented items={[{ value: "anyone", label: "anyone" }, { value: "same", label: "same gender" }]} value={profile.mateWho} onChange={(v) => set({ mateWho: v })} />)}
        {row("group", <Segmented items={[{ value: "one", label: "one-on-one" }, { value: "small", label: "small group" }]} value={profile.group} onChange={(v) => set({ group: v })} />)}
        {row("energy", <Segmented items={[{ value: "chill", label: "chill" }, { value: "both", label: "either" }, { value: "active", label: "active" }]} value={profile.energy} onChange={(v) => set({ energy: v })} />)}
        {age}
      </div>
    </ObStep>
  );
}

function StepSchedule({ profile, set, eyebrow, next }) {
  const { Button, Segmented, Chip } = OB_NS;
  const s = profile.when;
  const toggle = (x) => set({ when: s.includes(x) ? s.filter((y) => y !== x) : [...s, x] });
  return (
    <ObStep eyebrow={eyebrow} title="When are you usually around?" sub="Pick any. It helps us time your matches."
      cta={<Button fullWidth disabled={!s.length} onClick={next}>{s.length ? "Verify me" : "Pick at least one"}</Button>}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
        {["weekday mornings", "lunch breaks", "after work", "late nights", "weekends"].map((x) => <Chip key={x} selected={s.includes(x)} onClick={() => toggle(x)}>{x}</Chip>)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10 }}>
        <FieldLabel>a hangout usually lasts</FieldLabel>
        <Segmented items={[{ value: "hour", label: "an hour" }, { value: "few", label: "a few hours" }, { value: "day", label: "all day" }]} value={profile.length} onChange={(v) => set({ length: v })} />
      </div>
    </ObStep>
  );
}

function Onboarding({ profile, setProfile, live, onDone, onExit, startStep, single = false }) {
  const { IconButton, StepDots } = OB_NS;
  const flow = JM_FLOWS[profile.mode];
  const [i, setI] = React.useState(() => Math.max(0, flow.indexOf(startStep)));
  const [dir, setDir] = React.useState(1);
  const step = flow[i];
  const next = () => { setDir(1); if (single) onDone(); else if (i < flow.length - 1) setI(i + 1); else onDone(); };
  const back = () => { setDir(-1); if (i === 0 || single) onExit(); else setI(i - 1); };
  const set = (patch) => setProfile((p) => ({ ...p, ...patch }));
  const g = JM_GROUP[step];
  const inGroup = flow.filter((s) => JM_GROUP[s] === g);
  const eyebrow = step === "mode" ? "welcome" : `${g} · ${inGroup.indexOf(step) + 1} of ${inGroup.length}`;
  const props = { profile, set, setProfile, live, next, eyebrow };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "56px 16px 34px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 44 }}>
        <IconButton icon="arrow-left" label="Back" variant="ghost" onClick={back} />
        {single ? <span className="t-mono" style={{ color: "var(--fg-2)" }}>editing</span> : <StepDots count={flow.length} active={i} />}
        <span style={{ width: 44 }} />
      </div>
      <div key={step} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", animation: `${dir > 0 ? "ob-next" : "ob-back"} var(--dur-default) var(--ease-spring)` }}>
        {step === "mode" && <StepMode {...props} />}
        {step === "name" && <StepName {...props} />}
        {step === "interests" && <StepInterests {...props} />}
        {step === "questions" && <StepQuestions {...props} />}
        {step === "who" && <StepWho {...props} />}
        {step === "swipe" && <StepSwipe {...props} />}
        {step === "schedule" && <StepSchedule {...props} />}
        {step === "verify" && <StepVerify {...props} />}
      </div>
    </div>
  );
}
Object.assign(window, { Onboarding, ObStep });
