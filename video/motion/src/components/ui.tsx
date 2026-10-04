import type { CSSProperties, ReactNode } from "react"
import { Img, useCurrentFrame } from "remotion"
import { sp } from "../anim"
import { asset, c, font } from "../theme"

// Phone: dark rim around a captured prototype screen (402 × 874 pt, captured at 2×).
export const Phone = ({
  screen,
  width,
  style,
  glow,
  children,
}: {
  screen?: string
  width: number
  style?: CSSProperties
  glow?: string
  children?: ReactNode
}) => {
  const k = width / 402
  const rim = 9 * k
  return (
    <div
      style={{
        width: width + rim * 2,
        height: 874 * k + rim * 2,
        padding: rim,
        borderRadius: (48 + 9) * k,
        background: "linear-gradient(145deg,#3a3a3e,#111114 40%,#2a2a2e)",
        boxShadow: `0 ${40 * k}px ${90 * k}px rgba(0,0,0,0.28), 0 0 0 ${1.5 * k}px rgba(255,255,255,0.08) inset${glow ? `, 0 0 ${120 * k}px ${glow}` : ""}`,
        position: "relative",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div
        style={{
          width,
          height: 874 * k,
          borderRadius: 48 * k,
          overflow: "hidden",
          position: "relative",
          background: "#000",
        }}
      >
        {screen && (
          <Img
            src={asset(`screens/${screen}.webp`)}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        )}
        {children}
      </div>
    </div>
  )
}

// Cross-fade between two captured screens inside one phone.
export const PhoneSwap = ({
  a,
  b,
  t,
  width,
  style,
  glow,
}: {
  a: string
  b: string
  t: number
  width: number
  style?: CSSProperties
  glow?: string
}) => (
  <Phone width={width} style={style} glow={glow} screen={a}>
    <Img
      src={asset(`screens/${b}.webp`)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: t }}
    />
  </Phone>
)

// Words rise in one by one with a short blur, Apple-style.
export const Rise = ({
  text,
  delay = 0,
  stagger = 3,
  size,
  color,
  weight = 700,
  style,
  lineHeight = 1.02,
  tracking = -0.035,
}: {
  text: string
  delay?: number
  stagger?: number
  size: number
  color: string
  weight?: number
  style?: CSSProperties
  lineHeight?: number
  tracking?: number
}) => {
  const f = useCurrentFrame()
  const words = text.split(" ").map((w, n, all) => ({ w, n, k: all.slice(0, n).join(" ").length }))
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight,
        letterSpacing: size * tracking,
        ...style,
      }}
    >
      {words.map(({ w, n, k }) => {
        const t = sp(f, delay + n * stagger, 16)
        return (
          <span
            key={k}
            style={{
              display: "inline-block",
              marginRight: size * 0.24,
              opacity: t,
              transform: `translateY(${(1 - t) * size * 0.45}px)`,
              filter: `blur(${(1 - t) * 10}px)`,
            }}
          >
            {w}
          </span>
        )
      })}
    </div>
  )
}

// Soft radial light blob (zone glow / aurora).
export const Glow = ({
  x,
  y,
  r,
  color,
  opacity = 1,
}: {
  x: number
  y: number
  r: number
  color: string
  opacity?: number
}) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
      opacity,
      pointerEvents: "none",
    }}
  />
)

export const Fill = ({
  children,
  bg,
  style,
}: {
  children?: ReactNode
  bg: string
  style?: CSSProperties
}) => (
  <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden", ...style }}>
    {children}
  </div>
)

// Subtle map-like grid used as texture in both phases.
export const Grid = ({
  color,
  step = 64,
  street,
  opacity = 1,
}: {
  color: string
  step?: number
  street?: string
  opacity?: number
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      opacity,
      background: `repeating-linear-gradient(0deg, ${color} 0 1px, transparent 1px ${step}px), repeating-linear-gradient(90deg, ${color} 0 1px, transparent 1px ${step}px)${street ? `, repeating-linear-gradient(32deg, transparent 0 380px, ${street} 380px 392px, transparent 392px 820px), repeating-linear-gradient(-58deg, transparent 0 540px, ${street} 540px 552px, transparent 552px 1100px)` : ""}`,
    }}
  />
)

// Lanyard vibe badge captured from the prototype (public/badges, 520 × 922 px incl. strap).
export const Badge = ({
  id,
  width,
  style,
}: {
  id: string
  width: number
  style?: CSSProperties
}) => (
  <Img
    src={asset(`badges/${id}.webp`)}
    style={{ width, height: (width * 922) / 520, display: "block", ...style }}
  />
)

// DS button: primary = ink pill, glow = amber, ghost = text only.
export const Button = ({
  children,
  variant = "primary",
  size = 30,
  icon,
  style,
}: {
  children: ReactNode
  variant?: "primary" | "glow" | "ghost" | "success" | "secondary"
  size?: number
  icon?: ReactNode
  style?: CSSProperties
}) => {
  const v = {
    primary: { background: c.fg, color: c.white },
    glow: {
      background: c.glow,
      color: c.onGlow,
      boxShadow: `0 ${size * 0.3}px ${size}px rgba(255,178,63,0.45)`,
    },
    ghost: { background: "transparent", color: c.fg2 },
    success: { background: c.success, color: c.white },
    secondary: { background: "#EDEDEF", color: c.fg2 },
  }[variant]
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: size * 0.4,
        height: size * 2.2,
        padding: `0 ${size * 1.1}px`,
        borderRadius: 999,
        fontFamily: font,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: -size * 0.01,
        whiteSpace: "nowrap",
        ...v,
        ...style,
      }}
    >
      {icon}
      {children}
    </div>
  )
}
