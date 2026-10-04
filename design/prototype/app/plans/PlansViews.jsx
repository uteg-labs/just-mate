// Plans surfaces: home sheet with "Plan for later", top-bar plans pill, plans list page, offer card (proposal / someone's in), plan detail.
const PV_NS = window.JustMateDesignSystem_dee067;

// Home sheet: three scrolling sections (what, your plans, places for you). Plan mode grows the sheet over the map,
// hides the plans + place maps, and scrolls back to what; picking something there starts the plan flow.
function PlTextLink({ children, onClick }) {
  const [h, setH] = React.useState(false);
  return <button type="button" onClick={onClick} onPointerEnter={(e) => e.pointerType === "mouse" && setH(true)} onPointerLeave={() => setH(false)} className="t-mono"
    style={{ border: 0, padding: "4px 0", background: "transparent", cursor: "pointer", color: h ? "var(--fg-1)" : "var(--fg-2)", textDecoration: h ? "underline" : "none", textUnderlineOffset: 3 }}>{children}</button>;
}

function PlaceCard({ pl, onClick }) {
  return (
    <PlTap onClick={onClick} style={{ width: 208, flexShrink: 0, padding: 6, display: "flex", flexDirection: "column" }}>
      <PlanMap height={92} radius={14} compact selected={pl} />
      <div style={{ padding: "10px 8px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, fontVariationSettings: "var(--fw-semibold)" }}>{pl.name}</span>
        <span className="t-footnote" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.reason} · {pl.walk} min</span>
      </div>
    </PlTap>
  );
}

function UpcomingRow({ p, onOpen }) {
  const { Icon } = PV_NS;
  const pl = plPlaceOf(p);
  return (
    <PlTap onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 14px 14px 16px" }}>
      <PlIconDisc icon={pl ? pl.icon : "calendar-check"} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="t-mono" style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="circle-check" size={12} strokeWidth={2} />confirmed</span>
        <span className="t-headline">{plTitle(p)}</span>
        <span className="t-footnote" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl ? pl.name : "place picked halfway"}</span>
      </div>
      <span style={{ color: "var(--fg-3)" }}><Icon name="chevron-right" size={16} strokeWidth={2} /></span>
    </PlTap>
  );
}

