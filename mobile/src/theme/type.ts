import { Platform, type TextStyle } from "react-native"

// static inter cuts, embedded by the expo-font plugin under their postscript names on both platforms.
// react native can't drive a variable font's wght axis, so the family carries the weight: never
// set fontWeight or fontStyle next to these (ios would re-match the face by weight)
export const font = {
  regular: "Inter-Regular",
  medium: "Inter-Medium",
  semibold: "Inter-SemiBold",
  bold: "Inter-Bold",
  mediumItalic: "Inter-MediumItalic",
  mono: Platform.select({ ios: "Menlo", default: "monospace" }),
} as const

// DESIGN.md §4 — wght 450 → medium, 550 → semibold; tracking and leading are size-specific
export const type = {
  display: {
    fontFamily: font.bold,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -1.6,
    fontVariant: ["tabular-nums"],
  },
  largeTitle: { fontFamily: font.bold, fontSize: 34, lineHeight: 38, letterSpacing: -0.7 },
  title: { fontFamily: font.semibold, fontSize: 22, lineHeight: 26, letterSpacing: -0.3 },
  vibe: { fontFamily: font.mediumItalic, fontSize: 20, lineHeight: 27, letterSpacing: -0.2 },
  vibeCompact: {
    fontFamily: font.mediumItalic,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.2,
  },
  headline: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.1 },
  body: { fontFamily: font.regular, fontSize: 17, lineHeight: 24, letterSpacing: 0 },
  footnote: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
  caption: {
    fontFamily: font.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  mono: {
    fontFamily: font.mono,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  labelLg: { fontFamily: font.medium, fontSize: 16, lineHeight: 20, letterSpacing: -0.1 },
  labelMd: { fontFamily: font.medium, fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
  labelSm: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, letterSpacing: -0.1 },
  status: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18, letterSpacing: 0.1 },
} as const satisfies Record<string, TextStyle>
