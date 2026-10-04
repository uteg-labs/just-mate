import { interpolate, useCurrentFrame } from "remotion"
import { clamp, lerp, rnd, sp } from "../anim"
import { Mark, Mono, Wordmark } from "../components/brand"
import { Icon } from "../components/Icon"
import { Badge, Button, Fill, Glow, Grid, Rise } from "../components/ui"
import { c, font, H, W } from "../theme"

type S = { dur: number }

export const WarmBg = ({ children, f }: { children?: React.ReactNode; f: number }) => (
  <Fill bg={c.cream}>
    <Grid color="rgba(120,80,20,0.045)" street="rgba(255,255,255,0.7)" />
    <Glow x={260 + Math.sin(f / 40) * 30} y={220} r={620} color="rgba(55,194,179,0.22)" />
    <Glow x={1700} y={160 + Math.cos(f / 50) * 30} r={620} color="rgba(255,197,111,0.40)" />
    {children}
  </Fill>
)

export const NightBg = ({ children, f }: { children?: React.ReactNode; f: number }) => (
  <Fill bg={c.ink}>
    <Glow x={300 + Math.sin(f / 30) * 20} y={120} r={520} color="rgba(255,178,63,0.16)" />
    <Glow x={1650} y={200} r={560} color="rgba(255,122,26,0.12)" />
    <Glow x={960} y={1150} r={900} color="rgba(255,178,63,0.14)" />
    {children}
  </Fill>
)

export const fadeTo = (f: number, dur: number, color: string, len = 4) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: color,
      opacity: interpolate(f, [dur - len, dur], [0, 1], clamp),
    }}
  />
)

// haptic pattern [200, 100, 200] ms → two 6-frame bursts with a 3-frame gap
export const buzz = (f: number, at: number) => {
  const l = f - at
  return (l >= 0 && l < 6) || (l >= 9 && l < 15) ? Math.sin(l * 2.6) * 9 : 0
}

// 5 · The three rules — three colour panels slam in on the beat.
export const RULES_AT = [0, 156, 226]
// The three promises: matching (own AI model), Plan (we make the plan), Now (meet right away).
const RULES = [
  {
    title: "We find your people.",
    sub: "our own AI · trained to find people you'll actually talk to",
    bg: c.glow,
    fg: c.onGlow,
    icon: "users",
  },
  {
    title: "We make the plan.",
    sub: "one small plan nearby · you only say yes",
    bg: c.mint,
    fg: "#06302B",
    icon: "calendar-heart",
  },
  {
    title: "Already out? Meet now.",
    sub: "someone nearby wants the same · both phones ping",
    bg: c.ink,
    fg: c.white,
    icon: "compass",
  },
]
export const Rules = ({ dur }: S) => {
  const f = useCurrentFrame()
  const pw = W / 3
  return (
    <Fill bg={c.glow}>
      {RULES.map((r, i) => {
        const t = sp(f, RULES_AT[i], 14)
        const ty = i === 0 ? 0 : (1 - t) * H
        const txt = sp(f, RULES_AT[i] + 4, 14)
        return (
          <div
            key={r.title}
            style={{
              position: "absolute",
              left: i * pw,
              top: 0,
              width: W - i * pw,
              height: H,
              background: r.bg,
              transform: `translateY(${i % 2 ? ty : -ty}px)`,
              overflow: "hidden",
            }}
          >
            {i === 2 && (
              <Glow
                x={pw / 2}
                y={800}
                r={260}
                color="rgba(255,178,63,0.6)"
                opacity={0.6 + 0.4 * Math.sin(f / 7)}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: 70,
                top: 300,
                width: pw - 120,
                opacity: txt,
                transform: `translateY(${(1 - txt) * 40}px)`,
              }}
            >
              <Icon name={r.icon} size={110} color={r.fg} stroke={1.6} />
              <div
                style={{
                  fontFamily: font,
                  fontWeight: 750,
                  fontSize: 96,
                  letterSpacing: -4,
                  lineHeight: 1.02,
                  color: r.fg,
                  marginTop: 50,
                }}
              >
                {r.title}
              </div>
              <div style={{ marginTop: 26 }}>
                <Mono
                  color={r.fg}
                  size={24}
                  style={{ opacity: 0.75, whiteSpace: "normal", lineHeight: 1.4 }}
                >
                  {r.sub}
                </Mono>
              </div>
            </div>
          </div>
        )
      })}
      {fadeTo(f, dur, c.cream)}
    </Fill>
  )
}

