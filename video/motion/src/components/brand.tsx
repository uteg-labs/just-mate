import type { CSSProperties } from "react"
import { c, font } from "../theme"

// just-mate symbol: aurora disc (teal → apricot → peach) with the navigation arrow.
// Rebuilt from assets/brand/just-mate-symbol.svg so the arrow can be animated.
export const Mark = ({
  size,
  arrowRotate = 38,
  arrowScale = 1,
  aurora = 1,
  style,
}: {
  size: number
  arrowRotate?: number
  arrowScale?: number
  aurora?: number
  style?: CSSProperties
}) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 512 512"
    style={{ overflow: "visible", ...style }}
  >
    <defs>
      <radialGradient id="jm-a" cx="22%" cy="26%" r="62%">
        <stop offset="0" stopColor={c.teal} />
        <stop offset="1" stopColor={c.teal} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="jm-b" cx="86%" cy="12%" r="55%">
        <stop offset="0" stopColor={c.apricot} />
        <stop offset="1" stopColor={c.apricot} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="jm-c" cx="50%" cy="74%" r="72%">
        <stop offset="0" stopColor={c.peach} />
        <stop offset="1" stopColor={c.peach} stopOpacity="0" />
      </radialGradient>
      <filter id="jm-sh" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000" floodOpacity=".16" />
      </filter>
      <clipPath id="jm-k">
        <circle cx="256" cy="256" r="256" />
      </clipPath>
    </defs>
    <g clipPath="url(#jm-k)">
      <rect width="512" height="512" fill="#EDEDEF" />
      <g opacity={aurora}>
        <rect width="512" height="512" fill="url(#jm-c)" />
        <rect width="512" height="512" fill="url(#jm-a)" />
        <rect width="512" height="512" fill="url(#jm-b)" />
      </g>
    </g>
    <g
      filter="url(#jm-sh)"
      transform={`translate(256 256) rotate(${arrowRotate}) scale(${arrowScale}) translate(-140 -140) scale(11.667)`}
      fill="#fff"
      stroke="#fff"
    >
      <polygon points="12 2 19 21 12 17 5 21 12 2" strokeWidth="1" strokeLinejoin="round" />
    </g>
  </svg>
)

export const Wordmark = ({
  size,
  color = c.fg,
  style,
}: {
  size: number
  color?: string
  style?: CSSProperties
}) => (
  <span
    style={{
      fontFamily: font,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: -size * 0.036,
      lineHeight: 1,
      color,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    just-mate
  </span>
)

// Small uppercase mono label, as in the DS (t-mono).
export const Mono = ({
  children,
  color = c.fg2,
  size = 18,
  style,
}: {
  children: React.ReactNode
  color?: string
  size?: number
  style?: CSSProperties
}) => (
  <span
    style={{
      fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
      fontSize: size,
      letterSpacing: size * 0.08,
      textTransform: "uppercase",
      color,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
)