function PlansHomeSheet({ tab, onTab, cat, setCat, intent, setIntent, onFind, plans, interests, onOpenPlan, onAllPlans, planMode, onPlanMode, planPlace, setPlanPlace, onPlan }) {
  const { Button, Sheet, IconButton, Segmented, Chip } = PV_NS;
  const scroller = React.useRef(null);
  React.useEffect(() => { const el = scroller.current; if (el) el.scrollTo({ top: 0, behavior: "smooth" }); }, [planMode]);
  const pick = (c) => { if (!c || c.id === cat) { setCat(null); setIntent([]); } else { setCat(c.id); setIntent([c.intents[0]]); } };
  const date = tab === "date";
  const order = [...plans.filter((p) => p.kind === "proposal"), ...plans.filter((p) => p.status === "taken"), ...plans.filter((p) => p.kind === "confirmed").sort((a, b) => a.day - b.day), ...plans.filter((p) => p.kind === "invite" && p.status !== "taken")];
  const fresh = plans.filter((p) => p.kind === "proposal" || p.status === "taken").length;
  const places = plPlacesFor(tab, interests);
  const H = planMode ? 800 : cat ? 664 : 500;
  const fade = "linear-gradient(transparent, #000 10px, #000 calc(100% - 24px), transparent)";
  return (
    <Sheet material={false} padding={0} style={{ background: "transparent", boxShadow: "none" }}>
      <div style={{ height: H, display: "flex", flexDirection: "column" }}>
        <div ref={scroller} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "6px 20px 20px", display: "flex", flexDirection: "column", gap: 26, scrollbarWidth: "none", WebkitMaskImage: fade, maskImage: fade }}>
          {planMode ? (
            <div key="plan" style={{ display: "flex", flexDirection: "column", gap: 14, flexShrink: 0, animation: "jm-fade var(--dur-snappy) ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="t-mono" style={{ color: "var(--fg-2)" }}>plan for later · step 1 of 4</span>
                  <h2 className="t-large-title" style={{ margin: 0 }}>What's the plan?</h2>
                </div>
                <IconButton icon="x" label="Leave plan mode" variant="tint" size={40} onClick={() => onPlanMode(false)} />
              </div>
              <Segmented items={[{ value: "date", label: "Date", icon: "heart" }, { value: "mate", label: "Mate", icon: "users" }]} value={tab} onChange={onTab} />
            </div>
          ) : (
            <div key={tab} style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, animation: "jm-fade var(--dur-snappy) ease" }}>
              <MorphHeadline lines={HM_HEADLINES[tab]} paused={!!cat} />
              <div className="t-footnote">{date ? "Meet someone new over something you'd do anyway." : "Find company for something you'd do anyway."}</div>
            </div>
          )}
          <div style={{ flexShrink: 0 }}><CategoryBento key={tab} tab={tab} cat={cat} onPick={pick} intent={intent} setIntent={setIntent} /></div>
          {!planMode && (
            <PlSection label={`your plans${fresh ? ` · ${fresh} new` : ""}`} right={<PlTextLink onClick={onAllPlans}>see all</PlTextLink>}>
              {order.length ? order.slice(0, 3).map((p) => p.kind === "proposal" ? <ProposalRow key={p.id} p={p} onOpen={() => onOpenPlan(p)} />
                : p.kind === "confirmed" ? <UpcomingRow key={p.id} p={p} onOpen={() => onOpenPlan(p)} /> : <InviteRow key={p.id} p={p} onOpen={() => onOpenPlan(p)} />)
                : <div className="t-footnote" style={{ padding: "18px 16px", borderRadius: "var(--radius-row)", background: "var(--surface-chip)", textAlign: "center" }}>No plans yet. We'll propose some when a strong match is free when you are.</div>}
              {order.length > 3 && <Button variant="ghost" size="sm" onClick={onAllPlans}>{`See all ${order.length} plans`}</Button>}
              <Button variant="secondary" fullWidth leadingIcon="calendar-plus" onClick={() => { setPlanPlace(null); onPlanMode(true); }}>Plan for later</Button>
            </PlSection>
          )}
          {!planMode && (
            <PlSection label="places for you" right="from your interests">
              <div style={{ display: "flex", gap: 10, overflowX: "auto", margin: "-4px -20px 0", padding: "4px 20px 8px", scrollbarWidth: "none" }}>
                {places.map((p) => <PlaceCard key={p.id} pl={p} onClick={() => { setPlanPlace(p.id); onPlanMode(true); }} />)}
              </div>
            </PlSection>
          )}
        </div>
        {(cat || planMode) && (
          <div style={{ padding: "6px 20px 22px", animation: "jm-up var(--dur-default) var(--ease-spring)" }}>
            {planMode
              ? <Button fullWidth leadingIcon="calendar-plus" disabled={!intent.length} onClick={onPlan}>{intent.length ? `Plan ${jmPicksLabel(intent)}, then when` : "Pick what you'd do"}</Button>
              : <Button fullWidth leadingIcon="search" disabled={!intent.length} onClick={onFind}>{intent.length ? `Find people for ${jmPicksLabel(intent)}` : "Pick at least one"}</Button>}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function PlSection({ label, right, children }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 22, padding: "0 4px" }}>
        <span className="t-mono" style={{ color: "var(--fg-2)" }}>{label}</span>
        {right && (typeof right === "string" ? <span className="t-mono" style={{ color: "var(--fg-3)" }}>{right}</span> : right)}
      </div>
      {children}
    </section>
  );
}

function ProposalRow({ p, onOpen }) {
  const { Icon } = PV_NS;
  const pl = plPlaceOf(p);
  return (
    <PlTap onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 14px 14px 16px", animation: p.fresh ? "jm-up var(--dur-default) var(--ease-spring)" : "none" }}>
      <PlSwatch design={plDesign(p.vibe)} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="t-mono" style={{ color: "var(--fg-2)" }}>{p.mode} · <span style={{ color: "var(--fg-1)" }}>{p.match}% match</span></span>
        <span className="t-headline" style={{ textWrap: "pretty" }}>{plTitle(p)}</span>
        <span className="t-footnote" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl.name} · halfway for you both</span>
      </div>
      <span style={{ color: "var(--fg-3)" }}><Icon name="chevron-right" size={16} strokeWidth={2} /></span>
    </PlTap>
  );
}

function UpcomingCard({ p, onOpen }) {
  const { Icon } = PV_NS;
  const pl = plPlaceOf(p);
  return (
    <PlTap onClick={onOpen} level={3} radius="var(--radius-card)" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 0, animation: p.fresh ? "jm-up var(--dur-default) var(--ease-spring)" : "none" }}>
      {pl ? <PlanMap height={104} radius={16} compact selected={pl} /> : <div style={{ height: 64, borderRadius: 16, background: "var(--surface-chip)" }} />}
      <div style={{ padding: "12px 10px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="t-mono" style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="circle-check" size={13} strokeWidth={2} />confirmed · {p.mode}</span>
        <span className="t-headline">{plTitle(p)}</span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span className="t-footnote" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl ? pl.name : "place picked halfway"}</span>
          <span className="t-mono tabular" style={{ color: "var(--fg-2)", flexShrink: 0 }}>compass at {plMinus(p.time, 15)}</span>
        </div>
      </div>
    </PlTap>
  );
}

