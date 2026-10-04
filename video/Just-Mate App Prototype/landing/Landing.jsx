// just-mate landing one-pager. Reuses the app's real components (map, bento, morph surface, badge, compass).
const LD_NS = window.JustMateDesignSystem_dee067;

function LdPhone({ scale = 1, dark = false, statusHidden = false, children }) {
  return (
    <div style={{ width: JM_PW * scale, height: JM_PH * scale, flexShrink: 0 }}>
      <div style={{ width: JM_PW, height: JM_PH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <IOSDevice dark={dark} statusHidden={statusHidden}>
          <div style={{ position: "relative", zIndex: 0, height: JM_PH, overflow: "hidden", fontFamily: "var(--font-sans)", color: "var(--fg-1)" }}>{children}</div>
        </IOSDevice>
      </div>
    </div>
  );
}

const LD_MATCH = { state: "offered", left: 38, ...JM_MATCH_VIBES.date[0], name: "Mia" };

// Hero: a working slice of the app — pick, search, match, compass — on the real morph surface.
function HeroDemo({ scale }) {
  const [shape, setShape] = React.useState("select");
  const [tab, setTab] = React.useState("date");
  const [cat, setCat] = React.useState(null);
  const [intent, setIntent] = React.useState([]);
  const [elapsed, setElapsed] = React.useState(0);
  const [match, setMatch] = React.useState(null);
  const [key, setKey] = React.useState(0);
  const shapeRef = React.useRef(shape); shapeRef.current = shape;
  React.useEffect(() => { if (shape !== "search" && shape !== "match") return; const i = setInterval(() => setElapsed((e) => e + 1), 1000); return () => clearInterval(i); }, [shape === "search" || shape === "match"]);
  React.useEffect(() => {
    if (shape !== "search") return;
    const t = setTimeout(() => { if (shapeRef.current === "search") { setMatch({ ...LD_MATCH, left: 45, ...JM_MATCH_VIBES[tab][key % 3], name: JM_NAMES[tab === "date" ? "her" : "their"][key % 4] }); setShape("match"); } }, 4200);
    return () => clearTimeout(t);
  }, [shape, key]);
  React.useEffect(() => { if (!match || match.state !== "offered" || shape !== "match") return; const i = setInterval(() => setMatch((m) => ({ ...m, left: Math.max(1, m.left - 1) })), 1000); return () => clearInterval(i); }, [match && match.state, shape]);
  const changeTab = (v) => { if (v !== tab) { setTab(v); setCat(null); setIntent([]); } };
  const il = intent.length ? jmPicksLabel(intent) : "coffee";
  const icon = jmIntentIcon(tab, cat, intent[0]);
  const pronoun = tab === "date" ? "her" : "their";
  const render = (n) => {
    switch (n) {
      case "select": return <SelectSheet tab={tab} onTab={changeTab} cat={cat} setCat={setCat} intent={intent} setIntent={setIntent} onFind={() => { setElapsed(0); setShape("search"); }} modeSwitch="map" />;
      case "search": return <SearchSheet tab={tab} cat={cat} picks={intent} setPicks={setIntent} label={il} icon={icon} elapsed={elapsed} onStop={() => setShape("select")} />;
      case "match": return match ? <MatchBadge match={match} intent={il} pronoun={pronoun} adult={tab === "date"}
        onAccept={() => { setMatch((m) => ({ ...m, state: "accepted" })); setTimeout(() => setShape("compass"), 1400); }}
        onDismiss={() => { setMatch((m) => ({ ...m, state: "dismissed" })); setKey((k) => k + 1); setShape("search"); }} /> : null;
      case "compass": return <CompassContent intent={il} quote={(match && match.q) || LD_MATCH.q} onVanish={() => setShape("select")} onMet={() => setShape("postmeet")} />;
      case "postmeet": return <PostMeetContent match={match} me="Alex" myDesign={jmBadgeDesign({ interests: ["coffee", "hiking", "jazz"], qa: [{ a: "a long walk" }] })} pronoun={pronoun} onBack={() => setShape("select")} />;
      default: return null;
    }
  };
  const night = shape === "compass" || shape === "postmeet";
  return (
    <LdPhone scale={scale} dark={night} statusHidden={shape === "match"}>
      <MapChrome shape={shape} live={shape === "search"} initials="AL" intent={il} tab={tab} onTab={changeTab} modeSwitch="map" />
      <Morph shape={shape} render={render} dur={520} />
    </LdPhone>
  );
}

function StepPhone({ kind, scale }) {
  const sheet = { position: "absolute", left: 8, width: JM_PW - 16, bottom: 8, borderRadius: 40, overflow: "hidden", background: "var(--material-thick)", backdropFilter: "var(--blur-thick)", WebkitBackdropFilter: "var(--blur-thick)", boxShadow: "inset 0 1px 0 0 var(--hairline-top), var(--shadow-6)" };
  if (kind === "search") return (
    <LdPhone scale={scale}>
      <MapChrome shape="search" live initials="AL" intent="coffee or wine" tab="date" onTab={() => {}} modeSwitch="map" />
      <div className="light" style={sheet}><SearchSheet tab="date" cat="food" picks={["coffee", "wine"]} setPicks={() => {}} label="coffee or wine" icon="coffee" elapsed={47} onStop={() => {}} /></div>
    </LdPhone>
  );
  if (kind === "match") return (
    <LdPhone scale={scale} statusHidden>
      <MapChrome shape="match" live={false} initials="AL" intent="coffee" tab="date" onTab={() => {}} modeSwitch="map" />
      <div className="dark" style={{ position: "absolute", left: 8, top: 11, width: JM_PW - 16, height: JM_PH - 19, borderRadius: 40, overflow: "hidden", background: "#000", color: "var(--fg-1)" }}>
        <MatchBadge match={LD_MATCH} intent="coffee" pronoun="her" adult onAccept={() => {}} onDismiss={() => {}} />
      </div>
    </LdPhone>
  );
  if (kind === "compass") return (
    <LdPhone scale={scale} dark>
      <div className="dark" style={{ position: "absolute", inset: 0, background: "var(--jm-ink)", color: "var(--fg-1)" }}><CompassContent intent="coffee" quote={LD_MATCH.q} onVanish={() => {}} onMet={() => {}} /></div>
    </LdPhone>
  );
  return (
    <LdPhone scale={scale} dark>
      <div className="dark" style={{ position: "absolute", inset: 0, background: "var(--jm-ink)", color: "var(--fg-1)" }}>
        <PostMeetContent match={LD_MATCH} me="Alex" myDesign={jmBadgeDesign({ interests: ["coffee", "hiking", "jazz"], qa: [{ a: "a long walk" }] })} pronoun="her" onBack={() => {}} />
      </div>
    </LdPhone>
  );
}

// Mounts children only once scrolled into view, so badges drop in when you get there.
function InView({ children, style, minHeight }) {
  const ref = React.useRef(null);
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el); const t = setTimeout(() => setOn(true), 4000);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  return <div ref={ref} style={{ minHeight, ...style }}>{on && children}</div>;
}

function ModelDiagram() {
  const { Icon } = LD_NS;
  const inputs = [
    ["sparkles", "What you pick", "interests and tonight's plan"],
    ["shuffle", "How you answer", "questions it writes for you"],
    ["eye", "Who catches your eye", "taste, trained on your phone"],
    ["footprints", "How meetings go", "every “keep in touch” teaches it"],
  ];
  return (
    <div className="ld-diagram">
      <div className="ld-inputs">
        {inputs.map(([ic, t, d]) => (
          <div key={t} className="ld-input">
            <span className="ld-ic" style={{ width: 36, height: 36, boxShadow: "var(--shadow-2)" }}><Icon name={ic} size={17} strokeWidth={1.75} /></span>
            <div style={{ minWidth: 0 }}><div className="t-headline" style={{ fontSize: 15 }}>{t}</div><div className="t-footnote">{d}</div></div>
          </div>
        ))}
      </div>
      <span className="ld-arrow"><Icon name="arrow-right" size={22} strokeWidth={1.75} /></span>
      <div className="ld-core">
        <img src="assets/brand/just-mate-symbol.svg" width="112" height="112" alt="" style={{ borderRadius: 999, boxShadow: "var(--shadow-6)" }} />
        <div className="t-title">just-mate model</div>
        <span className="t-mono" style={{ color: "var(--fg-2)" }}>custom trained · private by design</span>
      </div>
      <span className="ld-arrow"><Icon name="arrow-right" size={22} strokeWidth={1.75} /></span>
      <div className="ld-output dark">
        <span className="t-mono" style={{ color: "var(--fg-2)", display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--glow)", boxShadow: "0 0 8px var(--glow)" }} />one match · nearby · now
        </span>
        <div className="t-title">Both phones ping.</div>
        <p className="t-vibe" style={{ margin: 0, fontSize: 17, lineHeight: "23px" }}>“reads the menu twice — orders the first thing”</p>
        <span className="t-footnote">Only a compatibility score ever leaves your phone.</span>
      </div>
    </div>
  );
}

const LD_MODES = {
  date: { title: "Someone to fall for, tonight.", desc: "Skip weeks of small talk. If you click, you'll know in the first five minutes, in person.", chips: ["coffee", "wine", "sunset walk", "live gig", "cinema", "cocktails"], note: "18+ · selfie verified",
    story: [["21:02", "You pick wine and cocktails. You're visible now."], ["21:04", "Her badge drops in: “reads the menu twice — orders the first thing”."], ["21:05", "You both open the compass. Warm, then hot."], ["21:13", "Burning. Same bar, same table. Names unlock."]] },
  mate: { title: "Your people, a few streets away.", desc: "New city, quiet weekend, friends all busy. Find someone up for the same thing, right now.", chips: ["beer", "padel", "board games", "climbing", "pub quiz", "hike"], note: "selfie verified",
    story: [["18:40", "You pick padel. Spare racket in the bag."], ["18:41", "A badge drops in: “will lose at chess — will demand a rematch”."], ["18:43", "Compass open. Six minutes on foot."], ["18:55", "Same court. Two sets, rematch on Thursday."]] },
};

function ModeStory() {
  const { Segmented, Chip } = LD_NS;
  const [m, setM] = React.useState("date");
  const d = LD_MODES[m];
  return (
    <div className="ld-mode">
      <div className="ld-mode-copy">
        <Segmented items={[{ value: "date", label: "Date", icon: "heart" }, { value: "mate", label: "Mate", icon: "users" }]} value={m} onChange={setM} style={{ maxWidth: 300 }} />
        <div key={m} style={{ display: "flex", flexDirection: "column", gap: 16, animation: "jm-up var(--dur-default) var(--ease-spring)" }}>
          <div className="ld-h3" style={{ textWrap: "balance" }}>{d.title}</div>
          <p className="t-body" style={{ margin: 0, color: "var(--fg-2)", fontSize: 18, lineHeight: "27px" }}>{d.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{d.chips.map((c) => <Chip key={c} size="sm">{c}</Chip>)}</div>
          <span className="t-mono" style={{ color: "var(--fg-2)" }}>{d.note}</span>
        </div>
      </div>
      <div className="ld-story dark">
        <span className="t-mono" style={{ color: "var(--fg-2)" }}>one real {m === "date" ? "date" : "evening"} · example</span>
        <div key={m} className="ld-rail">
          {d.story.map(([t, x], i) => (
            <div key={t} className="ld-story-row" style={{ animationDelay: `${i * 110}ms` }}>
              <span className="t-mono tabular" style={{ color: "var(--fg-2)", width: 44, flexShrink: 0, paddingTop: 3 }}>{t}</span>
              <span className="ld-node" style={i === d.story.length - 1 ? { background: "var(--glow)", boxShadow: "0 0 0 4px color-mix(in oklab, var(--glow) 25%, transparent), 0 0 14px var(--glow)" } : null} />
              <p style={{ margin: 0, fontSize: 17, lineHeight: "24px", color: "var(--fg-1)", textWrap: "pretty" }}>{x}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function useWidth() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return w;
}

function Landing() {
  const { Button, Chip, Icon, Card } = LD_NS;
  const w = useWidth();
  const heroScale = w < 520 ? Math.min(0.78, (w - 40) / JM_PW) : 0.8;
  const stepScale = w < 520 ? Math.min(0.62, (w - 60) / JM_PW) : 0.56;
  const go = (id) => { const el = document.getElementById(id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: "smooth" }); };
  const rules = [
    ["eye-off", "No faces.", "Nobody sees a photo. Not yours, not theirs. You're a vibe until you're standing in front of each other."],
    ["hand", "No chat.", "Nothing to type, nothing to ghost. Both accept, or it quietly expires."],
    ["map", "No pins.", "The map shows warmth, never people. The compass shows a direction, never a dot."],
  ];
  const steps = [
    ["search", "Switch on", "Pick what you're up for. The map warms up where compatible people are."],
    ["match", "Both phones ping", "Their badge drops in: a vibe and what they want. Open the compass, or let it expire."],
    ["compass", "Walk", "The arrow points to them. Cold, warm, hot, burning. Ten minutes, then it closes."],
    ["post", "Say hi", "Names unlock once you've met. That's the only thing that does."],
  ];
  const badges = [
    { name: "coffee · hiking · jazz", d: { interests: ["coffee", "hiking", "jazz"], qa: [{ a: "a long walk, no plan" }, { a: "a record shop" }] }, q: "quietly funny — will out-argue you about pizza", e: "date · wants: coffee", strap: 70 },
    { name: "climbing · gym · running", d: { interests: ["climbing", "gym", "running"], qa: [{ a: "find a pickup game" }, { a: "the competitive one" }] }, q: "knows every climbing gym in town — still scared of ladders", e: "mate · wants: climbing", strap: 120 },
    { name: "techno · gaming · coding", d: { interests: ["techno", "gaming", "coding"], qa: [{ a: "a project at 2am" }] }, q: "techno on fridays — crosswords on sundays", e: "mate · wants: gig", strap: 90 },
  ];
  const safety = [
    ["shield-check", "Real people only", "One selfie, checked once, then deleted."],
    ["lock", "Taste stays on your phone", "Your attraction profile trains on-device. Only a score travels."],
    ["x", "Vanish any time", "One tap ends the compass. No explanation owed."],
    ["timer", "Ten minutes, then gone", "Every match closes on its own."],
    ["eye-off", "No rejection, ever", "A declined offer just reads “offer expired”."],
    ["heart", "18+ for dating", "Checked against your selfie, required to date."],
  ];
  return (
    <>
      <nav className="ld-nav">
        <div className="ld-wrap ld-nav-in">
          <a href="#top" className="ld-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <img src="assets/brand/just-mate-symbol.svg" width="32" height="32" alt="" /><span className="ld-wm" style={{ fontSize: 24 }}>just-mate</span>
          </a>
          <div className="ld-links">
            <a href="#how" onClick={(e) => { e.preventDefault(); go("how"); }}>How it works</a>
            <a href="#model" onClick={(e) => { e.preventDefault(); go("model"); }}>Matching</a>
            <a href="#badge" onClick={(e) => { e.preventDefault(); go("badge"); }}>Your badge</a>
            <a href="#safety" onClick={(e) => { e.preventDefault(); go("safety"); }}>Safety</a>
            <Button size="sm" onClick={() => go("get")}>Get the app</Button>
          </div>
        </div>
      </nav>

      <header id="top" className="ld-hero" data-screen-label="Hero">
        <div className="ld-wrap ld-hero-in">
          <div className="ld-hero-copy">
            <span className="t-mono" style={{ color: "var(--fg-2)" }}>for iphone · date or mate</span>
            <h1 className="ld-h1">Meet for real.</h1>
            <p className="ld-lead">Less swiping. Less chatting. More life. Say what you're up for, and our matching model finds the one person nearby who fits, right now. Both phones ping, and a compass walks you to each other.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button size="lg" trailingIcon="arrow-right" onClick={() => go("get")}>Get the app</Button>
              <Button size="lg" variant="tertiary" onClick={() => go("how")}>How it works</Button>
            </div>
            <span className="t-mono" style={{ color: "var(--fg-2)" }}>no faces · no chat · no pins</span>
          </div>
          <div className="ld-hero-phone">
            <HeroDemo scale={heroScale} />
            <span className="t-mono" style={{ color: "var(--fg-3)" }}>live · tap a category, then find people</span>
          </div>
        </div>
      </header>

      <section className="ld-sec" data-screen-label="The loop">
        <div className="ld-wrap">
          <div className="ld-head" style={{ maxWidth: 720 }}>
            <span className="t-mono" style={{ color: "var(--fg-2)" }}>why just-mate</span>
            <h2 className="ld-h2">Swipe, match, chat, fade. Repeat.</h2>
            <p className="ld-lead" style={{ fontSize: 19, lineHeight: "28px", maxWidth: 640 }}>Apps turned meeting people into a second job. Hours of judging profiles, chats that die after three messages, plans for “sometime”. More matches than ever, and somehow lonelier. Meanwhile, the people you'd get on with are a few streets away.</p>
          </div>
          <div className="ld-grid2">
            <Card level={1} padding={28} style={{ display: "flex", flexDirection: "column", gap: 4, background: "var(--surface-raised)" }}>
              <span className="t-mono" style={{ color: "var(--fg-2)", paddingBottom: 10 }}>the loop</span>
              {["Endless profiles to judge", "Chats that fizzle out", "Plans for “sometime”", "Back on the couch, scrolling"].map((x) => (
                <div key={x} className="ld-li" style={{ color: "var(--fg-2)" }}><Icon name="x" size={18} strokeWidth={2} /><span style={{ textDecoration: "line-through", textDecorationColor: "var(--fg-3)" }}>{x}</span></div>
              ))}
            </Card>
            <Card level={6} padding={28} className="dark" style={{ display: "flex", flexDirection: "column", gap: 4, background: "var(--jm-ink)", color: "var(--fg-1)" }}>
              <span className="t-mono" style={{ color: "var(--fg-2)", paddingBottom: 10 }}>just-mate</span>
              {["One match, when it really fits", "No chat. A direction and ten minutes", "Tonight, not sometime", "An evening you'll actually remember"].map((x) => (
                <div key={x} className="ld-li"><span style={{ color: "var(--success)" }}><Icon name="check" size={18} strokeWidth={2.25} /></span><span>{x}</span></div>
              ))}
            </Card>
          </div>
          <div className="ld-grid3" style={{ marginTop: 64 }}>
            {rules.map(([ic, t, d]) => (
              <div key={t} className="ld-rule">
                <span className="ld-ic"><Icon name={ic} size={22} strokeWidth={1.75} /></span>
                <h3 className="t-title" style={{ margin: 0 }}>{t}</h3>
                <p className="t-body" style={{ margin: 0, color: "var(--fg-2)" }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="ld-sec ld-tint" data-screen-label="How it works">
        <div className="ld-wrap">
          <div className="ld-head">
            <span className="t-mono" style={{ color: "var(--fg-2)" }}>how it works</span>
            <h2 className="ld-h2">Four steps, then you're off your phone.</h2>
          </div>
          <div className="ld-steps">
            {steps.map(([k, t, d], i) => (
              <div key={k} className="ld-step">
                <InView minHeight={JM_PH * stepScale}><StepPhone kind={k} scale={stepScale} /></InView>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="t-mono tabular" style={{ color: "var(--fg-2)" }}>0{i + 1}</span>
                  <h3 className="t-title" style={{ margin: 0 }}>{t}</h3>
                  <p className="t-footnote" style={{ margin: 0, fontSize: 15, lineHeight: "21px" }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="model" className="ld-sec" data-screen-label="Matching model">
        <div className="ld-wrap">
          <div className="ld-head" style={{ maxWidth: 720 }}>
            <span className="t-mono" style={{ color: "var(--fg-2)" }}>matching</span>
            <h2 className="ld-h2">A model trained to find your person.</h2>
            <p className="ld-lead" style={{ fontSize: 19, lineHeight: "28px", maxWidth: 640 }}>Not a feed. Our custom-trained model reads what you pick, how you answer and who catches your eye, then waits for the one person nearby who actually fits. Soul mate or just a mate.</p>
          </div>
          <ModelDiagram />
          <div className="ld-grid4" style={{ marginTop: 48 }}>
            {[["One match, not a deck.", "It holds back until the fit is strong. No hundred maybes."],
              ["Learns from real life.", "What happens after you meet teaches it more than any swipe."],
              ["Private by design.", "Your taste model stays on your phone. Only a score travels."],
              ["Fair both ways.", "A match only opens when it fits you both."]].map(([t, x]) => (
              <div key={t} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="t-headline">{t}</div>
                <div className="t-footnote" style={{ fontSize: 15, lineHeight: "21px" }}>{x}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ld-sec ld-tint" data-screen-label="Date or mate">
        <div className="ld-wrap">
          <div className="ld-head">
            <span className="t-mono" style={{ color: "var(--fg-2)" }}>two ways in</span>
            <h2 className="ld-h2">A real night, not another chat.</h2>
          </div>
          <ModeStory />
        </div>
      </section>

      <section id="badge" className="ld-sec ld-badges ld-tint" data-screen-label="Your badge">
        <div className="ld-wrap">
          <div className="ld-head" style={{ maxWidth: 640 }}>
            <span className="t-mono" style={{ color: "var(--fg-2)" }}>your badge</span>
            <h2 className="ld-h2">A vibe, not a face.</h2>
            <p className="ld-lead" style={{ fontSize: 19, lineHeight: "28px" }}>Your badge is designed from what you pick and how you answer. Colour from your interests, pattern from your answers. No two look the same. Drag one.</p>
          </div>
          <InView minHeight={520} style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap", marginTop: 8 }}>
            {badges.map((b) => (
              <div key={b.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <VibeBadge design={jmBadgeDesign(b.d)} width={240} strap={b.strap} eyebrow={b.e} quote={b.q} tag="verified" />
                <span className="t-mono" style={{ color: "var(--fg-2)" }}>{b.name}</span>
              </div>
            ))}
          </InView>
        </div>
      </section>

      <section id="safety" className="ld-sec" data-screen-label="Safety">
        <div className="ld-wrap">
          <div className="ld-head">
            <span className="t-mono" style={{ color: "var(--fg-2)" }}>safety</span>
            <h2 className="ld-h2">Built so meeting a stranger feels calm.</h2>
          </div>
          <div className="ld-grid3">
            {safety.map(([ic, t, d]) => (
              <Card key={t} level={2} padding={22} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span className="ld-ic" style={{ width: 40, height: 40 }}><Icon name={ic} size={19} strokeWidth={1.75} /></span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="t-headline">{t}</div>
                  <div className="t-footnote" style={{ fontSize: 15, lineHeight: "21px" }}>{d}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="get" className="ld-cta dark" data-screen-label="Get the app">
        <div className="ld-wrap ld-cta-in">
          <img src="assets/brand/just-mate-app-icon.svg" width="112" height="112" alt="just-mate app icon" style={{ borderRadius: 26, boxShadow: "0 20px 50px -20px rgb(0 0 0 / .6)" }} />
          <h2 className="ld-h2" style={{ color: "var(--fg-1)" }}>Go meet someone.</h2>
          <p className="ld-lead" style={{ color: "var(--fg-2)", textAlign: "center" }}>Less time on your phone. More nights worth remembering. iPhone first.</p>
          <Button size="lg" trailingIcon="arrow-right">Download for iPhone</Button>
          <span className="t-mono" style={{ color: "var(--fg-3)" }}>production path · store link goes here</span>
        </div>
      </section>

      <footer className="ld-foot">
        <div className="ld-wrap ld-foot-in">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="assets/brand/just-mate-symbol.svg" width="24" height="24" alt="" /><span className="ld-wm" style={{ fontSize: 18 }}>just-mate</span>
          </div>
          <div className="ld-links" style={{ gap: 20 }}>
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a>
            <span className="t-mono" style={{ color: "var(--fg-3)" }}>© 2026 just-mate</span>
          </div>
        </div>
      </footer>
    </>
  );
}
Object.assign(window, { Landing });
