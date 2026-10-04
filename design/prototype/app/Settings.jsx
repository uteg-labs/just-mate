// Settings: full-page sheet that morphs out of the home sheet (tap your monogram). Profile edits reopen single onboarding steps.
const ST_NS = window.JustMateDesignSystem_dee067;

function SetGroup({ label, children }) {
  const { Card } = ST_NS;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {label && <span className="t-mono" style={{ color: "var(--fg-2)", paddingLeft: 4 }}>{label}</span>}
      <Card level={2} padding={0} style={{ overflow: "hidden" }}>{children}</Card>
    </section>
  );
}

function SetRow({ icon, label, value, onClick, last, children, chevron, muted }) {
  const { Icon } = ST_NS;
  const [hov, setHov] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const chev = chevron != null ? chevron : !!onClick;
  return (
    <div role={onClick ? "button" : undefined} onClick={onClick}
      onPointerEnter={(e) => onClick && e.pointerType === "mouse" && setHov(true)} onPointerLeave={() => { setHov(false); setPress(false); }}
      onPointerDown={() => onClick && setPress(true)} onPointerUp={() => setPress(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, minHeight: 52, padding: "6px 16px", boxSizing: "border-box", cursor: onClick ? "pointer" : "default",
        background: press ? "var(--active)" : hov ? "var(--hover)" : "transparent", transition: "background-color var(--dur-fast) ease" }}>
      {icon && <span style={{ color: muted ? "var(--fg-3)" : "var(--fg-2)" }}><Icon name={icon} size={20} strokeWidth={hov ? 2 : 1.5} /></span>}
      <span style={{ flex: 1, minWidth: 0, fontSize: 16, lineHeight: "22px", color: muted ? "var(--fg-2)" : "var(--fg-1)", fontVariationSettings: hov ? "var(--fw-semibold)" : "var(--fw-normal)" }}>{label}</span>
      {value != null && <span className="t-footnote" style={{ maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>}
      {children}
      {chev && <span style={{ color: "var(--fg-3)" }}><Icon name="chevron-right" size={16} strokeWidth={2} /></span>}
      {!last && <span style={{ position: "absolute", left: icon ? 48 : 16, right: 0, bottom: 0, height: 1, background: "var(--separator)" }} />}
    </div>
  );
}

function BadgeSwatch({ design }) {
  const [a, b, c] = design.colors, bl = design.blobs;
  return (
    <span style={{ position: "relative", width: 52, height: 72, borderRadius: 10, flexShrink: 0, overflow: "hidden", background: "var(--surface-chip)", boxShadow: "var(--shadow-3)" }}>
      <span style={{ position: "absolute", inset: "0 0 40% 0", background: `radial-gradient(70% 60% at ${bl[0][0]}% ${bl[0][1]}%, color-mix(in oklab, ${a} 85%, white), transparent 72%), radial-gradient(60% 55% at ${bl[1][0]}% ${bl[1][1]}%, color-mix(in oklab, ${b} 75%, white), transparent 70%), radial-gradient(90% 70% at ${bl[2][0]}% ${bl[2][1]}%, color-mix(in oklab, ${c} 90%, white), transparent 75%)`,
        WebkitMaskImage: "linear-gradient(#000 40%, transparent)", maskImage: "linear-gradient(#000 40%, transparent)" }} />
      <span style={{ position: "absolute", top: 6, left: "50%", width: 8, height: 8, marginLeft: -4, borderRadius: 999, background: "var(--background)", boxShadow: "inset 0 1px 1px rgb(0 0 0 / .3)" }} />
    </span>
  );
}

function SettingsContent({ profile, settings, setSetting, onBack, onEdit, onLogout }) {
  const { IconButton, Segmented, Switch, Button, Icon } = ST_NS;
  const date = profile.mode === "date";
  const design = jmBadgeDesign(profile);
  const name = profile.name.trim() || "Alex";
  const list = (a) => (a.length ? a.slice(0, 2).join(", ") + (a.length > 2 ? ` +${a.length - 2}` : "") : "none yet");
  const who = date ? `${profile.seek} · ${profile.age[0]}–${profile.age[1]}` : `${profile.mateWho === "same" ? "same gender" : "anyone"} · ${profile.group === "one" ? "one-on-one" : "small group"}`;
  const sw = (k) => <Switch checked={!!settings[k]} onToggle={() => setSetting(k, !settings[k])} />;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "56px 16px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <IconButton icon="arrow-left" label="Back to the map" variant="ghost" onClick={onBack} style={{ marginLeft: -8 }} />
        <h1 className="t-large-title" style={{ margin: 0 }}>Settings</h1>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px 44px", display: "flex", flexDirection: "column", gap: 24, scrollbarWidth: "none",
        WebkitMaskImage: "linear-gradient(transparent, #000 14px)", maskImage: "linear-gradient(transparent, #000 14px)" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", boxShadow: "var(--shadow-3)" }}>
          <BadgeSwatch design={design} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="t-headline">{name}</div>
            <div className="t-mono" style={{ color: "var(--fg-2)", display: "inline-flex", alignItems: "center", gap: 4 }}>
              {profile.mode} · {profile.verified ? <><Icon name="shield-check" size={12} strokeWidth={2} />verified</> : "not verified"} · no. {design.serial}
            </div>
            <div className="t-footnote" style={{ fontStyle: "italic", color: "var(--fg-1)", textWrap: "pretty" }}>“{profile.vibe || JM_VIBES[0]}”</div>
          </div>
        </div>

        <SetGroup label="your profile">
          <SetRow icon="user" label="Name" value={name} onClick={() => onEdit("name")} />
          <SetRow icon="sparkles" label="Interests" value={list(profile.interests)} onClick={() => onEdit("interests")} />
          <SetRow icon="shuffle" label="Questions and vibe" value={`${(profile.qa || []).length} answers`} onClick={() => onEdit("questions")} />
          <SetRow icon={date ? "heart" : "users"} label="Who you're after" value={who} onClick={() => onEdit("who")} />
          {date
            ? <SetRow icon="eye" label="Appearance taste" value="on this phone" onClick={() => onEdit("swipe")} last />
            : <SetRow icon="clock" label="When you're around" value={list(profile.when)} onClick={() => onEdit("schedule")} last />}
        </SetGroup>

        <SetGroup label="the map">
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid var(--separator)" }}>
            <span style={{ fontSize: 16, lineHeight: "22px" }}>Open the map in</span>
            <Segmented items={[{ value: "date", label: "Date", icon: "heart" }, { value: "mate", label: "Mate", icon: "users" }]} value={settings.startMode || profile.mode} onChange={(v) => setSetting("startMode", v)} />
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, borderBottom: "1px solid var(--separator)" }}>
            <span style={{ fontSize: 16, lineHeight: "22px" }}>Walk up to</span>
            <Segmented items={[{ value: "5", label: "5 min" }, { value: "10", label: "10 min" }, { value: "15", label: "15 min" }]} value={settings.walk} onChange={(v) => setSetting("walk", v)} />
          </div>
          <SetRow icon="timer" label="Stop searching after 30 min" last>{sw("autoStop")}</SetRow>
        </SetGroup>

        <SetGroup label="feel">
          <SetRow icon="hand" label="Haptics">{sw("haptics")}</SetRow>
          <SetRow icon="radio" label="Sounds">{sw("sounds")}</SetRow>
          <SetRow icon="eye-off" label="Reduce motion" last>{sw("reduceMotion")}</SetRow>
        </SetGroup>

        <SetGroup label="privacy and safety">
          <SetRow icon="lock" label="Taste and photos" value="this phone only" />
          <SetRow icon="shield-check" label="Blocked people" value="0" onClick={() => {}} />
          <SetRow icon="info" label="Download my data" onClick={() => {}} last />
        </SetGroup>

        <SetGroup label="account">
          <SetRow icon="mail" label="Email" value="alex@example.com" onClick={() => {}} />
          <SetRow icon="log-out" label="Log out" onClick={onLogout} chevron={false} last />
        </SetGroup>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Button variant="ghost" size="sm">Delete account</Button>
          <span className="t-mono" style={{ color: "var(--fg-3)" }}>JustMate · prototype · production path simulated</span>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { SettingsContent });
