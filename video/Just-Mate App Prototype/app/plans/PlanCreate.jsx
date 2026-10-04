// Plan flow after "what" (picked on the home sheet in plan mode): when (several days, several times each) → where (sheet over the map) → review.
const PC_NS = window.JustMateDesignSystem_dee067;
const PC_TIMES = ["09:00", "11:00", "13:00", "15:00", "17:30", "18:00", "19:00", "19:30", "20:00", "21:00"];
const PL_WHERE_H = 520;
const pcTimesFor = (day) => { const hr = new Date().getHours() + 1; return PC_TIMES.filter((t) => day !== 0 || Number(t.slice(0, 2)) > hr); };
const pcSlots = (d) => Object.keys(d.slots).map(Number).sort((a, b) => a - b).flatMap((day) => d.slots[day].map((time) => ({ day, time })));

function PlaceRow({ pl, selected, onClick, last }) {
  const { Icon } = PC_NS;
  const [h, setH] = React.useState(false);
  return (
    <div role="button" onClick={onClick} onPointerEnter={(e) => e.pointerType === "mouse" && setH(true)} onPointerLeave={() => setH(false)}
      style={{ position: "relative", display: "flex", alignItems: "center", gap: 12, minHeight: 64, padding: "8px 14px", cursor: "pointer", background: h ? "var(--hover)" : "transparent", transition: "background-color var(--dur-fast) ease" }}>
      <PlIconDisc icon={pl.icon} solid={selected} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, lineHeight: "21px", fontWeight: 600, fontVariationSettings: selected || h ? "var(--fw-semibold)" : "var(--fw-medium)" }}>{pl.name}</div>
        <div className="t-footnote" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{plPlaceMeta(pl)} · {pl.hours}</div>
      </div>
      <span style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: selected ? "var(--fg-1)" : "transparent", color: "var(--background)", boxShadow: selected ? "none" : "inset 0 0 0 1.5px var(--border)" }}>
        {selected && <Icon name="check" size={14} strokeWidth={2.5} />}
      </span>
      {!last && <span style={{ position: "absolute", left: 66, right: 0, bottom: 0, height: 1, background: "var(--separator)" }} />}
    </div>
  );
}

