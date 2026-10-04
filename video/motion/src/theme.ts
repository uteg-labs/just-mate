import { loadFont } from "@remotion/fonts"
import { staticFile } from "remotion"

// Remotion resolves assets with staticFile(); the HTML preview sets window.JM_ASSETS to a relative base.
export const asset = (p: string) => {
  const base = (globalThis as { JM_ASSETS?: string }).JM_ASSETS
  return base === undefined ? staticFile(p) : base + p
}

// Tokens mirror the just-mate design system export (design/prototype/_ds/tokens).
// Story colour arc: cold paper (the problem) → warm light + night (the product).
export const c = {
  // cold phase
  coldBg: "#E9EAEE",
  coldPaper: "#F4F4F6",
  coldInk: "#2A2D34",
  coldMute: "#8A8F99",
  coldLine: "rgba(40,50,70,0.08)",
  coldBlue: "#7C9CC4",
  coldDeep: "#3B5B86",

  // warm phase (DS light + dark scopes)
  paper: "#FAFAFA",
  cream: "#FFF6EA",
  ink: "#0A0A0D",
  fg: "#171717",
  fg2: "#737373",
  white: "#FFFFFF",
  glow: "#FFB23F",
  glowCore: "#FFD9A0",
  onGlow: "#1A1205",
  mint: "#5EEAD4",
  self: "#14B8A6",
  teal: "#37C2B3",
  apricot: "#FFC56F",
  peach: "#FFDDAA",
  danger: "#FF453A",
  success: "#30D158",
  tempCold: "#64B5F6",
  tempWarm: "#FFB23F",
  tempHot: "#FF7A1A",
  tempBurning: "#FFF1DC",
} as const

export const font = "Inter, -apple-system, system-ui, sans-serif"
export const mono = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace"

export const fontReady = loadFont({
  family: "Inter",
  url: asset("fonts/InterVariable.ttf"),
  weight: "100 900",
})

export const FPS = 30
export const W = 1920
export const H = 1080
