import type { FC } from "react"
import { DOOR_AT, Hook, Turn } from "./scenes/cold"
import {
  Faces,
  FILL_AT,
  Met,
  Persona,
  PingPair,
  SAFE_AT,
  SafetyBeats,
  SafetyNext,
  SPEEDS_AT,
  Speeds,
  VenueFull,
  VenueIntro,
  VenueList,
  Walk,
} from "./scenes/kit"
import {
  AGAIN_DONE,
  Again,
  ON_AT,
  ON_TAP,
  On,
  OPEN_AT,
  Opens,
  OUTRO_LOGO,
  Outro,
  PLAN_TAP,
  Plan,
  RULES_AT,
  Rules,
  SAFETY_AT,
  Safety,
  TABLE_MET,
  Table,
} from "./scenes/warm"

// One scene = one slot on the timeline. `vo` and `sfx` are frame offsets inside the scene.
export type Cue = { at: number; src: string; volume?: number }
export type Scene = { id: string; frames: number; C: FC<{ dur: number }>; vo?: Cue[]; sfx?: Cue[] }
export type Piece = { id: string; title: string; about: string; scenes: Scene[] }

const vo = (src: string, at: number): Cue => ({ src: `audio/vo/${src}.mp3`, at })
const fx = (src: string, at: number, volume = 0.5): Cue => ({
  src: `audio/sfx/${src}.mp3`,
  at,
  volume,
})
const sc = (
  id: string,
  frames: number,
  C: FC<{ dur: number }>,
  v: Cue[] = [],
  s: Cue[] = [],
): Scene => ({ id, frames, C, vo: v, sfx: s })

// Shared beats --------------------------------------------------------------
const hook = sc(
  "hook",
  85,
  ({ dur }) => <Hook dur={dur} short />,
  [vo("hook-0", 6)],
  [fx("rise", 0, 0.3)],
)
const turn = sc(
  "turn",
  135,
  Turn,
  [vo("turn-0", 4), vo("turn-1", DOOR_AT.line2)],
  [fx("chime", DOOR_AT.open + 24, 0.4)],
)
const rules = sc(
  "rules",
  300,
  Rules,
  RULES_AT.map((a, i) => vo(`rules-${i}`, a + 3)),
  RULES_AT.map((a) => fx("pop", a, 0.25)),
)
const outroShort = (frames = 95) =>
  sc(
    "outro",
    frames,
    ({ dur }) => <Outro dur={dur} short />,
    [vo("logo-1", 6)],
    [fx("chime", 2, 0.45)],
  )
const tick = (at: number[]) => at.map((a) => fx("pop", a, 0.35))
const met = [...tick([8, 18]), fx("pop", TABLE_MET, 0.6), fx("chime", TABLE_MET + 2, 0.35)]
const again = [fx("pop", AGAIN_DONE - 4, 0.5), fx("chime", AGAIN_DONE, 0.4)]

const mateWalk = ({ dur }: { dur: number }) => (
  <Walk
    dur={dur}
    intent="beer"
    screens={["mate-compass-warm", "mate-compass-hot", "mate-compass-burning"]}
  />
)
const kaiMet =
  (sub: string) =>
  ({ dur }: { dur: number }) => (
    <Met
      dur={dur}
      screen="mate-postmeet"
      title="Say hi to Kai."
      sub={sub}
      opener="best pierogi in town, go."
    />
  )
const matePing =
  (at: number, before: string, after: string) =>
  ({ dur }: { dur: number }) => (
    <PingPair
      dur={dur}
      at={at}
      from="mate-search"
      left="mate-match-a"
      right="mate-match-b"
      before={before}
      after={after}
    />
  )

// Main · ~49 s · the umbrella: one app, two speeds -----------------------------
const MAIN: Piece = {
  id: "Main",
  title: "Main · Plan + Now",
  about: "HackYeah submission and web hero: loneliness, then one app at two speeds.",
  scenes: [
    hook,
    turn,
    rules,
    sc(
      "speeds",
      125,
      Speeds,
      [vo("speeds-1", SPEEDS_AT.plan + 2), vo("speeds-2", SPEEDS_AT.now + 2)],
      [],
    ),
    sc(
      "plan",
      150,
      ({ dur }) => <Plan dur={dur} tapAt={106} />,
      [vo("m-plan-0", 8)],
      [fx("pop", 106, 0.6)],
    ),
    sc(
      "on",
      100,
      ({ dur }) => <On dur={dur} at={14} tap={6} />,
      [vo("m-plan-1", 4)],
      [fx("buzz", 14, 0.8), fx("chime", 16, 0.35)],
    ),
    sc("table", 105, Table, [vo("m-table", 6)], met),
    sc("again", 125, Again, [], again),
    sc(
      "now",
      130,
      matePing(92, "Already out?", "Both phones ping. At once."),
      [vo("m-now", 6)],
      [fx("buzz", 92, 0.9)],
    ),
    sc("walk", 110, mateWalk, [vo("m-walk", 6)], [fx("rise", 56, 0.3)]),
    sc(
      "met",
      120,
      kaiMet("Names unlock. Nothing else does."),
      [vo("m-meet", 8)],
      [fx("chime", 6, 0.35)],
    ),
    sc("safety", 120, Safety, [vo("safety", 6)], tick(SAFETY_AT)),
    sc(
      "outro",
      150,
      Outro,
      [vo("logo-0", 6), vo("logo-1", OUTRO_LOGO + 6)],
      [fx("chime", OUTRO_LOGO + 2, 0.45)],
    ),
  ],
}

