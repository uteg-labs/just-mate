// DESIGN.md §6 — the web.css shadow ladder as React Native `boxShadow` strings
const DROPS = [1, 3, 6, 12, 24, 48, 96]

function drops(color: string, count: number) {
  return DROPS.slice(0, count).map((d) => `0 ${d}px ${d}px -${d / 2}px ${color}`)
}

function lightLevel(level: number) {
  const sc = "rgba(0,0,0,0.06)"
  return [`0 0 0 1px ${sc}`, ...drops(sc, level - 1)].join(", ")
}

function darkLevel(level: number, highlight: number, ring: number) {
  return [
    `inset 0 1px 0 0 rgba(255,255,255,${highlight})`,
    `inset 0 0 0 1px rgba(255,255,255,${ring})`,
    `0 0 0 1px rgba(0,0,0,${(0.12 + 0.02 * (level - 3)).toFixed(2)})`,
    ...drops("rgba(0,0,0,0.18)", level - 1),
  ].join(", ")
}

export const shadowLight = {
  1: lightLevel(1),
  2: lightLevel(2),
  3: lightLevel(3),
  4: lightLevel(4),
  5: lightLevel(5),
  6: lightLevel(6),
  7: lightLevel(7),
  8: lightLevel(8),
  glow: "0 0 0 1px rgba(255,178,63,0.45), 0 8px 24px -8px rgba(255,160,40,0.55)",
  sheet: "0 0 0 1px rgba(0,0,0,0.05), 0 -12px 40px -12px rgba(0,0,0,0.14)",
} as const

export const shadowDark = {
  1: "inset 0 0 0 1px rgba(255,255,255,0.02)",
  2: [
    "inset 0 1px 0 0 rgba(255,255,255,0.01)",
    "inset 0 0 0 1px rgba(255,255,255,0.02)",
    ...drops("rgba(0,0,0,0.18)", 1),
  ].join(", "),
  3: darkLevel(3, 0.02, 0.02),
  4: darkLevel(4, 0.02, 0.04),
  5: darkLevel(5, 0.04, 0.04),
  6: darkLevel(6, 0.04, 0.06),
  7: darkLevel(7, 0.06, 0.06),
  8: darkLevel(8, 0.06, 0.06),
  glow: "0 0 0 1px rgba(255,178,63,0.35), 0 8px 32px -8px rgba(255,178,63,0.55)",
  sheet: "0 -1px 0 0 rgba(255,255,255,0.12), 0 -24px 48px -12px rgba(0,0,0,0.5)",
} as const

export const shadow = shadowLight
