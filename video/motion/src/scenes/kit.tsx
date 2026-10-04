import type { ReactNode } from "react"
import { Img, useCurrentFrame } from "remotion"
import { lerp, rnd, sp } from "../anim"
import { Mono } from "../components/brand"
import { Icon } from "../components/Icon"
import { Badge, Fill, Glow, Grid, Phone, PhoneSwap, Rise } from "../components/ui"
import { asset, c, font, H, W } from "../theme"
import { buzz, fadeTo, NightBg, WarmBg } from "./warm"

type S = { dur: number }

// Story tag in the top-left corner: which use case this clip is about.
const Tag = ({
  label,
  icon,
  f,
  dark = false,
}: {
  label: string
  icon: string
  f: number
  dark?: boolean
}) => (
  <div
    style={{
      position: "absolute",
      left: 110,
      top: 80,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 22px",
      borderRadius: 999,
      background: dark ? "#1E1E1E" : c.white,
      boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
      opacity: sp(f, 2, 12),
    }}
  >
    <Icon name={icon} size={26} color={dark ? c.glow : c.fg} stroke={2} />
    <Mono size={18} color={dark ? c.white : c.fg}>
      {label}
    </Mono>
  </div>
)

// Persona intro — who this clip is about, before just-mate (cool grey).
export const Persona = ({
  dur,
  name,
  facts,
  badge,
  tag,
  icon,
}: S & { name: string; facts: string[]; badge?: string; tag: string; icon: string }) => {
  const f = useCurrentFrame()
  const drop = sp(f, 8, 24, true)
  return (
    <Fill bg={c.coldBg}>
      <Grid color={c.coldLine} />
      <Tag label={tag} icon={icon} f={f} />
      <div style={{ position: "absolute", left: 110, top: 300, width: 1000 }}>
        <Rise text={name} size={150} color={c.coldInk} delay={4} />
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 16 }}>
          {facts.map((t, i) => {
            const k = sp(f, 18 + i * 12, 12)
            return (
              <div key={t} style={{ opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}>
                <span
                  style={{
                    fontFamily: font,
                    fontWeight: 550,
                    fontSize: 50,
                    letterSpacing: -1.5,
                    color: c.coldMute,
                  }}
                >
                  {t}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      {badge && (
        <div
          style={{
            position: "absolute",
            left: 1300,
            top: -40,
            transform: `translateY(${(1 - drop) * -700}px) rotate(${Math.sin(f / 20) * 1.5}deg)`,
            transformOrigin: "50% 0",
          }}
        >
          <Badge id={badge} width={380} />
        </div>
      )}
      {fadeTo(f, dur, c.cream, 5)}
    </Fill>
  )
}

// Main · two speeds: Plan when you need a reason to go, Now when you're already out.
export const SPEEDS_AT = { plan: 96, now: 160 }
export const Speeds = ({ dur }: S) => {
  const f = useCurrentFrame()
  const pl = sp(f, SPEEDS_AT.plan, 20)
  const nw = sp(f, SPEEDS_AT.now, 20)
  const title = 1 - sp(f, SPEEDS_AT.plan - 6, 12)
  const half = W / 2
  const ring = (k: number) => ((f - SPEEDS_AT.now - k * 12) % 36) / 36
  return (
    <WarmBg f={f}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 380,
          textAlign: "center",
          opacity: title,
        }}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Rise text="Out of the door," size={110} color={c.fg2} weight={650} delay={4} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
          <Rise text="at two speeds." size={110} color={c.fg} delay={30} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: half,
          height: H,
          background: c.cream,
          transform: `translateX(${(1 - pl) * -half}px)`,
          overflow: "hidden",
        }}
      >
        <Glow x={200} y={200} r={600} color="rgba(55,194,179,0.25)" />
        <div style={{ position: "absolute", left: 120, top: 220 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              background: c.fg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="calendar-heart" size={60} color={c.white} stroke={1.75} />
          </div>
          <div
            style={{
              fontFamily: font,
              fontWeight: 750,
              fontSize: 170,
              letterSpacing: -8,
              color: c.fg,
              marginTop: 30,
              lineHeight: 1,
            }}
          >
            Plan
          </div>
          <div
            style={{
              fontFamily: font,
              fontWeight: 550,
              fontSize: 44,
              letterSpacing: -1.2,
              color: c.fg2,
              marginTop: 18,
            }}
          >
            when you need a reason to go
          </div>
          <div
            style={{
              marginTop: 60,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "22px 28px",
              borderRadius: 28,
              background: c.white,
              boxShadow: "0 20px 50px rgba(80,50,10,0.10)",
              width: 600,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: c.fg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="dice-5" size={32} color={c.white} />
            </div>
            <div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 32, color: c.fg }}>
                board games · Thu 19:00
              </div>
              <Mono size={16}>9 min on foot · 2 of 4 going</Mono>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: half,
          top: 0,
          width: half,
          height: H,
          background: c.ink,
          transform: `translateX(${(1 - nw) * half}px)`,
          overflow: "hidden",
        }}
      >
        <Glow x={half - 200} y={700} r={600} color="rgba(255,178,63,0.22)" />
        <div style={{ position: "absolute", left: 120, top: 220 }}>
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              background: c.glow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="compass" size={60} color={c.onGlow} stroke={1.75} />
          </div>
          <div
            style={{
              fontFamily: font,
              fontWeight: 750,
              fontSize: 170,
              letterSpacing: -8,
              color: c.white,
              marginTop: 30,
              lineHeight: 1,
            }}
          >
            Now
          </div>
          <div
            style={{
              fontFamily: font,
              fontWeight: 550,
              fontSize: 44,
              letterSpacing: -1.2,
              color: "rgba(235,235,245,0.62)",
              marginTop: 18,
            }}
          >
            when you're already out
          </div>
          <div style={{ position: "relative", marginTop: 60, width: 600, height: 110 }}>
            {[0, 1].map((side) => (
              <div key={side} style={{ position: "absolute", left: side ? 470 : 100, top: 55 }}>
                {[0, 1, 2].map((k) => {
                  const r = ring(k)
                  return f > SPEEDS_AT.now ? (
                    <div
                      key={k}
                      style={{
                        position: "absolute",
                        left: -r * 60,
                        top: -r * 60,
                        width: r * 120,
                        height: r * 120,
                        borderRadius: 99,
                        border: `3px solid ${c.glow}`,
                        opacity: 1 - r,
                      }}
                    />
                  ) : null
                })}
                <div
                  style={{
                    position: "absolute",
                    left: -14,
                    top: -14,
                    width: 28,
                    height: 28,
                    borderRadius: 99,
                    background: side ? c.glow : c.mint,
                  }}
                />
              </div>
            ))}
            <div
              style={{
                position: "absolute",
                left: 150,
                right: 160,
                top: 52,
                borderTop: "4px dotted rgba(255,255,255,0.3)",
              }}
            />
          </div>
        </div>
      </div>
      {fadeTo(f, dur, c.cream)}
    </WarmBg>
  )
}

