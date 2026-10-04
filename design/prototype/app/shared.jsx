// Shared data + small token-built helpers (inputs the DS doesn't ship: text field, range slider, category tile).
const SH_NS = window.JustMateDesignSystem_dee067;
const JM_PW = 402, JM_PH = 874;

const JM_CATS = {
  date: [
    { id: "food", label: "Food and drink", icon: "utensils", demand: 9, intents: ["coffee", "wine", "dinner", "brunch", "beer", "dessert", "street food", "tea"] },
    { id: "night", label: "Nightlife", icon: "martini", demand: 7, intents: ["cocktails", "dancing", "karaoke", "late bar", "rooftop", "comedy night", "jazz club"] },
    { id: "out", label: "Outdoors", icon: "trees", demand: 4, intents: ["walk", "picnic", "sunset", "cycling", "riverside", "stargazing", "park bench"] },
    { id: "culture", label: "Culture", icon: "palette", demand: 3, intents: ["cinema", "exhibition", "theatre", "bookshop", "museum", "poetry night", "street art"] },
    { id: "music", label: "Music", icon: "music", demand: 5, intents: ["live gig", "jazz bar", "record shop", "open mic", "vinyl bar", "concert"] },
    { id: "fun", label: "Attractions", icon: "ferris-wheel", demand: 2, intents: ["funfair", "bowling", "escape room", "mini golf", "arcade", "zoo", "ferris wheel"] },
  ],
  mate: [
    { id: "food", label: "Food and drink", icon: "utensils", demand: 8, intents: ["beer", "coffee", "lunch", "street food", "pizza", "brunch", "wine", "ramen"] },
    { id: "sports", label: "Sports", icon: "dumbbell", demand: 6, intents: ["running", "gym", "climbing", "football", "padel", "tennis", "basketball", "yoga", "swim"] },
    { id: "games", label: "Games", icon: "dice-5", demand: 5, intents: ["board games", "pub quiz", "chess", "arcade", "darts", "pool", "cards", "video games"] },
    { id: "out", label: "Outdoors", icon: "mountain", demand: 3, intents: ["hike", "cycling", "walk", "frisbee", "skate", "kayak", "picnic"] },
    { id: "music", label: "Music", icon: "music", demand: 4, intents: ["gig", "jam session", "record shop", "open mic", "karaoke", "festival"] },
    { id: "culture", label: "Culture", icon: "film", demand: 2, intents: ["cinema", "exhibition", "workshop", "museum", "talk", "comedy"] },
  ],
};
const JM_INTENT_ICON = { beer: "beer", coffee: "coffee", tea: "coffee", wine: "wine", cycling: "bike", cinema: "film", gym: "dumbbell", "board games": "dice-5", cards: "dice-5", arcade: "gamepad-2", "video games": "gamepad-2", hike: "mountain", walk: "footprints", running: "footprints", dancing: "party-popper", cocktails: "martini", funfair: "ferris-wheel", "ferris wheel": "ferris-wheel", "live gig": "ticket", gig: "ticket", concert: "ticket", festival: "ticket", stargazing: "moon", sunset: "sun", museum: "palette", exhibition: "palette" };
const jmIntentIcon = (tab, catId, intent) => JM_INTENT_ICON[intent] || ((JM_CATS[tab] || []).find((c) => c.id === catId) || {}).icon || "search";

const JM_INTERESTS = {
  date: ["coffee", "wine", "cinema", "books", "travel", "cooking", "hiking", "techno", "jazz", "art", "dogs", "yoga", "photography", "street food"],
  mate: ["board games", "climbing", "running", "gym", "football", "padel", "gaming", "pub quiz", "hiking", "cycling", "concerts", "cooking", "coding", "chess"],
};

