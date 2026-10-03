import { Platform, type TextStyle } from "react-native"

// inter is embedded by the expo-font plugin; "InterVariable" is its postscript name on ios and its file
// name on android. react native never sets the wght axis of a variable font (ios picks the default
// 400 instance, android fakes bold), so only the regular styles use inter until static cuts are added
export const font = {
  sans: "InterVariable",
  mono: Platform.select({ ios: "Menlo", default: "monospace" }),
} as const

// DESIGN.md §4.2 — tracking and leading are size-specific
export const type = {
  display: {
    fontSize: 64,
    lineHeight: 64,
    fontWeight: "700",
    letterSpacing: -1.6,
    fontVariant: ["tabular-nums"],
  },
  largeTitle: { fontSize: 34, lineHeight: 38, fontWeight: "700", letterSpacing: -0.7 },
  title: { fontSize: 22, lineHeight: 26, fontWeight: "600", letterSpacing: -0.3 },
  vibe: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "500",
    fontStyle: "italic",
    letterSpacing: -0.2,
  },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600", letterSpacing: -0.1 },
  body: {
    fontFamily: font.sans,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "400",
    letterSpacing: 0,
  },
  footnote: {
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
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
  labelLg: { fontSize: 16, lineHeight: 20, fontWeight: "500", letterSpacing: -0.1 },
  labelMd: { fontSize: 15, lineHeight: 20, fontWeight: "500", letterSpacing: -0.1 },
  status: { fontSize: 13, lineHeight: 18, fontWeight: "600", letterSpacing: 0.1 },
} as const satisfies Record<string, TextStyle>