// Two phones ping at the same moment (Now / Date).
export const PingPair = ({
  dur,
  from,
  left,
  right,
  at,
  before,
  after,
  labels = ["your phone", "their phone"],
}: S & {
  from: string
  left: string
  right: string
  at: number
  before: string
  after: string
  labels?: [string, string]
}) => {
  const f = useCurrentFrame()
  const sw = lerp(f, at, at + 4, 0, 1)
  const shake = buzz(f, at)
  const t1 = 1 - sp(f, at - 8, 10)
  const t2 = sp(f, at, 14)
  const pw = 320
  return (
    <WarmBg f={f}>
      {[0, 1].map((side) => {
        const enter = sp(f, side * 5, 20)
        const r = (k: number) => {
          const l = f - at - k * 8
          return l < 0 ? 0 : l / 40
        }
        return (
          <div key={side} style={{ position: "absolute", left: side ? 1100 : 480, top: 230 }}>
            {[0, 1, 2].map((k) => {
              const v = r(k)
              if (v <= 0 || v >= 1) return null
              const s = 200 + v * 420
              return (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: pw / 2 + 9 - s,
                    top: 360 - s,
                    width: s * 2,
                    height: s * 2,
                    borderRadius: "50%",
                    border: `4px solid ${c.glow}`,
                    opacity: (1 - v) * 0.7,
                  }}
                />
              )
            })}
            <PhoneSwap
              a={from}
              b={side ? right : left}
              t={sw}
              width={pw}
              glow={sw > 0 ? `rgba(255,178,63,${0.5 * sw})` : undefined}
              style={{
                transform: `translateX(${(side ? 1 : -1) * (1 - enter) * 700 + shake}px) rotate(${(side ? 3 : -3) + shake * 0.3}deg)`,
              }}
            />
            <div style={{ textAlign: "center", marginTop: 18, width: pw + 18, opacity: enter }}>
              <Mono size={16}>{labels[side]}</Mono>
            </div>
          </div>
        )
      })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 80, textAlign: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, opacity: t1 }}>
          <Rise
            text={before}
            size={80}
            color={c.fg}
            delay={2}
            style={{ justifyContent: "center" }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            opacity: t2,
            transform: `translateY(${(1 - t2) * 30}px)`,
          }}
        >
          <span
            style={{
              fontFamily: font,
              fontWeight: 750,
              fontSize: 88,
              letterSpacing: -4,
              color: c.fg,
            }}
          >
            {after}
          </span>
        </div>
      </div>
      {fadeTo(f, dur, c.ink)}
    </WarmBg>
  )
}