const JM_RELATED = {
  date: {
    coffee: ["flat white", "café hopping", "specialty roasters"], wine: ["natural wine", "wine bars", "tastings"], cinema: ["arthouse", "horror nights", "old classics"],
    books: ["sci-fi", "poetry", "bookshops"], travel: ["weekend trips", "backpacking", "city breaks"], cooking: ["baking", "pasta from scratch", "spicy food"],
    hiking: ["mountains", "day trips", "trail running"], techno: ["warehouse raves", "vinyl", "berlin trips"], jazz: ["jazz clubs", "piano", "vinyl"],
    art: ["galleries", "drawing", "street art"], dogs: ["dog walks", "dog parks", "fostering"], yoga: ["pilates", "meditation", "sunrise yoga"],
    photography: ["film cameras", "street photos", "portraits"], "street food": ["night markets", "tacos", "ramen"],
  },
  mate: {
    "board games": ["strategy games", "party games", "catan"], climbing: ["bouldering", "outdoor crags", "lead climbing"], running: ["5k", "park runs", "trail running"],
    gym: ["lifting", "crossfit", "calisthenics"], football: ["five-a-side", "watching matches", "fantasy league"], padel: ["tennis", "squash", "ping pong"],
    gaming: ["co-op games", "retro games", "esports"], "pub quiz": ["trivia", "crosswords", "music quizzes"], hiking: ["day trips", "camping", "wild swimming"],
    cycling: ["road bikes", "gravel rides", "bike repair"], concerts: ["festivals", "indie gigs", "metal shows"], cooking: ["barbecue", "baking", "dinner parties"],
    coding: ["hackathons", "side projects", "open source"], chess: ["blitz", "chess clubs", "go"],
  },
};
const jmPicksLabel = (p) => { const n = (p || []).map((x) => (x === "other" ? "something else" : x)); return n.length <= 1 ? n[0] || "" : n.length === 2 ? `${n[0]} or ${n[1]}` : `${n[0]}, ${n[1]} +${n.length - 2}`; };
const jmToggle = (arr, x, min = 0) => (arr.includes(x) ? (arr.length > min ? arr.filter((y) => y !== x) : arr) : [...arr, x]);

const JM_FALLBACK_Q = {
  date: [
    { question: "Perfect first hour with someone new?", options: ["a long walk, no plan", "bar stools and bad jokes", "a gallery we pretend to get", "cooking something messy"] },
    { question: "What makes you lose track of time?", options: ["a good argument", "a record shop", "people-watching", "a project at 2am"] },
    { question: "Which small thing wins you over?", options: ["remembering details", "laughing at themselves", "great taste in music", "being on time"] },
    { question: "Your friends would call you…", options: ["the planner", "the instigator", "the calm one", "the storyteller"] },
  ],
  mate: [
    { question: "Nothing planned tonight. What's the move?", options: ["grab a pint", "find a pickup game", "wander somewhere new", "board games till late"] },
    { question: "In a group you're usually…", options: ["the one with the plan", "the joker", "the listener", "the competitive one"] },
    { question: "What would you teach a new mate?", options: ["a card game", "a running route", "a recipe", "a hidden bar"] },
    { question: "Pick a deal-breaker.", options: ["always late", "no banter", "phone at the table", "sore loser"] },
  ],
};
const JM_VIBES = [
  "quietly funny — will out-argue you about pizza",
  "early bird with a film camera — opinions on oat milk",
  "knows every climbing gym in town — still scared of ladders",
  "techno on fridays — crosswords on sundays",
  "plans the trip — forgets the charger",
];
const JM_MATCH_VIBES = {
  date: [
    { q: "early bird with a film camera — opinions on oat milk", opener: "what's the last thing you shot on film?", interests: ["photography", "coffee", "travel"] },
    { q: "reads the menu twice — orders the first thing", opener: "what are you ordering? first answer only", interests: ["cooking", "wine", "books"] },
    { q: "quietly funny — will out-argue you about pizza", opener: "pineapple. defend your position.", interests: ["street food", "cinema", "jazz"] },
  ],
  mate: [
    { q: "techno on fridays — crosswords on sundays", opener: "seven letters, means 'found by compass'?", interests: ["concerts", "pub quiz", "coding"] },
    { q: "knows every climbing gym in town — still scared of ladders", opener: "best wall in town, go", interests: ["climbing", "hiking", "gym"] },
    { q: "will lose at chess — will demand a rematch", opener: "best of three, or are you scared?", interests: ["chess", "board games", "gaming"] },
  ],
};
const JM_NAMES = { her: ["Mia", "Lena", "Zoe", "Ines"], his: ["Theo", "Jonas", "Max", "Leo"], their: ["Sam", "Robin", "Noa", "Kai"] };
const JM_SWIPES = [
  { n: 1, traits: "tall · dark hair · beard" },
  { n: 2, traits: "petite · freckles · curly red hair" },
  { n: 3, traits: "athletic · shaved head · tattoos" },
  { n: 4, traits: "glasses · long hair · soft style" },
  { n: 5, traits: "broad · grey streaks · stubble" },
  { n: 6, traits: "slim · bleached crop · piercings" },
];

function FieldLabel({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px" }}>
      <span className="t-mono" style={{ color: "var(--fg-2)" }}>{children}</span>
      {right != null && <span className="t-mono tabular" style={{ color: "var(--fg-1)" }}>{right}</span>}
    </div>
  );
}

