import i18next from "i18next"

export type SupportedLanguage = "en" | "pl" | "sk"

const supportedLanguages = new Set<SupportedLanguage>(["en", "pl", "sk"])

export function resolveLanguage(language: unknown): SupportedLanguage {
  if (typeof language !== "string") return "en"
  const code = language.split("-")[0]?.toLowerCase() as SupportedLanguage
  return supportedLanguages.has(code) ? code : "en"
}

export const i18n = i18next.createInstance()

void i18n.init({
  resources: {
    en: {
      translation: {
        magicLink: {
          subject: "Your JustMate sign-in link",
          text: "Open this link to sign in to JustMate: {{url}}\n\nThis link expires in 10 minutes.",
          intro: "Open this link to sign in to JustMate:",
          cta: "Meet for real",
          expiry: "This link expires in 10 minutes.",
        },
      },
    },
    pl: {
      translation: {
        magicLink: {
          subject: "Twój link logowania do JustMate",
          text: "Otwórz ten link, aby zalogować się do JustMate: {{url}}\n\nLink wygasa za 10 minut.",
          intro: "Otwórz ten link, aby zalogować się do JustMate:",
          cta: "Spotkajmy się naprawdę",
          expiry: "Link wygasa za 10 minut.",
        },
      },
    },
    sk: {
      translation: {
        magicLink: {
          subject: "Tvoj prihlasovací odkaz do JustMate",
          text: "Otvor tento odkaz a prihlás sa do JustMate: {{url}}\n\nOdkaz platí 10 minút.",
          intro: "Otvor tento odkaz a prihlás sa do JustMate:",
          cta: "Stretnime sa naozaj",
          expiry: "Odkaz platí 10 minút.",
        },
      },
    },
  },
  fallbackLng: "en",
  supportedLngs: ["en", "pl", "sk"],
  interpolation: { escapeValue: false },
  initAsync: false,
})