// Tomek · Plan ---------------------------------------------------------------
const TOMEK: Piece = {
  id: "Tomek",
  title: "Tomek · Plan",
  about: "Newcomer, works from home. The app proposes one plan with one person; he says yes.",
  scenes: [
    sc(
      "persona",
      95,
      ({ dur }) => (
        <Persona
          dur={dur}
          name="Tomek, 28"
          facts={["new in Kraków", "works from home", "evenings on the couch"]}
          badge="tomek-quote"
          tag="plan · a reason to go"
          icon="calendar-heart"
        />
      ),
      [vo("t-intro", 6)],
      [fx("pop", 10, 0.3)],
    ),
    sc(
      "plan",
      150,
      ({ dur }) => <Plan dur={dur} short />,
      [vo("plan", 0)],
      [fx("pop", PLAN_TAP - 6, 0.6)],
    ),
    sc(
      "on",
      128,
      On,
      [vo("on", 4)],
      [fx("pop", ON_TAP, 0.35), fx("buzz", ON_AT, 0.8), fx("chime", ON_AT + 2, 0.4)],
    ),
    sc("opens", 125, Opens, [], tick([10, OPEN_AT])),
    sc("table", 108, Table, [vo("table", 4)], met),
    sc("again", 134, Again, [vo("again", 4)], again),
    outroShort(),
  ],
}

// Lucía · Now ----------------------------------------------------------------
const LUCIA: Piece = {
  id: "Lucia",
  title: "Lucía · Now",
  about: "Tourist, already out. Both phones ping at once, a compass walks them together.",
  scenes: [
    sc(
      "persona",
      150,
      ({ dur }) => (
        <Persona
          dur={dur}
          name="Lucía, 27"
          facts={["three days alone in Kraków", "out for an evening walk", "picks: beer"]}
          badge="lucia-quote"
          tag="now · already out"
          icon="compass"
        />
      ),
      [vo("l-intro", 6)],
      [fx("pop", 10, 0.3)],
    ),
    sc(
      "ping",
      100,
      matePing(52, "Searching: beer.", "Both phones ping. At once."),
      [vo("l-ping", 4)],
      [fx("buzz", 52, 0.9)],
    ),
    sc("walk", 110, mateWalk, [vo("l-walk", 4)], [fx("rise", 60, 0.3)]),
    sc(
      "met",
      125,
      kaiMet("A beer, and someone to explore the city with."),
      [vo("l-meet", 6)],
      [fx("chime", 6, 0.35)],
    ),
    outroShort(),
  ],
}

// Ania · Date ----------------------------------------------------------------
const ANIA: Piece = {
  id: "Ania",
  title: "Ania · Date",
  about: "Dating without photos: a vibe badge instead of a face, names after you meet.",
  scenes: [
    sc(
      "persona",
      135,
      ({ dur }) => (
        <Persona
          dur={dur}
          name="Ania, 24"
          facts={["deleted Tinder twice", "done being judged on photos"]}
          badge="ania-quote"
          tag="date · no photos"
          icon="heart"
        />
      ),
      [vo("a-intro", 6)],
    ),
    sc("faces", 110, Faces, [vo("a-badge", 42)], [fx("pop", 48, 0.4)]),
    sc(
      "ping",
      110,
      ({ dur }) => (
        <PingPair
          dur={dur}
          at={40}
          from="date-search"
          left="date-match-his"
          right="date-match-her"
          before="Searching: coffee."
          after="Both say yes."
          labels={["her phone", "his phone"]}
        />
      ),
      [vo("a-match", 4)],
      [fx("buzz", 40, 0.9)],
    ),
    sc(
      "walk",
      80,
      ({ dur }) => (
        <Walk
          dur={dur}
          intent="coffee"
          screens={["date-compass-warm", "date-compass-hot", "date-compass-burning"]}
        />
      ),
      [],
      [fx("rise", 40, 0.3)],
    ),
    sc(
      "met",
      120,
      ({ dur }) => (
        <Met
          dur={dur}
          screen="date-postmeet"
          title="Say hi to Tomas."
          sub="Names unlock only once you've met."
          opener="what's the last thing you shot on film?"
        />
      ),
      [vo("a-meet", 6)],
      [fx("chime", 6, 0.35)],
    ),
    outroShort(),
  ],
}

// Marta · Safety -------------------------------------------------------------
const MARTA: Piece = {
  id: "Marta",
  title: "Marta · Safety",
  about: "Serendipity without the creepiness: invisible, zones, mutual consent, Vanish.",
  scenes: [
    sc(
      "persona",
      100,
      ({ dur }) => (
        <Persona
          dur={dur}
          name="Marta, 31"
          facts={["walks home alone at night", "wants serendipity, not creepiness"]}
          badge="marta-quote"
          tag="safety by design"
          icon="shield-check"
        />
      ),
      [vo("s-intro", 6)],
    ),
    sc(
      "beats",
      260,
      SafetyBeats,
      SAFE_AT.map((a, i) => vo(`s-${i}`, a + 6)),
      [],
    ),
    sc("next", 80, SafetyNext, [], tick([6, 12, 18, 24])),
    outroShort(),
  ],
}

// Piotr · Venues host plans -------------------------------------------------
const PIOTR: Piece = {
  id: "Piotr",
  title: "Piotr · Venues",
  about: "A café lists quiet-night tables; the app fills them. Venues pay, meeting stays free.",
  scenes: [
    sc("intro", 175, VenueIntro, [vo("p-intro", 6)]),
    sc("list", 160, VenueList, [vo("p-list", 4)], [...tick([18, 28]), ...tick(FILL_AT)]),
    sc("full", 130, VenueFull, [vo("p-full", 18)], [fx("chime", 6, 0.4)]),
    outroShort(),
  ],
}

export const PIECES: Piece[] = [MAIN, TOMEK, LUCIA, ANIA, MARTA, PIOTR]
export const total = (s: Scene[]) => s.reduce((a, x) => a + x.frames, 0)
