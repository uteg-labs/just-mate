import type { Intent, Interest } from "@justmate/protocol"

const INTERESTS_BY_INTENT: Record<Intent, Interest[]> = {
  soul_mate: ["books", "travel", "cinema", "dogs", "food", "coffee", "photography", "hiking"],
  date: ["food", "cinema", "coffee", "travel", "photography", "rock", "books", "beer"],
  beer: ["beer", "rock", "techno", "boardgames", "food", "tech"],
  coffee: ["coffee", "books", "tech", "photography", "cinema", "boardgames"],
  friends: ["boardgames", "hiking", "travel", "dogs", "tech", "climbing", "food", "beer"],
  sports: ["hiking", "climbing", "dogs", "travel"],
  music: ["rock", "techno", "beer", "travel", "photography"],
}

export const interestsFor = (intents: Intent[]): Interest[] => [
  ...new Set(intents.flatMap((intent) => INTERESTS_BY_INTENT[intent])),
]