function PcWhen({ d, set, eyebrow, next }) {
  const { Button, Chip, Switch, Card, IconButton } = PC_NS;
  const days = Object.keys(d.slots).map(Number).sort((a, b) => a - b);
  const total = pcSlots(d).length;
  const toggleDay = (k) => {
    const s = { ...d.slots };
    if (k in s) delete s[k];
    else { const prev = days.length ? d.slots[days[days.length - 1]] : []; s[k] = prev.filter((t) => pcTimesFor(k).includes(t)); }
    set({ slots: s });
  };
  const toggleTime = (k, t) => set({ slots: { ...d.slots, [k]: jmToggle(d.slots[k], t).sort() } });
  const sameForAll = () => { const base = d.slots[days[0]]; const s = {}; days.forEach((k) => (s[k] = base.filter((t) => pcTimesFor(k).includes(t)))); set({ slots: s }); };
  const first = days.length ? d.slots[days[0]] : [];
  const canCopy = days.length > 1 && first.length > 0 && days.some((k) => d.slots[k].join() !== first.filter((t) => pcTimesFor(k).includes(t)).join());
  return (
    <ObStep eyebrow={eyebrow} title="When works?" sub="Pick every day and time you could make. More options reach more people."
      cta={<Button fullWidth disabled={!total} onClick={next}>{total ? `${total} time${total > 1 ? "s" : ""}, then where` : "Pick a day and a time"}</Button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        <FieldLabel right={days.length ? `${days.length} picked` : null}>days</FieldLabel>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px", padding: "2px 16px", scrollbarWidth: "none" }}>
          {Array.from({ length: 10 }, (_, i) => <Chip key={i} selected={i in d.slots} icon={i in d.slots ? "check" : undefined} onClick={() => toggleDay(i)}>{plDayChip(i)}</Chip>)}
        </div>
      </div>
      {days.length === 0 && <div className="t-footnote" style={{ padding: "18px 16px", borderRadius: "var(--radius-row)", background: "var(--surface-chip)", textAlign: "center", flexShrink: 0 }}>Pick one or more days, then the times for each.</div>}
      {days.map((k) => {
        const times = pcTimesFor(k);
        return (
          <Card key={k} level={2} padding={14} style={{ display: "flex", flexDirection: "column", gap: 10, flexShrink: 0, animation: "jm-up var(--dur-default) var(--ease-spring)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginRight: -6 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="t-headline">{plCap(plDayWord(k))}</span>
                <span className="t-mono" style={{ color: "var(--fg-2)" }}>{plDateMono(k)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span className="t-mono tabular" style={{ color: d.slots[k].length ? "var(--fg-1)" : "var(--fg-3)" }}>{d.slots[k].length ? `${d.slots[k].length} time${d.slots[k].length > 1 ? "s" : ""}` : "pick times"}</span>
                <IconButton icon="x" label={`Remove ${plDayWord(k)}`} variant="ghost" size={32} onClick={() => toggleDay(k)} />
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {times.length ? times.map((t) => <Chip key={t} size="sm" selected={d.slots[k].includes(t)} onClick={() => toggleTime(k, t)}><span className="tabular">{t}</span></Chip>)
                : <span className="t-footnote">Too late for today.</span>}
            </div>
          </Card>
        );
      })}
      {canCopy && <div style={{ display: "flex", justifyContent: "center", flexShrink: 0 }}><Button variant="ghost" size="sm" leadingIcon="shuffle" onClick={sameForAll}>{`Use ${plDayWord(days[0])}'s times for every day`}</Button></div>}
      <Card level={2} padding={0} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, lineHeight: "22px" }}>Flexible by 30 min</div>
          <div className="t-footnote">Reaches people who are almost free.</div>
        </div>
        <Switch checked={d.flex} onToggle={() => set({ flex: !d.flex })} />
      </Card>
    </ObStep>
  );
}

// "Where" is its own shape: the page drops into a tall sheet so the map with places shows above it.
function PlanWhereSheet({ d, set, onBack, onNext, onExit }) {
  const { Button, IconButton, StepDots, Sheet, Card } = PC_NS;
  const [q, setQ] = React.useState("");
  const chosen = d.spot ? plPlaceOf({ spot: d.spot }) : d.place ? plPlace(d.place) : null;
  const list = PL_PLACES.filter((p) => !q || (p.name + " " + p.kind).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (plFits(b, d.intents) - plFits(a, d.intents)) || a.walk - b.walk);
  const rows = d.spot && !q ? [chosen, ...list] : list;
  return (
    <Sheet material={false} padding={0} style={{ background: "transparent", boxShadow: "none" }}>
      <div style={{ height: PL_WHERE_H, display: "flex", flexDirection: "column", gap: 12, padding: "0 16px 24px", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 40 }}>
          <IconButton icon="arrow-left" label="Back" variant="ghost" size={40} onClick={onBack} />
          <StepDots count={4} active={2} />
          <IconButton icon="x" label="Close" variant="ghost" size={40} onClick={onExit} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 2px" }}>
          <span className="t-mono" style={{ color: "var(--fg-2)" }}>plan for later · 3 of 4</span>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <h1 className="t-large-title" style={{ margin: 0 }}>Where?</h1>
            <span className="t-footnote">tap the map or search</span>
          </div>
        </div>
        <TextField value={q} onChange={setQ} placeholder="Search bars, cafés, parks" />
        <Card level={2} padding={0} style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollbarWidth: "none" }}>
          {rows.length ? rows.map((p, i) => <PlaceRow key={p.id} pl={p} selected={!!chosen && chosen.id === p.id} onClick={() => set(p.id === "spot" ? {} : { place: p.id, spot: null })} last={i === rows.length - 1} />)
            : <div className="t-footnote" style={{ padding: 18, textAlign: "center" }}>Nothing called “{q}” nearby. Tap the map instead.</div>}
        </Card>
        <Button fullWidth disabled={!chosen} onClick={onNext}>{chosen ? `${chosen.name}, then review` : "Pick a place"}</Button>
      </div>
    </Sheet>
  );
}

// Map layer shown above the where-sheet: venues are tappable, blank map drops your own spot.
function PlanWhereMap({ visible, d, set }) {
  const chosen = d ? (d.spot ? plPlaceOf({ spot: d.spot }) : d.place ? plPlace(d.place) : null) : null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 5, background: "var(--map-bg)", opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none", transition: "opacity var(--dur-default) ease" }}>
      <div style={{ position: "absolute", inset: 0, background: PL_STREETS }} />
      {d && <PlanMap bare height={JM_PH - PL_WHERE_H - 100} radius={0} selected={chosen} onPick={(p) => set({ place: p.id, spot: null })} onSpot={(s) => set({ spot: s, place: null })} style={{ position: "absolute", top: 70, left: 0, right: 0 }} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 72, background: "linear-gradient(var(--background), transparent)", pointerEvents: "none" }} />
    </div>
  );
}

