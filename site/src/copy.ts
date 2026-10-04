import vo from "../../video/motion/scripts/vo.json"

export type Lang = "en" | "pl"
export const LANGS: Lang[] = ["en", "pl"]

export const LINKS = {
  github: "https://github.com/uteg-labs/just-mate",
  deck: "JustMate-Deck.pdf",
  whitepaper: "JustMate-Whitepaper.pdf",
}

export const TEAM = [
  "Arthur Kozubov",
  "Jozef Zvalo",
  "Andrej Zak",
  "Nikita Orlov",
  "Serhii Vielkin",
]

export const SHOTS = ["plan-list", "plan-proposal", "plan-bothin", "plan-confirmed"]

export type Story = {
  id: string
  piece: string
  poster: number
  tag: string
  title: string
  body: string
  points: string[]
  note?: string
  dark?: boolean
  shots?: boolean
}

const en = {
  meta: {
    title: "just-mate · Meet for real",
    description:
      "For anyone lonely in a city. just-mate makes a small plan near you with someone who fits, and it is on only when you are both in. Already out? It walks you to someone compatible right now.",
  },
  nav: { how: "How it works", safety: "Safety", venues: "Venues", join: "Join the waitlist" },
  clip: {
    sound: "Play with sound",
    mute: "Mute",
    play: "Play",
    pause: "Pause",
    film: "Film",
  },
  hero: {
    eyebrow: "HackYeah 2026 · Kraków",
    title: "Meet for real.",
    lead: "For anyone lonely in a city. just-mate makes a small plan near you with someone who fits, and it's on only when you're both in. Already out? It walks you to someone compatible right now.",
    join: "Join the waitlist",
    watch: "Watch with sound · 54 s",
  },
  problem: {
    eyebrow: "The problem",
    title: "One in six people is lonely.",
    lead: "Apps solved matching. Nobody solved the door. A lonely person rarely goes out on a whim: they need a reason, a time, a place, and proof that someone will actually be there.",
    stats: [
      { n: "1 in 6", label: "people worldwide is lonely", src: "WHO, 2025" },
      { n: "2×", label: "as likely to become depressed when lonely", src: "WHO, 2025" },
      {
        n: "17–21%",
        label: "of 13–29-year-olds are lonely, the highest of any age",
        src: "WHO, 2025",
      },
      {
        n: "~50 h",
        label: "together to turn an acquaintance into a casual friend",
        src: "Hall, 2018",
      },
    ],
    barriersTitle: "Three things stand between a lonely person and a real conversation.",
    barriers: [
      {
        t: "Initiative",
        d: "Low energy makes organising anything, even choosing between options, too much.",
      },
      {
        t: "The empty table",
        d: "What if nobody comes? One no-show confirms the story “nobody wants me”.",
      },
      {
        t: "Judgment",
        d: "Photo-first apps turn meeting into an audition, and chat into weeks of performance.",
      },
    ],
  },
  rules: {
    eyebrow: "The constitution",
    title: "Three rules. Every feature is tested against them.",
    items: [
      {
        icon: "scan-face",
        t: "No faces.",
        d: "No profile photos anywhere. People see your vibe badge, never a picture to judge.",
      },
      {
        icon: "message-circle",
        t: "No chat.",
        d: "Nothing to type. A yes on both sides, then a real conversation, face to face.",
      },
      {
        icon: "map-pin",
        t: "No people pins.",
        d: "Zones with a soft glow, never anyone's location. Places can be pinned, people never.",
      },
    ],
  },
  speeds: {
    eyebrow: "How it works",
    title: "One app, two speeds.",
    plan: { t: "Plan", d: "When you need a reason to go." },
    now: { t: "Now", d: "When you're already out." },
    end: "Both end the same way: you meet, first names unlock, and “same again?” is one tap.",
  },
  stories: [
    {
      id: "plan",
      piece: "Tomek",
      poster: 210,
      tag: "Plan · Tomek, 28",
      title: "The app proposes. You only say yes.",
      body: "Tomek moved to Kraków four months ago and works from home. On Sunday night just-mate offers him one plan: board games · Thu 19:00 · 9 min on foot · with one other person, shown by their vibe badge.",
      points: [
        "One concrete plan, not a menu: activity, public venue, time and walk time.",
        "Just the two of you. It's on only when both tap Accept plan: then “you're both in” on both phones.",
        "After you meet, their first name unlocks along with the distance you walked: “Say hi to Ola.”",
        "“Same again next week?” is one button. Booking the repeat slot is the production path.",
      ],
      shots: true,
    },
    {
      id: "now",
      piece: "Lucia",
      poster: 240,
      tag: "Now · Lucía, 27",
      title: "Already out? Both phones ping at once.",
      body: "Lucía has three days alone in Kraków. On an evening walk through Kazimierz she picks beer. Two minutes later someone 300 m away who wants the same thing gets the same ping.",
      points: [
        "Invisible by default. You search on purpose, for one occasion.",
        "Compatible, same intent, within walking distance: both phones ping at the same moment.",
        "Both tap Open compass, or nothing happens. A direction, never a map of them.",
        "Cold, warm, hot, burning. Ten minutes to find each other.",
      ],
    },
    {
      id: "date",
      piece: "Ania",
      poster: 300,
      tag: "Date · Ania, 24",
      title: "Dating without photos.",
      body: "Ania deleted Tinder twice. Here her vibe is the only thing anyone sees: a lanyard badge designed from her answers, one line instead of a face.",
      points: [
        "Attraction is a private compatibility signal, never a picture to judge.",
        "No chat purgatory: a mutual yes opens the compass.",
        "First names unlock only once you've met.",
        "Date mode is 18+, enforced on the server.",
      ],
    },
    {
      id: "safety",
      piece: "Marta",
      poster: 240,
      tag: "Safety · Marta, 31",
      title: "Serendipity, without the creepiness.",
      body: "Marta walks home alone at night. Nobody knows where she is unless she said: now, this person, yes. And she can end it instantly.",
      points: [
        "Invisible until you search.",
        "Zones, never your location. Positions live only inside an active session and are never stored.",
        "Nothing unlocks unless both say yes.",
        "Vanish: one tap ends it, for both.",
      ],
      note: "Production path: verified-only matching, women-only plans, report = block, meeting point first.",
      dark: true,
    },
    {
      id: "venues",
      piece: "Piotr",
      poster: 330,
      tag: "Venues · Piotr, 38",
      title: "Venues fill quiet nights. Meeting stays free.",
      body: "Piotr runs a board-game café. On Tuesday and Thursday nights the tables stay empty. He lists two table slots a week, and just-mate fills them with people who wanted exactly that.",
      points: [
        "Partners see counts and check-ins, never identities.",
        "A hosted plan looks like any plan, labelled with the venue that hosts it.",
        "Meeting people and safety are never paywalled.",
      ],
      note: "Production path (M1).",
    },
  ] as Story[],
  shots: "Real screens from the hackathon build",
  pays: {
    eyebrow: "Business model",
    title: "Those who earn from people going out pay. Meeting never does.",
    items: [
      { n: "€39 / month", d: "Partner venues list plan slots. The primary revenue." },
      { n: "15%", d: "of an optional prepaid first round at partner venues." },
      { n: "€4.99 / month", d: "just-mate+: host your own plans, travel mode." },
      { n: "€500–2,000", d: "per festival or conference: official zones and plans." },
    ],
    readout:
      "Estimate for one city: about 21 partner venues cover the running costs. A new city opens with plans, the Now loop lights up as density grows.",
  },
  care: {
    title: "Not therapy. A reason to go out.",
    body: "just-mate is a social-connection product, not a medical one. We never claim to treat anything, we never ask how you feel, and there are no guilt mechanics: no streaks to lose, no “a week without going out”. Invitations are easy to ignore and a decline is silent.",
  },
  demo: {
    eyebrow: "HackYeah 2026 · built in 24 hours",
    title: "What's real in the demo.",
    realTitle: "Real",
    real: [
      "Faceless profiles, interests and picks",
      "Zone glow from live positions",
      "A mutual match delivered live to both phones over WebSocket",
      "Explainable compatibility score",
      "Compass bearing, haptics and Vanish",
      "Plans: proposed from real profiles, Accept plan, you're both in on both phones",
    ],
    cannedTitle: "Canned, and labelled",
    canned: [
      "Ghost users that add zone density",
      "Demo-mode positions, since there's no GPS indoors",
      "The seeded list of venues",
      "Matching model trained on synthetic profiles scores Now for real accounts; plans and the demo run on the explainable score",
    ],
    deck: "Deck",
    whitepaper: "Whitepaper",
    github: "Source code",
    team: "Team",
  },
  join: {
    title: "Be first when we open in your city.",
    body: "We open city by city, starting where plans fill easily. Leave your email and we'll write once, when it's your turn.",
    email: "Email",
    role: "I'm joining as",
    roles: { person: "someone who wants to meet people", venue: "a venue" },
    city: "City (optional)",
    cityHint: "Kraków",
    submit: "Join the waitlist",
    sending: "Joining…",
    done: "You're on the list. We'll write when just-mate opens near you.",
    error: "That didn't go through. Try again in a minute.",
    invalid: "Check the email address.",
    privacy:
      "We use your email only for this: one message, no newsletter. Ask us to delete it any time.",
  },
  footer: {
    tagline: "Meet for real.",
    built: "Built at HackYeah 2026, TAURON Arena Kraków",
    help: "Need to talk to someone? In Poland, call 116 123.",
  },
}