function InviteRow({ p, onOpen }) {
  const { Badge, Icon } = PV_NS;
  const pl = plPlaceOf(p);
  const taken = p.status === "taken";
  return (
    <PlTap onClick={onOpen} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 14px 14px 16px", animation: p.fresh ? "jm-up var(--dur-default) var(--ease-spring)" : "none" }}>
      <PlIconDisc icon={jmIntentIcon(p.mode, null, p.intents[0]) || "calendar"} solid={taken} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <span className="t-headline">{plTitle(p)}</span>
        <span className="t-footnote" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{pl ? pl.name : "place picked once someone's in"}</span>
      </div>
      <Badge color={taken ? "glow" : "gray"} variant="dot" size="sm">{taken ? "someone's in" : "open"}</Badge>
      <span style={{ color: "var(--fg-3)" }}><Icon name="chevron-right" size={16} strokeWidth={2} /></span>
    </PlTap>
  );
}

function PlansPage({ plans, onBack, onOpen, onNew }) {
  const { IconButton, Button } = PV_NS;
  const props = plans.filter((p) => p.kind === "proposal");
  const conf = plans.filter((p) => p.kind === "confirmed").sort((a, b) => a.day - b.day);
  const inv = plans.filter((p) => p.kind === "invite");
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "56px 16px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        <IconButton icon="arrow-left" label="Back to the map" variant="ghost" onClick={onBack} style={{ marginLeft: -8 }} />
        <h1 className="t-large-title" style={{ margin: 0 }}>Plans</h1>
        <p className="t-footnote" style={{ margin: 0 }}>Meet later, same rules. No faces, no chat.</p>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 26, scrollbarWidth: "none",
        WebkitMaskImage: "linear-gradient(transparent, #000 14px, #000 calc(100% - 20px), transparent)", maskImage: "linear-gradient(transparent, #000 14px, #000 calc(100% - 20px), transparent)" }}>
        <PlSection label={`proposed for you · ${props.length}`} right="by the matching model">
          {props.length ? props.map((p) => <ProposalRow key={p.id} p={p} onOpen={() => onOpen(p)} />)
            : <div className="t-footnote" style={{ padding: "18px 16px", borderRadius: "var(--radius-row)", background: "var(--surface-chip)", textAlign: "center" }}>Nothing proposed right now. We'll ping you when a strong match is free when you are.</div>}
        </PlSection>
        {conf.length > 0 && <PlSection label={`upcoming · ${conf.length}`}>{conf.map((p) => <UpcomingCard key={p.id} p={p} onOpen={() => onOpen(p)} />)}</PlSection>}
        <PlSection label={`your invitations · ${inv.length}`} right="you don't pick who">
          {inv.length ? inv.map((p) => <InviteRow key={p.id} p={p} onOpen={() => onOpen(p)} />)
            : <div className="t-footnote" style={{ padding: "18px 16px", borderRadius: "var(--radius-row)", background: "var(--surface-chip)", textAlign: "center" }}>Pick a time and a place. We offer it to compatible people.</div>}
        </PlSection>
      </div>
      <div style={{ padding: "8px 16px 34px" }}>
        <Button fullWidth leadingIcon="calendar-plus" onClick={onNew}>New plan</Button>
      </div>
    </div>
  );
}