function TextField({ label, value, onChange, type = "text", placeholder, onEnter, autoFocus, style }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input className="jm-input" type={type} value={value} placeholder={placeholder} autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ height: 52, borderRadius: 999, border: 0, padding: "0 20px", boxSizing: "border-box", width: "100%",
          background: "var(--surface-card)", boxShadow: focus ? "inset 0 0 0 1px var(--fg-1)" : "inset 0 0 0 1px var(--separator), var(--shadow-1)",
          fontFamily: "var(--font-sans)", fontSize: 17, color: "var(--fg-1)", outline: focus ? "1px solid var(--focus-ring)" : "none", outlineOffset: 2,
          transition: "box-shadow var(--dur-fast) ease" }} />
    </label>
  );
}

function RangeSlider({ min = 18, max = 60, value, onChange }) {
  const track = React.useRef(null);
  const drag = React.useRef(null);
  const pct = (v) => ((v - min) / (max - min)) * 100;
  const fromX = (x) => { const r = track.current.getBoundingClientRect(); return Math.round(min + Math.min(1, Math.max(0, (x - r.left) / r.width)) * (max - min)); };
  const update = (x) => {
    const v = fromX(x), n = [...value];
    if (drag.current === 0) n[0] = Math.min(v, value[1] - 1); else n[1] = Math.max(v, value[0] + 1);
    onChange(n);
  };
  const down = (e) => { const v = fromX(e.clientX); drag.current = Math.abs(v - value[0]) <= Math.abs(v - value[1]) ? 0 : 1; e.currentTarget.setPointerCapture(e.pointerId); update(e.clientX); };
  const thumb = (v, i) => (
    <span key={i} style={{ position: "absolute", top: "50%", left: `${pct(v)}%`, width: 28, height: 28, margin: "-14px 0 0 -14px", borderRadius: 999,
      background: "var(--surface-card)", boxShadow: "var(--shadow-4)" }} />
  );
  return (
    <div onPointerDown={down} onPointerMove={(e) => drag.current != null && update(e.clientX)} onPointerUp={() => (drag.current = null)}
      style={{ height: 44, padding: "0 14px", touchAction: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
      <div ref={track} style={{ position: "relative", flex: 1, height: 4, borderRadius: 999, background: "var(--track-off)" }}>
        <span style={{ position: "absolute", top: 0, bottom: 0, left: `${pct(value[0])}%`, width: `${pct(value[1]) - pct(value[0])}%`, borderRadius: 999, background: "var(--fg-1)" }} />
        {thumb(value[0], 0)}{thumb(value[1], 1)}
      </div>
    </div>
  );
}

function CatTile({ icon, label, selected, onClick }) {
  const { Icon } = SH_NS;
  const [p, setP] = React.useState(false);
  const [h, setH] = React.useState(false);
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} onPointerDown={() => setP(true)} onPointerUp={() => setP(false)}
      onPointerLeave={() => { setP(false); setH(false); }} onPointerEnter={(e) => e.pointerType === "mouse" && setH(true)}
      style={{ height: 76, borderRadius: "var(--radius-row)", border: 0, padding: "12px 12px 10px", display: "flex", flexDirection: "column",
        alignItems: "flex-start", justifyContent: "space-between", textAlign: "left", cursor: "pointer",
        background: selected ? "var(--fg-1)" : h ? "color-mix(in oklab,var(--surface-card),rgb(var(--overlay)) 4%)" : "var(--surface-card)",
        color: selected ? "var(--background)" : "var(--fg-1)", boxShadow: selected ? "none" : "var(--shadow-2)",
        fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: "16px", fontWeight: 600,
        fontVariationSettings: selected || h ? "var(--fw-semibold)" : "var(--fw-medium)",
        transform: p ? "scale(var(--press-scale))" : "scale(1)",
        transition: "transform var(--dur-press) var(--ease-spring), background-color var(--dur-snappy) var(--ease-spring), color var(--dur-snappy) ease" }}>
      <Icon name={icon} size={22} strokeWidth={selected || h ? 2 : 1.5} />
      <span>{label}</span>
    </button>
  );
}

function Thinking({ text }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--glow)", boxShadow: "0 0 8px var(--glow)", animation: "jm-pulse 1s ease-in-out infinite" }} />
        <span className="t-footnote">{text}</span>
      </div>
      {[92, 70, 0, 46, 58, 40].map((w, i) => w ? <span key={i} style={{ height: i < 2 ? 30 : 40, width: `${w}%`, borderRadius: i < 2 ? 10 : 999, background: "var(--surface-chip)" }} /> : <span key={i} style={{ height: 4 }} />)}
    </div>
  );
}

const jmClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

Object.assign(window, { JM_PW, JM_PH, JM_CATS, jmIntentIcon, JM_INTERESTS, JM_RELATED, jmPicksLabel, jmToggle, JM_FALLBACK_Q, JM_VIBES, JM_MATCH_VIBES, JM_NAMES, JM_SWIPES, FieldLabel, TextField, RangeSlider, CatTile, Thinking, jmClock });
