// DESIGN.md §3 — light is the default; `dark` scopes the night surfaces (compass, match card, post-meet)
export const light = {
  ink: "#0A0A0D",
  background: "#FAFAFA",
  surface1: "#FAFAFA",
  surface2: "#FCFCFC",
  surface3: "#FFFFFF",
  surface4: "#FFFFFF",
  surface5: "#FFFFFF",
  surface6: "#FFFFFF",
  surface7: "#FFFFFF",
  surface8: "#FFFFFF",
  surfaceCard: "#FFFFFF",
  surfaceRaised: "#F4F4F5",
  surfaceChip: "#EDEDEF",
  muted: "#F4F4F5",

  fg1: "#171717",
  fg2: "#737373",
  fg3: "#A3A3A3",
  fgMuted: "#737373",

  glow: "#FFB23F",
  glowCore: "#FFD9A0",
  onGlow: "#1A1205",
  glowHover: "#FFBA5A",
  glowPress: "#D19132",
  link: "#B86E00",

  self: "#14B8A6",
  danger: "#FF3B30",
  success: "#28C840",
  focusRing: "#6B97FF",

  // §8.3 press fills: primary 80% toward background, danger 85% toward black (oklab)
  primaryPress: "#3D3D3D",
  dangerPress: "#CE2E25",
  onDanger: "#FFFFFF",

  tempCold: "#3B8FDB",
  tempWarm: "#F5A524",
  tempHot: "#FF7A1A",
  tempBurning: "#FFE2B8",

  hover: "rgba(0,0,0,0.04)",
  active: "rgba(0,0,0,0.07)",
  tint: "rgba(0,0,0,0.06)",
  tintHover: "rgba(0,0,0,0.05)",
  trackOff: "#E5E5E5",
  separator: "rgba(0,0,0,0.06)",
  border: "rgba(23,23,23,0.12)",
  hairlineTop: "rgba(255,255,255,0.9)",
  scrim: "rgba(0,0,0,0.28)",

  materialThick: "rgba(250,250,250,0.78)",
  materialThin: "rgba(255,255,255,0.68)",

  mapBg: "#ECECEE",
  mapLine: "rgba(0,0,0,0.035)",
  mapStreet: "rgba(255,255,255,0.9)",
} as const

export const dark = {
  ink: "#0A0A0D",
  background: "#0A0A0D",
  surface1: "#171717",
  surface2: "#1E1E1E",
  surface3: "#252525",
  surface4: "#2C2C2C",
  surface5: "#333333",
  surface6: "#3A3A3A",
  surface7: "#414141",
  surface8: "#484848",
  surfaceCard: "#171717",
  surfaceRaised: "#252525",
  surfaceChip: "#252525",
  muted: "#1E1E1E",

  fg1: "#F5F5F7",
  fg2: "rgba(235,235,245,0.62)",
  fg3: "rgba(235,235,245,0.32)",
  fgMuted: "#A3A3A3",

  glow: "#FFB23F",
  glowCore: "#FFD9A0",
  onGlow: "#1A1205",
  glowHover: "#FFBA5A",
  glowPress: "#D19132",
  link: "#FFB23F",

  self: "#5EEAD4",
  danger: "#FF453A",
  success: "#30D158",
  focusRing: "#6B97FF",

  primaryPress: "#BFBFC2",
  dangerPress: "#CE362D",
  onDanger: "#FFFFFF",

  tempCold: "#64B5F6",
  tempWarm: "#FFB23F",
  tempHot: "#FF7A1A",
  tempBurning: "#FFF1DC",

  hover: "rgba(255,255,255,0.06)",
  active: "rgba(255,255,255,0.10)",
  tint: "rgba(255,255,255,0.12)",
  tintHover: "rgba(255,255,255,0.16)",
  trackOff: "#333333",
  separator: "rgba(255,255,255,0.08)",
  border: "rgba(245,245,247,0.12)",
  hairlineTop: "rgba(255,255,255,0.12)",
  scrim: "rgba(0,0,0,0.45)",

  materialThick: "rgba(28,28,30,0.72)",
  materialThin: "rgba(44,44,46,0.55)",

  mapBg: "#0E0E11",
  mapLine: "rgba(255,255,255,0.03)",
  mapStreet: "rgba(255,255,255,0.05)",
} as const satisfies Record<keyof typeof light, string>

export type Palette = { [K in keyof typeof light]: string }

export const colors = light