function PcReview({ d, set, eyebrow, onSend, goto }) {
  const { Button, Card, Segmented, Icon } = PC_NS;
  const pl = plPlaceOf({ spot: d.spot, place: d.place });
  const slots = pcSlots(d);
  const groups = plSlotGroups(slots);
  const row = (icon, label, value, step, last, sub) => (
    <div role="button" onClick={() => goto(step)} style={{ position: "relative", display: "flex", alignItems: sub ? "flex-start" : "center", gap: 12, minHeight: 52, padding: sub ? "14px 16px 12px" : "6px 16px", cursor: "pointer" }}>
      <span style={{ color: "var(--fg-2)", paddingTop: sub ? 1 : 0 }}><Icon name={icon} size={20} strokeWidth={1.5} /></span>
      <span className="t-mono" style={{ width: 52, color: "var(--fg-2)", paddingTop: sub ? 4 : 0 }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 16, lineHeight: "22px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
        {sub && sub.map((x) => <span key={x} className="t-footnote tabular">{x}</span>)}
      </div>
      <span style={{ color: "var(--fg-3)", paddingTop: sub ? 2 : 0 }}><Icon name="pencil" size={15} strokeWidth={1.75} /></span>
      {!last && <span style={{ position: "absolute", left: 48, right: 0, bottom: 0, height: 1, background: "var(--separator)" }} />}
    </div>
  );
  const when = slots.length === 1 ? `${plCap(plDayWord(slots[0].day))} ${slots[0].time}` : `${slots.length} times · ${groups.length} day${groups.length > 1 ? "s" : ""}`;
  return (
    <ObStep eyebrow={eyebrow} title="Send it out?" sub="You don't pick who. One compatible person free at one of your times can take it."
      cta={<Button fullWidth leadingIcon="send" onClick={onSend}>Send invitation</Button>}>
      <Card level={2} padding={0} style={{ overflow: "hidden", flexShrink: 0 }}>
        {pl && <PlanMap height={110} radius={16} compact selected={pl} style={{ margin: 8 }} />}
        {row(jmIntentIcon(d.mode, d.cat, d.intents[0]), "what", `${jmPicksLabel(d.intents)} · ${d.mode}`, "what")}
        {row("clock", "when", when + (d.flex ? " ± 30 min" : ""), 0, false, slots.length > 1 ? groups.map((g) => `${plDayChip(g.day)} · ${g.times.join(", ")}`) : null)}
        {row(pl ? pl.icon : "map-pin", "where", pl ? pl.name : "pick a place", 1, true)}
      </Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        <FieldLabel>keep it open until</FieldLabel>
        <Segmented items={[{ value: "2h", label: "2 h before" }, { value: "day", label: "the day before" }]} value={d.until} onChange={(v) => set({ until: v })} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 4px 0", flexShrink: 0 }}>
        {[["users", "We offer it to compatible people, one at a time."], ["circle-check", "When someone's in, you see their vibe and the time they picked, then confirm."], ["eye-off", "No faces, no names. Just a vibe, a place and a time."]].map(([ic, t]) => (
          <div key={ic} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "var(--fg-2)", paddingTop: 1 }}><Icon name={ic} size={16} strokeWidth={1.75} /></span>
            <span className="t-footnote" style={{ color: "var(--fg-1)" }}>{t}</span>
          </div>
        ))}
      </div>
    </ObStep>
  );
}

// Full-page part of the flow: step 0 = when, step 2 = review. Step 1 (where) lives in its own sheet shape.
function PlanCreate({ draft, setDraft, step = 0, onWhere, onEditWhat, onSend, onBack, onExit }) {
  const { IconButton, StepDots } = PC_NS;
  const [i, setI] = React.useState(step === 2 ? 2 : 0);
  const [dir, setDir] = React.useState(1);
  const set = (patch) => setDraft((x) => ({ ...x, ...patch }));
  const goto = (k) => { if (k === "what") onEditWhat(); else if (k === 1) onWhere(); else { setDir(-1); setI(k); } };
  const next = () => onWhere();
  const back = () => (i === 0 ? onBack() : onWhere());
  const props = { d: draft, set, next, goto, onSend, eyebrow: `plan for later · ${i === 0 ? 2 : 4} of 4` };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "56px 16px 34px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 44 }}>
        <IconButton icon="arrow-left" label="Back" variant="ghost" onClick={back} />
        <StepDots count={4} active={i === 0 ? 1 : 3} />
        <IconButton icon="x" label="Close" variant="ghost" onClick={onExit} />
      </div>
      <div key={i} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", animation: `${dir > 0 ? "ob-next" : "ob-back"} var(--dur-default) var(--ease-spring)` }}>
        {i === 0 && <PcWhen {...props} />}
        {i === 2 && <PcReview {...props} />}
      </div>
    </div>
  );
}
Object.assign(window, { PlanCreate, PlanWhereSheet, PlanWhereMap, pcSlots });