// Ink card that drops from the island, like a match: a proposal from the model, or someone taking your invitation.
function PlanOfferCard({ plan, kind, pronoun, onAccept, onPass, onLater }) {
  const { Button, Chip, IconButton, Card, Icon } = PV_NS;
  const taker = kind === "taker";
  const v = taker ? plan.taker : plan.vibe;
  const match = taker ? plan.taker.match : plan.match;
  const [st, setSt] = React.useState("idle");
  const [placeId, setPlaceId] = React.useState(plan.place);
  const pl = plPlaceOf({ ...plan, place: placeId });
  const swapped = placeId !== plan.place;
  const accept = () => {
    if (taker) { setSt("both"); setTimeout(() => onAccept(placeId), 1100); return; }
    setSt("waiting"); setTimeout(() => setSt("both"), 1500); setTimeout(() => onAccept(placeId), 2600);
  };
  const busy = st !== "idle";
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", height: JM_PH - 19, display: "flex", flexDirection: "column", padding: "0 20px 22px", boxSizing: "border-box" }}>
      <IconButton icon="x" label="Decide later" variant="ghost" size={40} onClick={onLater} disabled={busy} style={{ position: "absolute", top: 14, right: 14, zIndex: 3 }} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <VibeBadge design={plDesign(v)} width={214} strap={28} fadeStrap={false} eyebrow={`${pronoun} vibe · ${match}%`} quote={v.q} tag={plan.mode === "date" ? "verified · 18+" : "verified"} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
          <span className="t-mono" style={{ color: "var(--fg-2)" }}>{taker ? "someone's in · your invitation" : `a plan for you · ${plan.mode}`}</span>
          {!taker && <span className="t-mono" style={{ color: "var(--fg-2)" }}>expires in {plan.expires}</span>}
        </div>
        <Card level={3} padding={0} style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", padding: "14px 16px 12px" }}>
            <div>
              <div className="t-mono" style={{ color: "var(--fg-2)" }}>{plDateMono(plan.day)}</div>
              <div className="t-title tabular" style={{ marginTop: 2 }}>{plCap(plDayWord(plan.day))}, {plan.time}</div>
            </div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px 0 10px", borderRadius: 999, background: "var(--tint)", fontSize: 13, fontWeight: 600, fontVariationSettings: "var(--fw-semibold)" }}>
              <Icon name={jmIntentIcon(plan.mode, null, plan.intents[0])} size={15} strokeWidth={2} />{jmPicksLabel(plan.intents)}
            </span>
          </div>
          {pl && <PlanMap height={104} radius={16} compact selected={pl} style={{ margin: "0 8px" }} />}
          <div style={{ padding: "12px 16px 14px" }}>
            <div className="t-headline">{pl ? pl.name : "Picked halfway once you confirm"}</div>
            <div className="t-footnote" style={{ marginTop: 2 }}>{pl ? (taker ? plPlaceMeta(pl) : `${pl.kind} · ${pl.walk} min for you, ${plan.walkThem} for them`) : "fits both of you, open at that time"}</div>
          </div>
        </Card>
        {!taker && plan.alts && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", margin: "0 -20px", padding: "0 20px", scrollbarWidth: "none" }}>
            {[plan.place, ...plan.alts].map((id) => { const x = plPlace(id); return <Chip key={id} size="sm" icon={x.icon} selected={placeId === id} disabled={busy} onClick={() => setPlaceId(id)}>{x.name}</Chip>; })}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 4 }}>
          {st === "waiting" ? <Button variant="secondary" fullWidth disabled>waiting for them…</Button>
            : st === "both" ? <div className="t-headline" style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 999, background: "var(--tint)", color: "var(--success)" }}><Icon name="circle-check" size={18} strokeWidth={2} />you're both in</div>
            : <Button variant="glow" fullWidth leadingIcon="calendar-check" onClick={accept}>{taker ? "Confirm plan" : swapped ? "Suggest this place" : "Accept plan"}</Button>}
          <Button variant="ghost" fullWidth size="md" disabled={busy} onClick={onPass}>Pass</Button>
          <span className="t-footnote" style={{ textAlign: "center", paddingTop: 2 }}>
            {taker ? "If you pass, it goes to someone else. They only see 'plan filled'." : swapped ? "They see your pick and accept it, or it expires." : "Confirms only if they accept too."}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlanStepRow({ icon, label, value, last }) {
  const { Icon } = PV_NS;
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, minHeight: 48, padding: "4px 16px" }}>
      <span style={{ color: "var(--fg-2)" }}><Icon name={icon} size={18} strokeWidth={1.5} /></span>
      <span style={{ flex: 1, fontSize: 15, lineHeight: "20px" }}>{label}</span>
      <span className="t-mono tabular" style={{ color: "var(--fg-2)" }}>{value}</span>
      {!last && <span style={{ position: "absolute", left: 46, right: 0, bottom: 0, height: 1, background: "var(--separator)" }} />}
    </div>
  );
}