// 6 · The app proposes one plan with one person; Tomek only says yes.
export const PLAN_TAP = 128

// ola-name is mia-name with the name swapped, so mia-quote is her vibe side
export const OLA = { vibe: "mia-quote", name: "ola-name" }

const Row = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, height: 52 }}>
    <Icon name={icon} size={30} color={c.fg2} stroke={1.8} />
    <span
      style={{ fontFamily: font, fontSize: 29, fontWeight: 500, color: c.fg, letterSpacing: -0.4 }}
    >
      {children}
    </span>
  </div>
)

export const Plan = ({ dur, short = false, tapAt }: S & { short?: boolean; tapAt?: number }) => {
  const f = useCurrentFrame()
  const tap = tapAt ?? (short ? PLAN_TAP - 6 : PLAN_TAP)
  const card = sp(f, 4, 22)
  const inn = f >= tap
  const drop = sp(f, 14, 24, true)
  const ripple = lerp(f, tap - 4, tap + 14, 0, 1)
  return (
    <WarmBg f={f}>
      <div style={{ position: "absolute", left: 120, top: 300, width: 760 }}>
        <div style={{ opacity: sp(f, 2, 12) }}>
          <Mono size={22}>sunday · 21:40</Mono>
        </div>
        <Rise text="One small plan." size={96} color={c.fg} delay={8} style={{ marginTop: 20 }} />
        <div
          style={{
            marginTop: 16,
            opacity: sp(f, 70, 14),
            transform: `translateY(${(1 - sp(f, 70, 14)) * 20}px)`,
          }}
        >
          <span
            style={{
              fontFamily: font,
              fontWeight: 750,
              fontSize: 96,
              letterSpacing: -4,
              color: c.fg,
              whiteSpace: "nowrap",
            }}
          >
            He only says{" "}
            <span style={{ background: `linear-gradient(transparent 62%, ${c.glow}99 62%)` }}>
              yes.
            </span>
          </span>
        </div>
        <div style={{ marginTop: 40, opacity: sp(f, 90, 12) }}>
          <Mono size={20}>one person · the app does the planning</Mono>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 910,
          top: 180,
          width: 880,
          padding: 48,
          boxSizing: "border-box",
          borderRadius: 44,
          background: c.white,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 40px 90px rgba(80,50,10,0.14)",
          opacity: card,
          transform: `translateY(${(1 - card) * 160}px)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Mono size={20}>a plan for you · mate</Mono>
          <Mono size={20}>expires in 6 h</Mono>
        </div>
        <div style={{ display: "flex", gap: 36, marginTop: 20 }}>
          <div
            style={{
              transform: `translateY(${(1 - drop) * -500}px) rotate(${Math.sin(f / 20) * 1.5}deg)`,
              transformOrigin: "50% 0",
            }}
          >
            <Badge id={OLA.vibe} width={230} />
          </div>
          <div style={{ paddingTop: 70 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 999,
                  background: c.fg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="dice-5" size={44} color={c.white} stroke={1.75} />
              </div>
              <div>
                <Mono size={18}>you both picked</Mono>
                <div
                  style={{
                    fontFamily: font,
                    fontWeight: 750,
                    fontSize: 60,
                    letterSpacing: -2.2,
                    color: c.fg,
                    lineHeight: 1.05,
                    marginTop: 4,
                  }}
                >
                  board games
                </div>
              </div>
            </div>
            <div style={{ marginTop: 26 }}>
              <Row icon="map-pin">Games café · public venue</Row>
              <Row icon="clock">Thu 19:00 · you're both free</Row>
              <Row icon="footprints">9 min for you, 7 for them</Row>
            </div>
          </div>
        </div>
        <div
          style={{ marginTop: 30, fontFamily: font, fontSize: 25, lineHeight: 1.35, color: c.fg2 }}
        >
          Confirms only if they accept too. If you pass, it goes to someone else.
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 26, position: "relative" }}>
          <Button variant={inn ? "secondary" : "glow"} size={32} style={{ flex: 1 }}>
            {inn ? "waiting for them…" : "Accept plan"}
          </Button>
          <Button variant="ghost" size={30}>
            Pass
          </Button>
          {ripple > 0 && ripple < 1 && (
            <div
              style={{
                position: "absolute",
                left: 270 - ripple * 150,
                top: 35 - ripple * 150,
                width: ripple * 300,
                height: ripple * 300,
                borderRadius: 999,
                background: `rgba(255,178,63,${0.45 * (1 - ripple)})`,
              }}
            />
          )}
        </div>
      </div>
      {fadeTo(f, dur, c.cream)}
    </WarmBg>
  )
}

// 7 · They accept too — "you're both in" on both phones at the same moment.
export const ON_TAP = 90
export const ON_AT = 100
const MiniPhone = ({ f, you, at, tap }: { f: number; you: boolean; at: number; tap: number }) => {
  const on = f >= at
  const pop = sp(f, at, 12, true)
  const press = you ? 0 : Math.sin(lerp(f, tap, tap + 8, 0, 1) * Math.PI)
  const idle = you
    ? { background: "#EDEDEF", color: c.fg2, label: "waiting for them…" }
    : { background: c.glow, color: c.onGlow, label: "Accept plan" }
  return (
    <div
      style={{
        width: 330,
        height: 620,
        padding: 10,
        borderRadius: 54,
        background: "linear-gradient(145deg,#3a3a3e,#111114 40%,#2a2a2e)",
        boxSizing: "border-box",
        boxShadow: `0 30px 70px rgba(0,0,0,0.22)${on ? `, 0 0 ${90 * pop}px rgba(48,209,88,0.45)` : ""}`,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 44,
          overflow: "hidden",
          position: "relative",
          background: "#ECECEE",
        }}
      >
        <Grid color="rgba(0,0,0,0.04)" step={40} street="rgba(255,255,255,0.9)" />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 12,
            width: 96,
            height: 28,
            marginLeft: -48,
            borderRadius: 20,
            background: "#000",
          }}
        />
        <div style={{ position: "absolute", left: 132, top: 120 }}>
          <Icon name="map-pin" size={48} color={c.glow} stroke={2.2} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 10,
            right: 10,
            bottom: 10,
            borderRadius: 34,
            background: c.white,
            padding: 22,
            boxShadow: "0 -10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                background: c.fg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="dice-5" size={28} color={c.white} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: font,
                  fontWeight: 700,
                  fontSize: 28,
                  color: c.fg,
                  letterSpacing: -0.8,
                }}
              >
                board games
              </div>
              <Mono size={13}>thu 19:00 · games café</Mono>
            </div>
          </div>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Mono size={14} color={c.fg}>
              {you ? 9 : 7} min on foot
            </Mono>
            <Mono size={13}>one person</Mono>
          </div>
          <div
            style={{
              marginTop: 16,
              height: 54,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontFamily: font,
              fontWeight: 650,
              fontSize: on ? 24 : 21,
              background: on ? c.success : idle.background,
              color: on ? c.white : idle.color,
              transform: `scale(${on ? 0.9 + pop * 0.1 : 1 - press * 0.06})`,
            }}
          >
            {on && <Icon name="circle-check" size={26} color={c.white} stroke={2.2} />}
            {on ? "you're both in" : idle.label}
          </div>
        </div>
      </div>
    </div>
  )
}

const PHONES = ["your phone", "their phone"]
export const On = ({ dur, at = ON_AT, tap = ON_TAP }: S & { at?: number; tap?: number }) => {
  const f = useCurrentFrame()
  const before = 1 - sp(f, at - 6, 10)
  const after = sp(f, at, 14, true)
  return (
    <WarmBg f={f}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 70,
          textAlign: "center",
          height: 160,
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, opacity: at >= 30 ? before : 0 }}>
          <Rise
            text="On only when you both say yes."
            size={66}
            color={c.fg}
            delay={4}
            stagger={2}
            style={{ justifyContent: "center" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -20,
            opacity: after,
            transform: `scale(${0.8 + after * 0.2})`,
          }}
        >
          <span
            style={{
              fontFamily: font,
              fontWeight: 750,
              fontSize: 130,
              letterSpacing: -6,
              color: c.fg,
            }}
          >
            You're both in.
          </span>
        </div>
      </div>
      {PHONES.map((who, i) => {
        const enter = sp(f, 4 + i * 5, 20)
        const shake = buzz(f, at)
        const side = i * 2 - 1
        return (
          <div
            key={who}
            style={{
              position: "absolute",
              left: 960 + side * 240 - 165,
              top: 260 + (1 - enter) * 500,
              transform: `translateX(${shake}px) rotate(${side * 3 + shake * 0.3}deg)`,
            }}
          >
            <MiniPhone f={f} you={i === 0} at={at} tap={tap} />
            <div style={{ textAlign: "center", marginTop: 22 }}>
              <Mono size={17} color={i === 0 ? c.fg : c.fg2}>
                {who}
              </Mono>
            </div>
          </div>
        )
      })}
      {fadeTo(f, dur, c.cream)}
    </WarmBg>
  )
}

// 8 · Thursday. The compass opens 15 minutes before — the venue is the only pin on the map.
const ROUTE: [number, number][] = [
  [980, 1010],
  [980, 700],
  [1200, 700],
  [1200, 380],
  [1480, 380],
]
const along = (t: number) => {
  const seg = ROUTE.slice(1).map((p, i) => Math.hypot(p[0] - ROUTE[i][0], p[1] - ROUTE[i][1]))
  let d = t * seg.reduce((a, b) => a + b, 0)
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = d / seg[i]
      return [
        ROUTE[i][0] + (ROUTE[i + 1][0] - ROUTE[i][0]) * k,
        ROUTE[i][1] + (ROUTE[i + 1][1] - ROUTE[i][1]) * k,
      ]
    }
    d -= seg[i]
  }
  return ROUTE[ROUTE.length - 1]
}

export const OPEN_AT = 46
export const Opens = ({ dur }: S) => {
  const f = useCurrentFrame()
  const draw = lerp(f, 6, 34, 0, 1)
  const walk = lerp(f, 30, dur, 0, 0.45)
  const [sx, sy] = along(walk)
  const pin = sp(f, 10, 14, true)
  const card = sp(f, 6, 18)
  const pathD = `M ${ROUTE.map((p) => p.join(" ")).join(" L ")}`
  return (
    <Fill bg="#F1EEE8">
      <Grid color="rgba(0,0,0,0.035)" street="rgba(255,255,255,0.95)" />
      <svg aria-hidden="true" width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path
          d={pathD}
          fill="none"
          stroke={c.fg}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 22"
          pathLength={1000}
          strokeDashoffset={0}
          style={{ opacity: 0.55 }}
          clipPath="url(#reveal)"
        />
        <defs>
          <clipPath id="reveal">
            <rect x={0} y={0} width={W} height={H} transform={`translate(${-(1 - draw) * W} 0)`} />
          </clipPath>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          left: 1480 - 42,
          top: 380 - 84,
          transform: `scale(${pin})`,
          transformOrigin: "50% 100%",
        }}
      >
        <svg aria-hidden="true" width={84} height={96} viewBox="0 0 24 27">
          <path
            d="M12 26s9-8.2 9-15A9 9 0 0 0 3 11c0 6.8 9 15 9 15Z"
            fill={c.glow}
            stroke={c.onGlow}
            strokeWidth={1.2}
          />
          <circle cx={12} cy={11} r={3.4} fill={c.white} />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: 1540,
          top: 300,
          opacity: pin,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 22px",
          borderRadius: 999,
          background: c.white,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <Icon name="dice-5" size={26} color={c.fg} />
        <span style={{ fontFamily: font, fontWeight: 600, fontSize: 26, color: c.fg }}>
          Games café
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: sx - 14,
          top: sy - 14,
          width: 28,
          height: 28,
          borderRadius: 99,
          background: c.self,
          boxShadow: `0 0 0 8px ${c.self}38, 0 0 26px ${c.self}`,
        }}
      />
      <div style={{ position: "absolute", left: 130, top: 120 }}>
        <Rise text="Thursday." size={120} color={c.fg} delay={2} />
        <div style={{ marginTop: 14, opacity: sp(f, 20, 12) }}>
          <Mono size={20}>the venue is the only pin on the map</Mono>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 540,
          width: 840,
          padding: 44,
          boxSizing: "border-box",
          borderRadius: 40,
          background: c.white,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 30px 70px rgba(60,40,10,0.12)",
          opacity: card,
          transform: `translateY(${(1 - card) * 120}px)`,
        }}
      >
        <Mono size={18}>today · board games · 19:00</Mono>
        <div
          style={{
            fontFamily: font,
            fontWeight: 750,
            fontSize: 78,
            letterSpacing: -3.2,
            color: c.fg,
            marginTop: 10,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Compass opens 18:45
        </div>
        <div style={{ fontFamily: font, fontSize: 32, color: c.fg2, marginTop: 4 }}>
          Games café · 9 min on foot
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 28 }}>
          <Button
            variant={f >= OPEN_AT ? "glow" : "secondary"}
            size={28}
            icon={
              <Icon name="compass" size={30} color={f >= OPEN_AT ? c.onGlow : c.fg2} stroke={2} />
            }
            style={{ transform: `scale(${1 + Math.sin(sp(f, OPEN_AT, 10) * Math.PI) * 0.08})` }}
          >
            Open compass
          </Button>
          <Mono size={17}>names unlock when you meet</Mono>
        </div>
      </div>
      {fadeTo(f, dur, c.ink)}
    </Fill>
  )
}

// 9 · At the table — two badges, one table, then "We met".
const PAIR = [
  { id: "tomek-quote", who: "you · 9 min on foot", at: 8 },
  { id: OLA.vibe, who: "them · 7 min on foot", at: 18 },
]
export const TABLE_MET = 76
export const Table = ({ dur }: S) => {
  const f = useCurrentFrame()
  const bw = 260
  const met = sp(f, TABLE_MET, 12, true)
  const ripple = lerp(f, TABLE_MET - 4, TABLE_MET + 14, 0, 1)
  return (
    <NightBg f={f}>
      {Array.from({ length: 9 }, (_, n) => n).map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 140 + i * 205,
            top: 30 + Math.sin(i * 1.3) * 14,
            width: 14,
            height: 14,
            borderRadius: 99,
            background: c.glowCore,
            boxShadow: `0 0 30px 8px rgba(255,178,63,${0.35 + 0.15 * Math.sin(f / 9 + i)})`,
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 96,
          display: "flex",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <Rise text="Two badges." size={96} color={c.white} delay={2} />
        <div
          style={{ opacity: sp(f, 30, 12), transform: `translateY(${(1 - sp(f, 30, 12)) * 30}px)` }}
        >
          <span
            style={{
              fontFamily: font,
              fontWeight: 750,
              fontSize: 96,
              letterSpacing: -4,
              color: c.glow,
            }}
          >
            One table.
          </span>
        </div>
      </div>
      {PAIR.map((p, i) => {
        const d = sp(f, p.at, 20, true)
        const side = i * 2 - 1
        return (
          <div
            key={p.id}
            style={{ position: "absolute", left: 960 + side * 250 - bw / 2, top: 250 }}
          >
            <div
              style={{
                transform: `translateY(${(1 - d) * -500}px) rotate(${(1 - d) * side * 8}deg)`,
                transformOrigin: "50% 0",
              }}
            >
              <Badge id={p.id} width={bw} />
            </div>
            <div style={{ marginTop: 20, textAlign: "center", opacity: sp(f, p.at + 12, 10) }}>
              <Mono size={18} color={i ? "rgba(235,235,245,0.7)" : c.glow}>
                {p.who}
              </Mono>
            </div>
          </div>
        )
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 70,
          display: "flex",
          justifyContent: "center",
          opacity: sp(f, 40, 12),
        }}
      >
        <div style={{ position: "relative" }}>
          <Button
            variant={f >= TABLE_MET ? "success" : "glow"}
            size={36}
            icon={
              <Icon
                name={f >= TABLE_MET ? "circle-check" : "hand"}
                size={36}
                color={f >= TABLE_MET ? c.white : c.onGlow}
                stroke={2}
              />
            }
            style={{ transform: `scale(${f >= TABLE_MET ? 0.9 + met * 0.1 : 1})` }}
          >
            {f >= TABLE_MET ? "you found each other" : "We met"}
          </Button>
          {ripple > 0 && ripple < 1 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: ripple * 300,
                height: ripple * 300,
                marginLeft: -ripple * 150,
                marginTop: -ripple * 150,
                borderRadius: 999,
                background: `rgba(255,178,63,${0.45 * (1 - ripple)})`,
              }}
            />
          )}
        </div>
      </div>
      {fadeTo(f, dur, c.ink)}
    </NightBg>
  )
}

// 10 · Names unlock, the walk counted, same again next week? — the second meeting counts.
const NAMES = ["tomek-name", OLA.name]
export const AGAIN_DONE = 90
export const Again = ({ dur }: S) => {
  const f = useCurrentFrame()
  const bw = 200
  const done = sp(f, AGAIN_DONE, 14, true)
  const press = Math.sin(lerp(f, AGAIN_DONE - 6, AGAIN_DONE, 0, 1) * Math.PI)
  return (
    <NightBg f={f}>
      {NAMES.map((id, i) => {
        const d = sp(f, i * 3, 22, true)
        return (
          <div
            key={id}
            style={{ position: "absolute", left: 960 + (i * 2 - 1) * 150 - bw / 2, top: -60 }}
          >
            <div
              style={{
                transform: `translateY(${(1 - d) * -400}px) rotate(${Math.sin((f + i * 20) / 18) * 2}deg)`,
                transformOrigin: "50% 0",
              }}
            >
              <Badge id={id} width={bw} />
            </div>
          </div>
        )
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, textAlign: "center" }}>
        <div style={{ opacity: sp(f, 8, 12) }}>
          <Mono size={20} color={c.success}>
            you found each other
          </Mono>
        </div>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <Rise text="Say hi to Ola." size={110} color={c.white} delay={10} stagger={2} />
        </div>
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            opacity: sp(f, 26, 12),
            transform: `translateY(${(1 - sp(f, 26, 12)) * 20}px)`,
          }}
        >
          <Icon name="footprints" size={40} color="rgba(235,235,245,0.7)" stroke={2} />
          <span
            style={{
              fontFamily: font,
              fontWeight: 550,
              fontSize: 42,
              letterSpacing: -1.2,
              color: "rgba(235,235,245,0.7)",
            }}
          >
            You walked 640 m to say hi.
          </span>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 690,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            opacity: sp(f, 40, 12),
            transform: `translateY(${(1 - sp(f, 40, 12)) * 30}px) scale(${1 - press * 0.05})`,
          }}
        >
          <div style={{ opacity: 1 - done }}>
            <Button
              variant="glow"
              size={36}
              icon={<Icon name="repeat" size={36} color={c.onGlow} stroke={2} />}
            >
              Same again next week?
            </Button>
          </div>
          {f >= AGAIN_DONE && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                transform: `translateX(-50%) scale(${0.8 + done * 0.2})`,
                opacity: done,
              }}
            >
              <Button
                variant="success"
                size={36}
                icon={<Icon name="circle-check" size={36} color={c.white} stroke={2} />}
              >
                Glad it clicked.
              </Button>
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 900,
          textAlign: "center",
          opacity: sp(f, 100, 14),
        }}
      >
        <Mono size={20} color="rgba(235,235,245,0.6)">
          a friendship takes 40–60 hours together · Hall, 2018
        </Mono>
      </div>
      {fadeTo(f, dur, c.cream)}
    </NightBg>
  )
}

// 12 · Safety — calm by design.
export const SAFETY_AT = [4, 28, 58, 80]
const SAFETY = [
  {
    t: "Mutual consent",
    s: "nothing unlocks until both say yes",
    icon: "users",
    accent: c.success,
  },
  { t: "Public places", s: "plans happen at public venues", icon: "map-pin", accent: c.glow },
  { t: "One-tap Vanish", s: "ends it for both, instantly", icon: "x", accent: c.danger },
  { t: "Zero history", s: "no stored locations, ever", icon: "lock", accent: c.mint },
]
export const Safety = ({ dur }: S) => {
  const f = useCurrentFrame()
  return (
    <Fill bg={c.ink}>
      <Glow x={960} y={1100} r={900} color="rgba(255,178,63,0.16)" />
      <div style={{ position: "absolute", left: 140, top: 150 }}>
        <Rise
          text="Built so meeting a stranger feels calm."
          size={78}
          color={c.white}
          delay={2}
          stagger={2}
        />
      </div>
      <div style={{ position: "absolute", left: 140, top: 420, display: "flex", gap: 28 }}>
        {SAFETY.map((s, i) => {
          const t = sp(f, SAFETY_AT[i], 14, true)
          return (
            <div
              key={s.t}
              style={{
                width: 386,
                height: 420,
                borderRadius: 36,
                background: "#171717",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(255,255,255,0.05)",
                padding: 40,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                opacity: t,
                transform: `translateY(${(1 - t) * 80}px)`,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 99,
                  background: `${s.accent}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={s.icon} size={50} color={s.accent} stroke={2} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: font,
                    fontWeight: 700,
                    fontSize: 44,
                    letterSpacing: -1.4,
                    lineHeight: 1.05,
                    color: c.white,
                  }}
                >
                  {s.t}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    fontFamily: font,
                    fontSize: 24,
                    color: "rgba(235,235,245,0.62)",
                  }}
                >
                  {s.s}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {fadeTo(f, dur, c.cream)}
    </Fill>
  )
}