export type Copy = typeof en

const pl: Copy = {
  meta: {
    title: "just-mate · Spotkaj kogoś naprawdę",
    description:
      "Dla wszystkich, którym w nowym mieście doskwiera samotność. just-mate układa mały plan w pobliżu z kimś, kto do ciebie pasuje, i plan rusza dopiero, gdy oboje go przyjmiecie. Już jesteś na mieście? Zaprowadzi cię do kogoś pasującego od razu.",
  },
  nav: {
    how: "Jak to działa",
    safety: "Bezpieczeństwo",
    venues: "Lokale",
    join: "Zapisz się",
  },
  clip: {
    sound: "Odtwórz z dźwiękiem",
    mute: "Wycisz",
    play: "Odtwórz",
    pause: "Pauza",
    film: "Film",
  },
  hero: {
    eyebrow: "HackYeah 2026 · Kraków",
    title: "Spotkaj kogoś naprawdę.",
    lead: "Dla wszystkich, którym w nowym mieście doskwiera samotność. just-mate układa mały plan w pobliżu z kimś, kto do ciebie pasuje, i plan rusza dopiero, gdy oboje go przyjmiecie. Już jesteś na mieście? Zaprowadzi cię do kogoś pasującego od razu.",
    join: "Zapisz się na listę",
    watch: "Obejrzyj z dźwiękiem · 54 s",
  },
  problem: {
    eyebrow: "Problem",
    title: "Co szósta osoba jest samotna.",
    lead: "Aplikacje rozwiązały dopasowanie. Nikt nie rozwiązał drzwi. Samotna osoba rzadko wychodzi spontanicznie: potrzebuje powodu, godziny, miejsca i pewności, że ktoś naprawdę przyjdzie.",
    stats: [
      { n: "1 na 6", label: "osób na świecie doświadcza samotności", src: "WHO, 2025" },
      { n: "2×", label: "wyższe ryzyko depresji u osób samotnych", src: "WHO, 2025" },
      {
        n: "17–21%",
        label: "osób w wieku 13–29 lat jest samotnych, najwięcej ze wszystkich grup wiekowych",
        src: "WHO, 2025",
      },
      {
        n: "~50 h",
        label: "wspólnego czasu, by znajomość stała się luźną przyjaźnią",
        src: "Hall, 2018",
      },
    ],
    barriersTitle: "Między samotną osobą a prawdziwą rozmową stoją trzy rzeczy.",
    barriers: [
      {
        t: "Inicjatywa",
        d: "Przy braku energii zorganizowanie czegokolwiek, nawet wybór między opcjami, to za dużo.",
      },
      {
        t: "Pusty stolik",
        d: "A jeśli nikt nie przyjdzie? Jedno wystawienie do wiatru potwierdza historię „nikt mnie nie chce”.",
      },
      {
        t: "Ocena",
        d: "Aplikacje oparte na zdjęciach zmieniają spotkanie w casting, a czat w tygodnie występów.",
      },
    ],
  },
  rules: {
    eyebrow: "Konstytucja",
    title: "Trzy zasady. Każdą funkcję sprawdzamy właśnie nimi.",
    items: [
      {
        icon: "scan-face",
        t: "Bez twarzy.",
        d: "Nigdzie nie ma zdjęć profilowych. Inni widzą twoją plakietkę z vibe'em, nigdy zdjęcie do oceniania.",
      },
      {
        icon: "message-circle",
        t: "Bez czatu.",
        d: "Nie ma nic do pisania. Obustronne „tak”, a potem prawdziwa rozmowa, twarzą w twarz.",
      },
      {
        icon: "map-pin",
        t: "Bez pinezek z ludźmi.",
        d: "Strefy z delikatną poświatą, nigdy niczyja lokalizacja. Miejsca mogą mieć pinezkę, ludzie nigdy.",
      },
    ],
  },
  speeds: {
    eyebrow: "Jak to działa",
    title: "Jedna aplikacja, dwa tempa.",
    plan: { t: "Plan", d: "Gdy potrzebujesz powodu, żeby wyjść." },
    now: { t: "Teraz", d: "Gdy już jesteś na mieście." },
    end: "Oba kończą się tak samo: spotykacie się, imiona się odblokowują, a „to samo za tydzień?” to jedno stuknięcie.",
  },
  stories: [
    {
      id: "plan",
      piece: "Tomek",
      poster: 210,
      tag: "Plan · Tomek, 28",
      title: "Aplikacja proponuje. Ty tylko mówisz tak.",
      body: "Tomek przeprowadził się do Krakowa cztery miesiące temu i pracuje z domu. W niedzielę wieczorem just-mate proponuje mu jeden plan: planszówki · czw 19:00 · 9 min pieszo · z jedną osobą, którą widać po jej plakietce.",
      points: [
        "Jeden konkretny plan zamiast menu: aktywność, publiczne miejsce, godzina i czas dojścia.",
        "Tylko wy dwoje. Plan dochodzi do skutku, gdy oboje klikniecie „Przyjmij plan”: wtedy na obu telefonach widać „oboje jesteście na tak”.",
        "Po spotkaniu odblokowuje się imię i dystans, który przeszliście: „Ola czeka. Przywitaj się.”",
        "„Powtórka za tydzień?” to jeden przycisk. Rezerwacja tego samego terminu to ścieżka produkcyjna.",
      ],
      shots: true,
    },
    {
      id: "now",
      piece: "Lucia",
      poster: 240,
      tag: "Teraz · Lucía, 27",
      title: "Już jesteś na mieście? Oba telefony odzywają się naraz.",
      body: "Lucía ma trzy dni sama w Krakowie. Na wieczornym spacerze po Kazimierzu wybiera piwo. Dwie minuty później ktoś 300 m dalej, kto chce tego samego, dostaje to samo powiadomienie.",
      points: [
        "Domyślnie nikt cię nie widzi. Szukasz świadomie, na jedną okazję.",
        "Pasujecie do siebie, chcecie tego samego i jesteście w zasięgu spaceru: oba telefony odzywają się w tej samej chwili.",
        "Oboje stukacie „Otwórz kompas” albo nic się nie dzieje. Kierunek, nigdy mapa z drugą osobą.",
        "Zimno, ciepło, gorąco, parzy. Dziesięć minut, żeby się znaleźć.",
      ],
    },
    {
      id: "date",
      piece: "Ania",
      poster: 300,
      tag: "Randka · Ania, 24",
      title: "Randki bez zdjęć.",
      body: "Ania dwa razy usunęła Tindera. Tutaj jej vibe to jedyne, co ktokolwiek widzi: plakietka zaprojektowana z jej odpowiedzi, jedno zdanie zamiast twarzy.",
      points: [
        "Atrakcyjność to prywatny sygnał dopasowania, nigdy zdjęcie do oceniania.",
        "Bez czatowego czyśćca: wzajemne „tak” otwiera kompas.",
        "Imiona odblokowują się dopiero po spotkaniu.",
        "Tryb randkowy jest od 18 lat, pilnuje tego serwer.",
      ],
    },
    {
      id: "safety",
      piece: "Marta",
      poster: 240,
      tag: "Bezpieczeństwo · Marta, 31",
      title: "Spontaniczne spotkania, bez poczucia zagrożenia.",
      body: "Marta wraca nocą sama do domu. Nikt nie wie, gdzie jest, dopóki ona sama nie powie: teraz, ta osoba, tak. I może to zakończyć w sekundę.",
      points: [
        "Nikt cię nie widzi, dopóki nie zaczniesz szukać.",
        "Strefy, nigdy twoja lokalizacja. Pozycje istnieją tylko w trakcie aktywnej sesji i nigdy nie są zapisywane.",
        "Nic się nie odblokuje, jeśli obie strony nie powiedzą „tak”.",
        "Zniknij: jedno stuknięcie kończy wszystko, dla obojga.",
      ],
      note: "Ścieżka produkcyjna: dopasowania tylko ze zweryfikowanymi, plany tylko dla kobiet, zgłoszenie = blokada, najpierw punkt spotkania.",
      dark: true,
    },
    {
      id: "venues",
      piece: "Piotr",
      poster: 330,
      tag: "Lokale · Piotr, 38",
      title: "Lokale wypełniają puste wieczory. Spotkania zostają darmowe.",
      body: "Piotr prowadzi kawiarnię z planszówkami. We wtorki i czwartki wieczorem stoliki stoją puste. Wystawia dwa stoliki w tygodniu, a just-mate wypełnia je ludźmi, którzy chcieli dokładnie tego.",
      points: [
        "Partnerzy widzą liczby i wejścia, nigdy tożsamości.",
        "Plan w lokalu wygląda jak każdy inny, z nazwą lokalu, który go organizuje.",
        "Poznawanie ludzi i bezpieczeństwo nigdy nie są płatne.",
      ],
      note: "Ścieżka produkcyjna (M1).",
    },
  ],
  shots: "Prawdziwe ekrany z wersji z hackathonu",
  pays: {
    eyebrow: "Model biznesowy",
    title: "Płacą ci, którzy zarabiają na tym, że ludzie wychodzą. Spotkania nigdy.",
    items: [
      { n: "39 € / mies.", d: "Lokale partnerskie wystawiają terminy planów. Główny przychód." },
      { n: "15%", d: "z opcjonalnej przedpłaconej pierwszej kolejki w lokalach partnerskich." },
      { n: "4,99 € / mies.", d: "just-mate+: własne plany, tryb podróży." },
      { n: "500–2000 €", d: "za festiwal lub konferencję: oficjalne strefy i plany." },
    ],
    readout:
      "Szacunek dla jednego miasta: około 21 lokali partnerskich pokrywa koszty utrzymania. Nowe miasto startuje z planami, a tryb Teraz rozkręca się wraz z gęstością.",
  },
  care: {
    title: "To nie terapia. To powód, żeby wyjść.",
    body: "just-mate to produkt do budowania relacji, nie wyrób medyczny. Nigdy nie twierdzimy, że coś leczymy, nie pytamy, jak się czujesz, i nie ma mechanizmów poczucia winy: żadnych serii do stracenia, żadnego „tydzień bez wyjścia”. Zaproszenia łatwo zignorować, a odmowa jest cicha.",
  },
  demo: {
    eyebrow: "HackYeah 2026 · zbudowane w 24 godziny",
    title: "Co w demo jest prawdziwe.",
    realTitle: "Prawdziwe",
    real: [
      "Profile bez twarzy, zainteresowania i wybory",
      "Poświata stref z bieżących pozycji",
      "Wzajemne dopasowanie dostarczane na żywo na oba telefony przez WebSocket",
      "Wyjaśnialny wynik dopasowania",
      "Kierunek kompasu, wibracje i Zniknij",
      "Plany: proponowane z prawdziwych profili, „Przyjmij plan”, „oboje jesteście na tak” na obu telefonach",
    ],
    cannedTitle: "Symulowane i oznaczone",
    canned: [
      "Wirtualni użytkownicy zwiększający gęstość stref",
      "Pozycje w trybie demo, bo w hali nie ma GPS",
      "Przygotowana lista lokali",
      "Model dopasowania wytrenowany na syntetycznych profilach ocenia „Teraz” dla prawdziwych kont; plany i demo działają na wyjaśnialnym wyniku",
    ],
    deck: "Prezentacja",
    whitepaper: "Whitepaper",
    github: "Kod źródłowy",
    team: "Zespół",
  },
  join: {
    title: "Zapisz się, zanim ruszymy w twoim mieście.",
    body: "Startujemy miasto po mieście, tam, gdzie plany łatwo się zapełniają. Zostaw e-mail, a napiszemy raz, gdy przyjdzie kolej na twoje miasto.",
    email: "E-mail",
    role: "Dołączam jako",
    roles: { person: "osoba, która chce poznać ludzi", venue: "lokal" },
    city: "Miasto (opcjonalnie)",
    cityHint: "Kraków",
    submit: "Zapisz się",
    sending: "Zapisywanie…",
    done: "Jesteś na liście. Napiszemy, gdy just-mate ruszy w twojej okolicy.",
    error: "Nie udało się. Spróbuj ponownie za minutę.",
    invalid: "Sprawdź adres e-mail.",
    privacy:
      "Używamy e-maila tylko do tego: jedna wiadomość, żadnego newslettera. Możesz poprosić o usunięcie w każdej chwili.",
  },
  footer: {
    tagline: "Spotkaj kogoś naprawdę.",
    built: "Zbudowane na HackYeah 2026, TAURON Arena Kraków",
    help: "Potrzebujesz z kimś porozmawiać? W Polsce zadzwoń pod 116 123.",
  },
}