// The walk — compass screens on the phone, the bucket word big beside it.
const BUCKETS = [
  { name: "cold", sub: "over 200 m", color: c.tempCold },
  { name: "warm", sub: "under 200 m", color: c.tempWarm },
  { name: "hot", sub: "under 80 m", color: c.tempHot },
  { name: "burning", sub: "under 30 m", color: c.tempBurning },
]
export const Walk = ({
  dur,
  screens,
  intent,
}: S & { screens: [string, string, string]; intent: string }) => {
  const f = useCurrentFrame()
  const bi = Math.min(3, Math.floor((f / dur) * 4.4))
  const b = BUCKETS[bi]
  const bt = sp(f, (bi * dur) / 4.4, 10, true)
  const scr = screens[Math.max(0, bi - 1)]
  const prev = screens[Math.max(0, bi - 2)]
  const swap = bi >= 2 ? sp(f, (bi * dur) / 4.4, 6) : 1
  const enter = sp(f, 0, 18)
  return (
    <NightBg f={f}>
      <Glow x={560} y={560} r={520 + bi * 120} color={`${bi === 3 ? c.tempHot : b.color}44`} />
      <PhoneSwap
        a={prev}
        b={scr}
        t={swap}
        width={360}
        style={{ position: "absolute", left: 380, top: 120 + (1 - enter) * 400 }}
      />
      <div style={{ position: "absolute", left: 1000, top: 300 }}>
        <Mono color="rgba(235,235,245,0.6)" size={22}>
          no map of them · just a direction · {intent}
        </Mono>
        <div
          style={{
            fontFamily: font,
            fontWeight: 750,
            fontSize: 250,
            letterSpacing: -11,
            lineHeight: 1,
            marginTop: 30,
            color: b.color,
            textShadow: bi === 3 ? `0 0 60px ${c.tempHot}` : undefined,
            opacity: bt,
            transform: `translateY(${(1 - bt) * 30}px)`,
          }}
        >
          {b.name}
        </div>
        <div style={{ marginTop: 20, opacity: bt }}>
          <Mono color="rgba(235,235,245,0.62)" size={26}>
            {b.sub}
          </Mono>
        </div>
      </div>
      {fadeTo(f, dur, c.cream)}
    </NightBg>
  )
}

