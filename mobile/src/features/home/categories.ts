import { CATEGORIES, type Mode, OTHER_INTENT } from "@justmate/protocol"
import type { TFunction } from "i18next"
import type { BentoCategory } from "@/components/surface/CategoryBento"
import type { IconName } from "@/components/ui"

// DESIGN.md §9
const CATEGORY_ICON: Record<Mode, Record<string, IconName>> = {
  date: {
    food: "utensils",
    night: "martini",
    out: "trees",
    culture: "palette",
    music: "music",
    fun: "ferris-wheel",
  },
  mate: {
    food: "utensils",
    sports: "dumbbell",
    games: "dice-5",
    out: "mountain",
    music: "music",
    culture: "film",
  },
}

const INTENT_ICON: Record<string, IconName> = {
  beer: "beer",
  coffee: "coffee",
  tea: "coffee",
  wine: "wine",
  cycling: "bike",
  cinema: "film",
  gym: "dumbbell",
  "board games": "dice-5",
  cards: "dice-5",
  arcade: "gamepad-2",
  "video games": "gamepad-2",
  hike: "mountain",
  walk: "footprints",
  running: "footprints",
  dancing: "party-popper",
  cocktails: "martini",
  funfair: "ferris-wheel",
  "ferris wheel": "ferris-wheel",
  "live gig": "ticket",
  gig: "ticket",
  concert: "ticket",
  festival: "ticket",
  stargazing: "moon",
  sunset: "sun",
  museum: "palette",
  exhibition: "palette",
  [OTHER_INTENT]: "plus",
}

export function categoryIcon(mode: Mode, id: string): IconName {
  return CATEGORY_ICON[mode][id] ?? "sparkle"
}

export function intentIcon(mode: Mode, category: string, intent: string): IconName {
  return INTENT_ICON[intent] ?? categoryIcon(mode, category)
}

export function bentoCategories(t: TFunction, mode: Mode): BentoCategory[] {
  return CATEGORIES[mode].map((c) => ({
    id: c.id,
    label: t(`categories.${c.id}`),
    icon: categoryIcon(mode, c.id),
    intents: [...c.intents],
  }))
}

export function intentLabel(t: TFunction, intent: string) {
  return intent === OTHER_INTENT ? t("picks.other") : intent
}

// "beer" · "beer or coffee" · "beer, coffee +2"
export function picksLabel(t: TFunction, picks: readonly string[]) {
  const [a, b] = picks.map((p) => intentLabel(t, p))
  if (picks.length < 2) return a ?? ""
  if (picks.length === 2) return t("picks.two", { a, b })
  return t("picks.more", { a, b, n: picks.length - 2 })
}
