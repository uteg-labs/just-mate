import type { TextStyle } from "react-native"

// DESIGN.md §3 — tracking and leading are size-specific
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
  body: { fontSize: 17, lineHeight: 24, fontWeight: "400", letterSpacing: 0 },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400", letterSpacing: 0.1 },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: "600", letterSpacing: 0.4 },
} as const satisfies Record<string, TextStyle>
