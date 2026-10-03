// DESIGN.md §7 — 4-pt grid, every control a full pill
export const space = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32, xxxl: 48 } as const

export const radius = {
  pill: 9999,
  full: 9999,
  card: 24,
  sheet: 32,
  match: 32,
  row: 20,
  container: 12,
  inner: 8,
} as const

export const layout = { gutter: 16, sheetPadding: 24, hitMin: 44 } as const