// After the walk — names unlock, nothing else.
export const Met = ({
  dur,
  screen,
  title,
  sub,
}: S & { screen: string; title: string; sub: string }) => {
  const f = useCurrentFrame()
  const enter = sp(f, 0, 20)
  return (
    <WarmBg f={f}>
      <Phone
        screen={screen}
        width={380}
        style={{
          position: "absolute",
          left: 1320,
          top: 90 + (1 - enter) * 300,
          transform: `rotate(${(1 - enter) * 6}deg)`,
        }}
      />
      <div style={{ position: "absolute", left: 140, top: 330, width: 1080 }}>
        <div style={{ opacity: sp(f, 4, 10) }}>
          <Mono size={22} color={c.success}>
            you found each other
          </Mono>
        </div>
        <Rise text={title} size={124} color={c.fg} delay={6} style={{ marginTop: 18 }} />
        <div
          style={{
            marginTop: 24,
            opacity: sp(f, 26, 12),
            transform: `translateY(${(1 - sp(f, 26, 12)) * 20}px)`,
          }}
        >
          <span
            style={{
              fontFamily: font,
              fontWeight: 600,
              fontSize: 52,
              letterSpacing: -1.6,
              color: c.fg2,
            }}
          >
            {sub}
          </span>
        </div>
      </div>
      {fadeTo(f, dur, c.cream)}
    </WarmBg>
  )
}

// Phone + statement, for single beats (search, safety).
export const Beat = ({
  dur,
  screen,
  title,
  sub,
  dark = false,
  children,
}: S & { screen: string; title: string; sub?: string; dark?: boolean; children?: ReactNode }) => {
  const f = useCurrentFrame()
  const enter = sp(f, 0, 18)
  const Bg = dark ? NightBg : WarmBg
  return (
    <Bg f={f}>
      <Phone
        screen={screen}
        width={380}
        style={{ position: "absolute", left: 300, top: 90 + (1 - enter) * 200 }}
      >
        {children}
      </Phone>
      <div style={{ position: "absolute", left: 900, top: 380, width: 900 }}>
        <Rise text={title} size={96} color={dark ? c.white : c.fg} delay={4} />
        {sub && (
          <div style={{ marginTop: 26, opacity: sp(f, 16, 12) }}>
            <Mono
              size={22}
              color={dark ? "rgba(235,235,245,0.6)" : c.fg2}
              style={{ whiteSpace: "normal", lineHeight: 1.5 }}
            >
              {sub}
            </Mono>
          </div>
        )}
      </div>
      {fadeTo(f, dur, dark ? c.ink : c.cream, 3)}
    </Bg>
  )
}

