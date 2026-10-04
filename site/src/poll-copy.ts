// its own module, so the main bundle (site.js) does not change with the poll
import type { Lang } from "./copy"

const pollEn = {
  title: "JustMate · Poll",
  eyebrow: "HackYeah 2026 · 4 questions",
  heading: "Would you meet for real?",
  lead: "Anonymous, four taps. We show the totals on stage.",
  questions: [
    {
      id: "q1",
      text: "An app proposes one plan near you — an activity, a public place, a time — with one compatible person. Would you tap yes?",
      options: { yes: "Yes", maybe: "Maybe", no: "No" },
    },
    {
      id: "q2",
      text: "Would you rather meet without seeing a photo first?",
      options: { yes: "Yes", either: "Either way", no: "No" },
    },
    {
      id: "q3",
      text: "Have you moved to a new city in the last three years?",
      options: { yes: "Yes", no: "No" },
    },
    {
      id: "q4",
      text: "Would you trust it more if your university or employer offered it?",
      options: { yes: "Yes, more", same: "Same", no: "Less" },
    },
  ],
  submit: "Send",
  sending: "Sending…",
  error: "That didn't go through. Try again in a minute.",
  privacy: "No name, no email, no IP. We only count answers.",
  done: "Thanks, you're counted.",
  pitch:
    "JustMate makes one small plan near you with someone who fits, and it's on only when you're both in.",
  more: "See JustMate",
  results: "Live results",
  answers: "answers",
}

const pollPl: typeof pollEn = {
  title: "JustMate · Ankieta",
  eyebrow: "HackYeah 2026 · 4 pytania",
  heading: "Spotkasz się naprawdę?",
  lead: "Anonimowo, cztery kliknięcia. Wyniki pokażemy na scenie.",
  questions: [
    {
      id: "q1",
      text: "Aplikacja proponuje jeden plan w pobliżu — zajęcie, miejsce publiczne, godzinę — z jedną pasującą osobą. Klikniesz „tak”?",
      options: { yes: "Tak", maybe: "Może", no: "Nie" },
    },
    {
      id: "q2",
      text: "Wolisz spotkać się bez wcześniejszego oglądania zdjęcia?",
      options: { yes: "Tak", either: "Obojętnie", no: "Nie" },
    },
    {
      id: "q3",
      text: "Czy w ciągu ostatnich trzech lat zdarzyło ci się przeprowadzić do nowego miasta?",
      options: { yes: "Tak", no: "Nie" },
    },
    {
      id: "q4",
      text: "Czy taka aplikacja budziłaby w tobie więcej zaufania, gdyby oferowała ją twoja uczelnia albo pracodawca?",
      options: { yes: "Tak, więcej", same: "Bez różnicy", no: "Mniej" },
    },
  ],
  submit: "Wyślij",
  sending: "Wysyłanie…",
  error: "Nie udało się. Spróbuj ponownie za minutę.",
  privacy: "Bez imienia, e-maila i IP. Liczymy tylko odpowiedzi.",
  done: "Dzięki, głos zapisany.",
  pitch:
    "JustMate układa mały plan w pobliżu z kimś, kto do ciebie pasuje, i plan rusza dopiero, gdy oboje go przyjmiecie.",
  more: "Zobacz JustMate",
  results: "Wyniki na żywo",
  answers: "odpowiedzi",
}

export type PollCopy = typeof pollEn
export const POLL: Record<Lang, PollCopy> = { en: pollEn, pl: pollPl }
