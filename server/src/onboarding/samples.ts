import type { Mode } from "@justmate/protocol"

export type Question = { question: string; options: string[] }

export const SAMPLE_QUESTIONS: Record<Mode, Question[]> = {
  date: [
    {
      question: "Perfect first hour with someone new?",
      options: [
        "a long walk, no plan",
        "bar stools and bad jokes",
        "a gallery we pretend to get",
        "cooking something messy",
      ],
    },
    {
      question: "What makes you lose track of time?",
      options: ["a good argument", "a record shop", "people-watching", "a project at 2am"],
    },
    {
      question: "Which small thing wins you over?",
      options: [
        "remembering details",
        "laughing at themselves",
        "great taste in music",
        "being on time",
      ],
    },
    {
      question: "Your friends would call you…",
      options: ["the planner", "the instigator", "the calm one", "the storyteller"],
    },
  ],
  mate: [
    {
      question: "Nothing planned tonight. What's the move?",
      options: [
        "grab a pint",
        "find a pickup game",
        "wander somewhere new",
        "board games till late",
      ],
    },
    {
      question: "In a group you're usually…",
      options: ["the one with the plan", "the joker", "the listener", "the competitive one"],
    },
    {
      question: "What would you teach a new mate?",
      options: ["a card game", "a running route", "a recipe", "a hidden bar"],
    },
    {
      question: "Pick a deal-breaker.",
      options: ["always late", "no banter", "phone at the table", "sore loser"],
    },
  ],
}

export const SAMPLE_VIBES = [
  "quietly funny — will out-argue you about pizza",
  "early bird with a film camera — opinions on oat milk",
  "knows every climbing gym in town — still scared of ladders",
  "techno on fridays — crosswords on sundays",
  "plans the trip — forgets the charger",
]

export const SAMPLE_ICEBREAKERS = {
  date: [
    "What's the best thing you ate this week?",
    "Which place around here would you take a visitor to first?",
    "What were you in the middle of before this?",
  ],
  mate: [
    "What are you in the mood for right now?",
    "Which spot near here has never let you down?",
    "What's the last thing you got properly into?",
  ],
} as const satisfies Record<"date" | "mate", readonly string[]>

export const SAMPLE_RELATED: Record<string, string[]> = {
  coffee: ["flat white", "café hopping", "specialty roasters"],
  wine: ["natural wine", "wine bars", "tastings"],
  cinema: ["indie films", "film festivals", "late screenings"],
  books: ["bookshops", "poetry", "book clubs"],
  travel: ["city breaks", "night trains", "backpacking"],
  cooking: ["baking", "fresh pasta", "farmers markets"],
  hiking: ["trail running", "mountain huts", "sunrise hikes"],
  techno: ["vinyl", "warehouse parties", "synths"],
  jazz: ["jazz clubs", "live sessions", "saxophone"],
  art: ["galleries", "sketching", "street art"],
  dogs: ["dog walks", "dog parks", "shelter volunteering"],
  yoga: ["pilates", "meditation", "sunrise yoga"],
  photography: ["film cameras", "street photography", "darkrooms"],
  "street food": ["food trucks", "night markets", "ramen"],
  "board games": ["strategy games", "card games", "game cafés"],
  climbing: ["bouldering", "via ferrata", "outdoor crags"],
  running: ["park runs", "trail running", "half marathons"],
  gym: ["powerlifting", "calisthenics", "crossfit"],
  football: ["five-a-side", "futsal", "watching matches"],
  padel: ["tennis", "squash", "table tennis"],
  gaming: ["retro games", "co-op games", "lan parties"],
  "pub quiz": ["trivia", "crosswords", "escape rooms"],
  cycling: ["gravel rides", "bike touring", "mountain biking"],
  concerts: ["festivals", "small venues", "record shops"],
  coding: ["hackathons", "side projects", "open source"],
  chess: ["blitz chess", "chess cafés", "go"],
}