// Ania · judged on photos → a badge instead of a face.
export const Faces = ({ dur }: S) => {
  const f = useCurrentFrame()
  const cut = 40
  const drop = sp(f, cut + 4, 24, true)
  if (f < cut) {
    return (
      <Fill bg={c.coldBg}>
        <Grid color={c.coldLine} />
        {Array.from({ length: 8 }, (_, n) => n).map((i) => {
          const x = 180 + (i % 4) * 420
          const y = 140 + Math.floor(i / 4) * 450
          const stamp = f > 6 + i * 3
          const like = rnd(i + 9) > 0.6
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: 300,
                height: 400,
                borderRadius: 26,
                overflow: "hidden",
                background: c.white,
                boxShadow: "0 18px 40px rgba(30,40,60,0.12)",
                transform: `rotate(${(rnd(i) - 0.5) * 8}deg)`,
              }}
            >
              <div
                style={{
                  height: 300,
                  background:
                    "radial-gradient(circle at 50% 38%, #C9CDD5 0 22%, transparent 23%), radial-gradient(ellipse at 50% 110%, #C9CDD5 0 45%, transparent 46%), #E2E4E9",
                }}
              />
              {stamp && (
                <div
                  style={{
                    position: "absolute",
                    top: 26,
                    left: 26,
                    padding: "4px 12px",
                    border: `4px solid ${like ? c.coldBlue : "#B9BEC8"}`,
                    color: like ? c.coldBlue : "#B9BEC8",
                    borderRadius: 10,
                    fontFamily: font,
                    fontWeight: 800,
                    fontSize: 28,
                    transform: "rotate(-12deg)",
                  }}
                >
                  {like ? `${6 + (i % 3)}/10` : "NOPE"}
                </div>
              )}
            </div>
          )
        })}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: H / 2 - 6,
            height: 12,
            background: c.coldInk,
            transform: `scaleX(${lerp(f, 26, 36, 0, 1)}) rotate(-8deg)`,
            transformOrigin: "0 50%",
          }}
        />
      </Fill>
    )
  }
  return (
    <WarmBg f={f}>
      <div
        style={{
          position: "absolute",
          left: 1180,
          top: -40,
          transform: `translateY(${(1 - drop) * -700}px) rotate(${Math.sin(f / 18) * 1.5}deg)`,
          transformOrigin: "50% 0",
        }}
      >
        <Badge id="ania-quote" width={400} />
      </div>
      <div style={{ position: "absolute", left: 140, top: 340, width: 940 }}>
        <Mono size={22}>no photos here · not yours, not theirs</Mono>
        <Rise
          text="Her vibe is the only thing anyone sees."
          size={96}
          color={c.fg}
          delay={cut + 6}
          style={{ marginTop: 24 }}
        />
      </div>
      {fadeTo(f, dur, c.cream)}
    </WarmBg>
  )
}

