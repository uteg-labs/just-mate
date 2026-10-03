import { createContext, type ReactNode, use } from "react"

import { dark, light, type Palette } from "@/theme/colors"
import { shadowDark, shadowLight } from "@/theme/elevation"

export type Scheme = "light" | "dark"

type Theme = { scheme: Scheme; c: Palette; shadow: Record<keyof typeof shadowLight, string> }

const THEMES: Record<Scheme, Theme> = {
  light: { scheme: "light", c: light, shadow: shadowLight },
  dark: { scheme: "dark", c: dark, shadow: shadowDark },
}

const SchemeContext = createContext<Scheme>("light")

// DESIGN.md §3.1 — pins a palette on a subtree, like `.dark` / `.light` on web
export const Scope = ({ scheme, children }: { scheme: Scheme; children: ReactNode }) => (
  <SchemeContext value={scheme}>{children}</SchemeContext>
)

export function useScheme(override?: Scheme) {
  const scheme = use(SchemeContext)
  return THEMES[override ?? scheme]
}
