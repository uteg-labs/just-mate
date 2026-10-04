import { interpolate, useCurrentFrame } from "remotion"
import { clamp, easeIn, easeInOut, lerp, rnd, sp } from "../anim"
import { Mark, Mono, Wordmark } from "../components/brand"
import { Fill, Glow, Grid, Rise } from "../components/ui"
import world from "../data/world-dots.json"
import { c, font, H, W } from "../theme"

type S = { dur: number }

// 1 · Hook — loneliness in numbers (WHO Commission on Social Connection, 2025).
export const HOOK_2 = 62
export const Hook = ({ dur, short = false }: S & { short?: boolean }) => {
  const f = useCurrentFrame()
  const reveal = (i: number, x: number) => sp(f, x / 70 + rnd(i) * 6, 14)
  const lit = lerp(f, 14, 44, 0, 1)
  const second = short ? 0 : sp(f, HOOK_2, 20)
  const scale = 0.98 - second * 0.2
  return (
    <Fill bg={c.coldBg}>
      <div
        style={{
          position: "absolute",
          left: (W - world.w * scale) / 2 + 250 - second * 640,
          top: (H - world.h * scale) / 2 - 20 + second * 110,
          width: world.w * scale,
          height: world.h * scale,
          opacity: 1 - second * 0.55,
        }}
      >
        {world.dots.map(([x, y], i) => {
          const lonely = rnd(i * 7.31) < 1 / 6
          const on = lonely ? lit : 0
          const pulse = lonely ? 0.5 + 0.5 * Math.sin((f - i) / 6) : 0
          const r = (5.2 + on * 2.6 + on * pulse * 1.2) * scale
          return (
            <div
              key={`${x}-${y}`}
              style={{
                position: "absolute",
                left: x * scale - r,
                top: y * scale - r,
                width: r * 2,
                height: r * 2,
                borderRadius: 99,
                background: on > 0.5 ? c.coldDeep : "#C3C7CF",
                opacity: reveal(i, x) * (0.75 + on * 0.25),
                boxShadow: on > 0.5 ? `0 0 ${10 * on}px rgba(59,91,134,0.55)` : undefined,
              }}
            />
          )
        })}
      </div>

      <div style={{ position: "absolute", left: 110, top: 560 - second * 470, width: 640 }}>
        <div
          style={{
            fontFamily: font,
            fontWeight: 750,
            fontSize: 220 - second * 90,
            lineHeight: 0.9,
            letterSpacing: -9,
            color: c.coldDeep,
            opacity: sp(f, 4, 14),
            transform: `translateY(${(1 - sp(f, 4, 14)) * 40}px)`,
          }}
        >
          1 in 6
        </div>
        <Rise
          text="people is lonely."
          size={56 - second * 16}
          color={c.coldInk}
          weight={650}
          delay={12}
          style={{ marginTop: 10 }}
        />
        <div style={{ marginTop: 18, opacity: sp(f, 26, 12) }}>
          <Mono color={c.coldMute} size={18}>
            WHO Commission on Social Connection · 2025
          </Mono>
        </div>
      </div>

      {!short && (
        <div
          style={{
            position: "absolute",
            left: 1000,
            top: 260,
            width: 800,
            height: 520,
            borderRadius: 40,
            background: c.white,
            boxShadow: "0 30px 80px rgba(30,40,60,0.12)",
            opacity: second,
            transform: `translateY(${(1 - second) * 80}px)`,
            padding: 60,
            boxSizing: "border-box",
            display: "flex",
            gap: 48,
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: font,
              fontWeight: 750,
              fontSize: 230,
              letterSpacing: -12,
              color: c.coldDeep,
              lineHeight: 1,
            }}
          >
            2<span style={{ fontSize: 170 }}>×</span>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: font,
                fontWeight: 650,
                fontSize: 44,
                lineHeight: 1.12,
                letterSpacing: -1.3,
                color: c.coldInk,
              }}
            >
              Lonely people are twice as likely to become depressed.
            </div>
            <div style={{ marginTop: 22 }}>
              <Mono color={c.coldMute} size={16}>
                WHO · 2025
              </Mono>
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.coldBg,
          opacity: interpolate(f, [dur - 5, dur], [0, 1], clamp),
        }}
      />
    </Fill>
  )
}

// 4 · Apps solved matching. Nobody solved the door. — the door opens onto the warm side.
export const DOOR_AT = { line2: 48, open: 92 }
export const Turn = ({ dur }: S) => {
  const f = useCurrentFrame()
  const open = interpolate(f, [DOOR_AT.open, DOOR_AT.open + 16], [0, 1], {
    ...clamp,
    easing: easeInOut,
  })
  const zoom = interpolate(f, [DOOR_AT.open + 10, DOOR_AT.open + 26], [1, 9], {
    ...clamp,
    easing: easeIn,
  })
  const textOut = 1 - lerp(f, DOOR_AT.open - 4, DOOR_AT.open + 8, 0, 1)
  const warm = interpolate(f, [DOOR_AT.open + 18, DOOR_AT.open + 26], [0, 1], clamp)
  const logo = sp(f, DOOR_AT.open + 24, 16, true)
  const dx = 1590
  const dy = 540
  return (
    <Fill bg={c.coldBg}>
      <Grid color={c.coldLine} />
      <div style={{ position: "absolute", left: 140, top: 330, opacity: textOut }}>
        <Rise text="Apps solved matching." size={80} color={c.coldMute} weight={650} delay={4} />
        <div style={{ marginTop: 18 }}>
          <Rise text="Nobody solved the door." size={96} color={c.coldInk} delay={DOOR_AT.line2} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: dx - 170,
          top: dy - 300,
          width: 340,
          height: 600,
          transform: `scale(${zoom})`,
          transformOrigin: "50% 50%",
          opacity: sp(f, 30, 16),
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: -18,
            borderRadius: "22px 22px 0 0",
            background: "#D5D8DE",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "14px 14px 0 0",
            overflow: "hidden",
            background: c.cream,
          }}
        >
          <Glow x={60} y={80} r={300} color="rgba(55,194,179,0.55)" />
          <Glow x={300} y={60} r={300} color="rgba(255,197,111,0.75)" />
          <Glow x={170} y={600} r={380} color="rgba(255,221,170,0.95)" />
        </div>
        <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "14px 14px 0 0",
              background: "linear-gradient(90deg,#3A3F49,#2A2D34)",
              transformOrigin: "0% 50%",
              transform: `rotateY(${-open * 105}deg)`,
              boxShadow: "inset 0 0 0 10px rgba(255,255,255,0.04)",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 34,
                top: 300,
                width: 16,
                height: 16,
                borderRadius: 99,
                background: "#C9CDD5",
              }}
            />
          </div>
        </div>
      </div>
      <Fill bg={c.cream} style={{ opacity: warm }}>
        <Glow x={380} y={260} r={760} color="rgba(55,194,179,0.42)" />
        <Glow x={1600} y={220} r={720} color="rgba(255,197,111,0.62)" />
        <Glow x={960} y={1120} r={900} color="rgba(255,221,170,0.9)" />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
          }}
        >
          <div style={{ transform: `scale(${logo})` }}>
            <Mark size={200} arrowRotate={38 - (1 - logo) * 120} />
          </div>
          <div style={{ opacity: logo, transform: `translateX(${(1 - logo) * -40}px)` }}>
            <Wordmark size={170} />
          </div>
        </div>
      </Fill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.glow,
          opacity: interpolate(f, [dur - 4, dur], [0, 1], clamp),
        }}
      />
    </Fill>
  )
}