// Marta · four safety beats on one phone.
export const SAFE_AT = [0, 64, 124, 194]
const SAFE = [
  {
    screen: "date-home",
    title: "Invisible until she searches.",
    sub: "nothing shows while search is off",
  },
  {
    screen: "date-search",
    title: "Zones, never her location.",
    sub: "a soft glow where people are · no pins of people",
  },
  {
    screen: "date-match-his",
    title: "Nothing unlocks unless both say yes.",
    sub: "a dismiss is silent · the offer just expires",
  },
  {
    screen: "date-compass-burning",
    title: "One tap ends it, for both.",
    sub: "vanish · no confirmation, no delay",
  },
]
export const SafetyBeats = ({ dur }: S) => {
  const f = useCurrentFrame()
  const i = SAFE_AT.findLastIndex((a) => f >= a)
  const l = f - SAFE_AT[i]
  const s = SAFE[i]
  const enter = sp(f, 0, 18)
  const t = sp(l, 0, 12)
  const vanish = i === 3 ? lerp(l, 26, 34, 0, 1) : 0
  const ripple = i === 3 ? lerp(l, 18, 34, 0, 1) : 0
  return (
    <WarmBg f={f}>
      <Tag label="safety by design" icon="shield-check" f={f} />
      <Phone
        screen={s.screen}
        width={380}
        style={{ position: "absolute", left: 300, top: 110 + (1 - enter) * 200 }}
      >
        {i > 0 && l < 8 && (
          <Img
            src={asset(`screens/${SAFE[i - 1].screen}.webp`)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 1 - l / 8,
            }}
          />
        )}
        {ripple > 0 && ripple < 1 && (
          <div
            style={{
              position: "absolute",
              left: 70 - ripple * 120,
              top: 810 - ripple * 120,
              width: ripple * 240,
              height: ripple * 240,
              borderRadius: 999,
              background: `rgba(255,69,58,${0.5 * (1 - ripple)})`,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#0E0E11",
            opacity: vanish,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mono size={20} color="rgba(235,235,245,0.7)">
            session ended for both
          </Mono>
        </div>
      </Phone>
      <div
        key={i}
        style={{
          position: "absolute",
          left: 900,
          top: 360,
          width: 900,
          opacity: t,
          transform: `translateY(${(1 - t) * 30}px)`,
        }}
      >
        <Mono size={22}>{`0${i + 1} / 04`}</Mono>
        <div
          style={{
            fontFamily: font,
            fontWeight: 750,
            fontSize: 92,
            letterSpacing: -4,
            lineHeight: 1.05,
            color: i === 3 ? c.danger : c.fg,
            marginTop: 20,
          }}
        >
          {s.title}
        </div>
        <div style={{ marginTop: 26 }}>
          <Mono size={22} style={{ whiteSpace: "normal", lineHeight: 1.5 }}>
            {s.sub}
          </Mono>
        </div>
      </div>
      {fadeTo(f, dur, c.ink)}
    </WarmBg>
  )
}

// Marta · what's next on the safety ladder (labelled production path, as in PRODUCT.md §10).
const NEXT = [
  { t: "Verified-only matching", icon: "shield-check" },
  { t: "Women-only plans", icon: "users" },
  { t: "Report = block", icon: "lock" },
  { t: "Meeting point first", icon: "map-pin" },
]
export const SafetyNext = ({ dur }: S) => {
  const f = useCurrentFrame()
  return (
    <NightBg f={f}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 230,
          textAlign: "center",
          opacity: sp(f, 2, 12),
        }}
      >
        <Mono size={22} color={c.glow}>
          coming next · production path
        </Mono>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 400,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 24,
          padding: "0 200px",
        }}
      >
        {NEXT.map((n, i) => {
          const t = sp(f, 6 + i * 6, 14, true)
          return (
            <div
              key={n.t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "26px 40px",
                borderRadius: 999,
                background: "#1E1E1E",
                color: c.white,
                fontFamily: font,
                fontWeight: 600,
                fontSize: 44,
                letterSpacing: -1,
                opacity: t,
                transform: `scale(${0.8 + t * 0.2})`,
              }}
            >
              <Icon name={n.icon} size={44} color={c.glow} stroke={2} />
              {n.t}
            </div>
          )
        })}
      </div>
      {fadeTo(f, dur, c.cream)}
    </NightBg>
  )
}