export const COPY: Record<Lang, Copy> = { en, pl }

const enCaptions = Object.fromEntries(
  Object.entries(vo.lines).map(([k, v]) => [k, v.replaceAll("Just Mate", "just-mate")]),
)

export const CAPTIONS: Record<Lang, Record<string, string>> = {
  en: enCaptions,
  pl: {
    "hook-0": "Co szósta osoba jest samotna.",
    "turn-0": "Aplikacje rozwiązały dopasowanie.",
    "turn-1": "Nikt nie rozwiązał drzwi.",
    plan: "W niedzielę wieczorem just-mate proponuje mu jeden mały plan. Wystarczy, że powie tak.",
    on: "Plan rusza tylko wtedy, gdy oboje powiecie tak. I teraz oboje jesteście na tak.",
    table: "Kompas otwiera się. Idą sobie naprzeciw. Spotkaliśmy się.",
    again: "Przywitaj się z Olą. Powtórka za tydzień? Tak zaczynają się przyjaźnie.",
    safety: "Wzajemna zgoda. Publiczne miejsca. Jedno stuknięcie, by zniknąć.",
    "logo-0": "To nie terapia. To powód, żeby wyjść.",
    "logo-1": "just-mate. Spotkaj kogoś naprawdę.",
    "speeds-0": "just-mate wyciąga cię z domu w dwóch tempach.",
    "speeds-1": "Plan, gdy potrzebujesz powodu, żeby wyjść.",
    "speeds-2": "Teraz, gdy już jesteś na mieście.",
    "m-table": "Dwie plakietki, bez twarzy. I jedno stuknięcie: powtórka za tydzień.",
    "m-now": "Teraz: ktoś w pobliżu chce tego samego. Oba telefony odzywają się naraz.",
    "m-walk": "Kompas prowadzi was do siebie. Cieplej. Cieplej.",
    "m-meet": "Wtedy odblokowują się imiona. Nic więcej.",
    "t-intro": "Tomek jest nowy w Krakowie i pracuje z domu.",
    "l-intro": "Lucía ma trzy dni sama w Krakowie. Na spacerze wybiera: piwo.",
    "l-ping": "Dwie minuty później oba telefony odzywają się naraz.",
    "l-walk": "Żadnej mapy z drugą osobą. Tylko kierunek. Cieplej. Cieplej.",
    "l-meet": "Piwo i ktoś, z kim można poznawać miasto.",
    "a-intro": "Ania dwa razy usunęła Tindera. Ma dość oceniania po zdjęciach.",
    "a-badge": "Tutaj jej vibe to jedyne, co ktokolwiek widzi.",
    "a-match": "Ktoś w pobliżu też ma ochotę na kawę. Oboje mówią tak.",
    "a-meet": "Imiona odblokowują się dopiero po spotkaniu.",
    "s-intro": "Marta chce spontanicznych spotkań, bez poczucia zagrożenia.",
    "s-0": "Niewidoczna, dopóki sama nie zacznie szukać.",
    "s-1": "Strefy, nigdy jej lokalizacja.",
    "s-2": "Nic się nie odblokuje, jeśli obie strony nie powiedzą tak.",
    "s-3": "I jedno stuknięcie kończy wszystko, dla obojga.",
    "p-intro":
      "Piotr prowadzi kawiarnię z planszówkami. We wtorki i czwartki wieczorem stoliki stoją puste.",
    "p-list": "Wystawia dwa stoliki. just-mate wypełnia je ludźmi, którzy chcieli dokładnie tego.",
    "p-full": "Lokale płacą za wypełnienie pustych wieczorów. Poznawanie ludzi zostaje darmowe.",
    "m-plan-0": "Plan: aplikacja proponuje jeden mały plan. Ty tylko mówisz tak.",
    "m-plan-1": "Rusza, gdy oboje jesteście na tak.",
    "rules-0":
      "Znajdziemy twoich ludzi. Nasza własna AI jest wytrenowana, by znaleźć ludzi, z którymi naprawdę pogadasz.",
    "rules-1": "Robimy plan za ciebie. Ty tylko mówisz tak.",
    "rules-2": "Już jesteś na mieście? Poznaj kogoś teraz.",
  },
}