function PlanDetail({ plan, now, onBack, onCompass, onCancel, onOpenTaker }) {
  const { IconButton, Button, VibeCard, Card, Icon } = PV_NS;
  const [ask, setAsk] = React.useState(false);
  if (!plan) return null;
  const pl = plPlaceOf(plan);
  const conf = plan.kind === "confirmed";
  const taken = plan.status === "taken";
  const opens = plMinus(plan.time, 15);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: 300, flexShrink: 0 }}>
        {pl ? <PlanMap height={300} radius={0} compact selected={pl} cy0={0.56} /> : <div style={{ height: 300, background: "var(--map-bg)" }} />}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 70, background: "linear-gradient(transparent, var(--background))", pointerEvents: "none" }} />
        <IconButton icon="arrow-left" label="Back to plans" onClick={onBack} style={{ position: "absolute", top: 56, left: 16, boxShadow: "inset 0 1px 0 0 var(--hairline-top), var(--shadow-3)", backdropFilter: "var(--blur-thin)", WebkitBackdropFilter: "var(--blur-thin)" }} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 16px 12px", marginTop: -18, position: "relative", display: "flex", flexDirection: "column", gap: 16, scrollbarWidth: "none" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {conf ? <span className="t-mono" style={{ color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="circle-check" size={13} strokeWidth={2} />confirmed · {plan.mode} · {plDateMono(plan.day)}</span>
            : <span className="t-mono" style={{ color: "var(--fg-2)" }}>your invitation · {taken ? "someone's in" : "open"} · {plSlots(plan).length > 1 ? `${plSlots(plan).length} times` : plDateMono(plan.day)}</span>}
          <h1 className="t-large-title" style={{ margin: 0, textWrap: "balance" }}>{plTitle(plan)}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PlIconDisc icon={pl ? pl.icon : "sparkles"} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-headline">{pl ? pl.name : "Picked once someone's in"}</div>
            <div className="t-footnote">{pl ? `${plPlaceMeta(pl)} · ${pl.hours}` : "halfway between you, fits the plan"}</div>
          </div>
        </div>
        {conf ? <VibeCard compact eyebrow="who you're meeting" quote={plan.vibe.q} style={{ flexShrink: 0 }} />
          : <Card level={2} padding={16} style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
              <span className="t-headline">You don't pick who.</span>
              <span className="t-footnote" style={{ color: "var(--fg-2)" }}>We offer it to compatible people free at one of your times. The first one in picks a time, shows up here as a vibe, and you confirm.</span>
            </Card>}
        {!conf && plSlots(plan).length > 1 && (
          <Card level={2} padding={0} style={{ overflow: "hidden", flexShrink: 0 }}>
            {plSlotGroups(plSlots(plan)).map((g, i, all) => <PlanStepRow key={g.day} icon="clock" label={plCap(plDayWord(g.day))} value={g.times.join(" · ")} last={i === all.length - 1} />)}
          </Card>
        )}
        <Card level={2} padding={0} style={{ overflow: "hidden", flexShrink: 0 }}>
          {conf ? <>
            <PlanStepRow icon="bell" label="Reminder" value={plMinus(plan.time, 120)} />
            <PlanStepRow icon="compass" label="Compass opens" value={opens} />
            <PlanStepRow icon="user" label="Names unlock" value="when you meet" last />
          </> : <>
            <PlanStepRow icon="users" label="Offered to" value="compatible · free then" />
            <PlanStepRow icon="timer" label="Open until" value={plan.until === "2h" ? "2 h before" : "the day before"} />
            <PlanStepRow icon="eye-off" label="They see" value="vibe · place · time" last />
          </>}
        </Card>
      </div>
      <div style={{ padding: "8px 16px 34px", display: "flex", flexDirection: "column", gap: 4 }}>
        {conf && !ask && <>
          <Button variant={now ? "glow" : "secondary"} fullWidth leadingIcon="compass" disabled={!now} onClick={onCompass}>{now ? "Open compass" : `Compass opens at ${opens}`}</Button>
          <Button variant="ghost" size="md" fullWidth onClick={() => setAsk(true)}>Can't make it</Button>
        </>}
        {conf && ask && <>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" fullWidth onClick={() => setAsk(false)}>Keep it</Button>
            <Button variant="danger" fullWidth leadingIcon="x" onClick={onCancel}>Cancel plan</Button>
          </div>
          <span className="t-footnote" style={{ textAlign: "center", paddingTop: 6 }}>They see "plan cancelled". No reason asked.</span>
        </>}
        {!conf && (taken
          ? <Button variant="glow" fullWidth leadingIcon="sparkles" onClick={onOpenTaker}>See who's in</Button>
          : <Button variant="secondary" fullWidth leadingIcon="x" onClick={onCancel}>Withdraw invitation</Button>)}
      </div>
    </div>
  );
}

Object.assign(window, { PlansHomeSheet, PlansPage, PlanOfferCard, PlanDetail });