// Piotr · quiet nights at a board-game café.
const WEEK = [
  { d: "Mon", v: 0.55 },
  { d: "Tue", v: 0.1, empty: true },
  { d: "Wed", v: 0.5 },
  { d: "Thu", v: 0.15, empty: true },
  { d: "Fri", v: 0.9 },
  { d: "Sat", v: 1 },
  { d: "Sun", v: 0.45 },
]
export const VenueIntro = ({ dur }: S) => {
  const f = useCurrentFrame()
  const hi = sp(f, 96, 14)
  return (
    <Fill bg={c.coldBg}>
      <Grid color={c.coldLine} />
      <Tag label="for venues" icon="dice-5" f={f} />
      <div style={{ position: "absolute", left: 110, top: 300, width: 760 }}>
        <Rise text="Piotr, 38" size={150} color={c.coldInk} delay={4} />
        {["runs a board-game café", "Tuesday and Thursday nights: empty tables"].map((t, i) => {
          const k = sp(f, 18 + i * 14, 12)
          return (
            <div
              key={t}
              style={{ marginTop: 16, opacity: k, transform: `translateX(${(1 - k) * -30}px)` }}
            >
              <span
                style={{
                  fontFamily: font,
                  fontWeight: 550,
                  fontSize: 48,
                  letterSpacing: -1.4,
                  color: c.coldMute,
                }}
              >
                {t}
              </span>
            </div>
          )
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 200,
          width: 840,
          height: 640,
          padding: 48,
          boxSizing: "border-box",
          borderRadius: 40,
          background: c.white,
          boxShadow: "0 30px 80px rgba(30,40,60,0.10)",
          opacity: sp(f, 8, 16),
          transform: `translateY(${(1 - sp(f, 8, 16)) * 60}px)`,
        }}
      >
        <Mono size={18} color={c.coldMute}>
          tables in use · evenings
        </Mono>
        <div
          style={{
            position: "absolute",
            left: 48,
            right: 48,
            bottom: 48,
            height: 440,
            display: "flex",
            gap: 22,
            alignItems: "flex-end",
          }}
        >
          {WEEK.map((w, i) => {
            const g = sp(f, 20 + i * 5, 16)
            return (
              <div
                key={w.d}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                {w.empty && (
                  <div style={{ opacity: hi }}>
                    <Mono size={15} color={c.coldDeep}>
                      empty
                    </Mono>
                  </div>
                )}
                <div
                  style={{
                    width: "100%",
                    height: 360 * w.v * g,
                    minHeight: 8,
                    borderRadius: 14,
                    background: w.empty ? c.coldDeep : "#D7DCE4",
                    boxShadow: w.empty ? `0 0 0 ${4 * hi}px ${c.coldDeep}33` : undefined,
                  }}
                />
                <span
                  style={{
                    fontFamily: font,
                    fontWeight: 650,
                    fontSize: 26,
                    color: w.empty ? c.coldDeep : c.coldInk,
                  }}
                >
                  {w.d}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      {fadeTo(f, dur, c.cream, 5)}
    </Fill>
  )
}

// Piotr lists two table slots; the app fills them with people who wanted exactly that.
export const FILL_AT = [70, 88, 106, 124]
const FILLERS = ["sam-quote", "mia-quote", "olek-quote", "tomek-quote"]
const Toggle = ({ on }: { on: number }) => (
  <div
    style={{
      width: 76,
      height: 44,
      borderRadius: 99,
      background: on > 0.5 ? c.success : "#E5E5E5",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 4,
        left: 4 + on * 32,
        width: 36,
        height: 36,
        borderRadius: 99,
        background: c.white,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      }}
    />
  </div>
)
export const VenueList = ({ dur }: S) => {
  const f = useCurrentFrame()
  const card = sp(f, 2, 18)
  const plan = sp(f, 40, 20)
  const n = FILL_AT.filter((a) => f >= a).length
  const bw = 120
  return (
    <WarmBg f={f}>
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 130,
          width: 760,
          padding: 44,
          boxSizing: "border-box",
          borderRadius: 40,
          background: c.white,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 30px 70px rgba(60,40,10,0.12)",
          opacity: card,
          transform: `translateY(${(1 - card) * 120}px)`,
        }}
      >
        <Mono size={18}>partner · board-game café</Mono>
        <div
          style={{
            fontFamily: font,
            fontWeight: 750,
            fontSize: 64,
            letterSpacing: -2.4,
            color: c.fg,
            marginTop: 8,
          }}
        >
          List a table
        </div>
        {["Tue 19:00 · board games · table for 4", "Thu 19:00 · board games · table for 4"].map(
          (t, i) => (
            <div
              key={t}
              style={{
                marginTop: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "22px 26px",
                borderRadius: 24,
                background: "#F4F4F5",
                opacity: sp(f, 10 + i * 10, 12),
              }}
            >
              <span style={{ fontFamily: font, fontWeight: 550, fontSize: 30, color: c.fg }}>
                {t}
              </span>
              <Toggle on={sp(f, 18 + i * 10, 8)} />
            </div>
          ),
        )}
        <div
          style={{
            marginTop: 22,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 22px",
            borderRadius: 999,
            background: c.glow,
            color: c.onGlow,
            fontFamily: font,
            fontWeight: 600,
            fontSize: 26,
            opacity: sp(f, 36, 12),
          }}
        >
          <Icon name="coffee" size={26} color={c.onGlow} stroke={2} /> first coffee −50% on check-in
        </div>
        <div style={{ marginTop: 26, opacity: sp(f, 44, 12) }}>
          <Mono size={17} style={{ whiteSpace: "normal", lineHeight: 1.5 }}>
            you see counts and check-ins · never who
          </Mono>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 930,
          top: 210,
          opacity: plan,
          transform: `translateX(${(1 - plan) * 80}px)`,
        }}
      >
        <div
          style={{
            width: 880,
            padding: 44,
            boxSizing: "border-box",
            borderRadius: 40,
            background: c.white,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 30px 70px rgba(60,40,10,0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 999,
                background: c.fg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="dice-5" size={46} color={c.white} />
            </div>
            <div>
              <Mono size={18}>plan · hosted by the café</Mono>
              <div
                style={{
                  fontFamily: font,
                  fontWeight: 750,
                  fontSize: 60,
                  letterSpacing: -2.2,
                  color: c.fg,
                  marginTop: 4,
                }}
              >
                board games
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18, fontFamily: font, fontSize: 30, color: c.fg2 }}>
            Tue 19:00 · 6 min on foot · first coffee −50%
          </div>
          <div style={{ marginTop: 22, display: "flex", justifyContent: "space-between" }}>
            <Mono size={18}>who's going</Mono>
            <Mono size={18} color={c.fg}>
              {n} of 4 going
            </Mono>
          </div>
          <div style={{ display: "flex", gap: 40, marginTop: 8 }}>
            {FILLERS.map((id, i) => {
              const d = sp(f, FILL_AT[i], 18, true)
              return (
                <div key={id} style={{ width: bw, height: (bw * 922) / 520, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: bw * 1.38,
                      borderRadius: 16,
                      border: "3px dashed rgba(0,0,0,0.12)",
                    }}
                  />
                  {f >= FILL_AT[i] && (
                    <Badge
                      id={id}
                      width={bw}
                      style={{
                        position: "absolute",
                        top: 0,
                        transform: `translateY(${(1 - d) * -300}px)`,
                        opacity: Math.min(1, d * 3),
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {fadeTo(f, dur, c.ink)}
    </WarmBg>
  )
}

export const VenueFull = ({ dur }: S) => {
  const f = useCurrentFrame()
  const days = ["Tuesday", "Thursday"]
  return (
    <NightBg f={f}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 180,
          display: "flex",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {days.map((d, i) => {
          const t = sp(f, 4 + i * 12, 14, true)
          return (
            <div
              key={d}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "24px 40px",
                borderRadius: 999,
                background: "#1E1E1E",
                opacity: t,
                transform: `scale(${0.8 + t * 0.2})`,
              }}
            >
              <span
                style={{
                  fontFamily: font,
                  fontWeight: 700,
                  fontSize: 56,
                  color: c.white,
                  letterSpacing: -1.5,
                }}
              >
                {d}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 20px",
                  borderRadius: 999,
                  background: c.success,
                  color: c.white,
                  fontFamily: font,
                  fontWeight: 650,
                  fontSize: 32,
                }}
              >
                <Icon name="check" size={30} color={c.white} stroke={3} /> full
              </span>
            </div>
          )
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 420,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Rise text="Venues pay to fill quiet nights." size={92} color={c.white} delay={20} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 540,
          textAlign: "center",
          opacity: sp(f, 54, 14),
          transform: `translateY(${(1 - sp(f, 54, 14)) * 20}px)`,
        }}
      >
        <span
          style={{
            fontFamily: font,
            fontWeight: 750,
            fontSize: 92,
            letterSpacing: -4,
            color: c.glow,
          }}
        >
          Meeting people stays free.
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 860,
          textAlign: "center",
          opacity: sp(f, 70, 14),
        }}
      >
        <Mono size={20} color="rgba(235,235,245,0.55)">
          partner venues · public places only · coming next
        </Mono>
      </div>
      {fadeTo(f, dur, c.cream)}
    </NightBg>
  )
}