// 13 · Outro — "Not therapy. A reason to go out." then the mark.
export const OUTRO_LOGO = 72
export const Outro = ({ short = false }: S & { short?: boolean }) => {
  const f0 = useCurrentFrame()
  const f = short ? f0 + OUTRO_LOGO : f0
  const l = f - OUTRO_LOGO
  const lineOut = 1 - lerp(f, OUTRO_LOGO - 8, OUTRO_LOGO, 0, 1)
  const pop = sp(l, 2, 22, true)
  const word = sp(l, 12, 18)
  const tag = sp(l, 24, 16)
  const drift = (i: number) => Math.sin((f + i * 40) / 30) * 40
  return (
    <Fill bg={c.cream}>
      <Glow x={380 + drift(0)} y={260} r={760} color="rgba(55,194,179,0.42)" />
      <Glow x={1600} y={220 + drift(1)} r={720} color="rgba(255,197,111,0.62)" />
      <Glow x={960 + drift(2)} y={1120} r={900} color="rgba(255,221,170,0.9)" />
      {Array.from({ length: 14 }, (_, n) => n).map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: rnd(i) * W,
            top: rnd(i + 20) * H,
            width: 10,
            height: 10,
            borderRadius: 99,
            background: i % 2 ? c.self : c.glow,
            opacity: 0.25 * sp(f, i * 2, 20),
            transform: `translateY(${-f * (0.3 + rnd(i + 40))}px)`,
          }}
        />
      ))}
      {l < 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 360,
            textAlign: "center",
            opacity: lineOut,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Rise text="Not therapy." size={120} color={c.fg2} weight={650} delay={4} />
          </div>
          <div
            style={{
              marginTop: 20,
              opacity: sp(f, 30, 14),
              transform: `translateY(${(1 - sp(f, 30, 14)) * 30}px)`,
            }}
          >
            <span
              style={{
                fontFamily: font,
                fontWeight: 750,
                fontSize: 120,
                letterSpacing: -5,
                color: c.fg,
                background: `linear-gradient(transparent 62%, ${c.glow}99 62%)`,
              }}
            >
              A reason to go out.
            </span>
          </div>
        </div>
      )}
      {l >= 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 250,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ transform: `scale(${pop})` }}>
            <Mark size={220} arrowRotate={38 - (1 - pop) * 180} />
          </div>
          <div
            style={{ marginTop: 50, opacity: word, transform: `translateY(${(1 - word) * 30}px)` }}
          >
            <Wordmark size={170} />
          </div>
          <div
            style={{
              marginTop: 26,
              opacity: tag,
              fontFamily: font,
              fontWeight: 600,
              fontSize: 64,
              letterSpacing: -2,
              color: c.fg2,
            }}
          >
            Meet for real.
          </div>
          <div style={{ marginTop: 34, opacity: tag }}>
            <Mono size={20}>we find your people · we make the plan · meet now</Mono>
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: sp(l, 40, 16),
        }}
      >
        <Mono size={16}>HackYeah 2026 · Kraków</Mono>
      </div>
    </Fill>
  )
}
