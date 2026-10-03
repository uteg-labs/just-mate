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
        passwordReset: {
          subject: "Reset your JustMate password",
          text: "Open this link to set a new JustMate password: {{url}}\n\nThis link expires in 1 hour. If you didn't ask for it, ignore this email.",
          intro: "Open this link to set a new JustMate password:",
          cta: "Set a new password",
          expiry: "This link expires in 1 hour. If you didn't ask for it, ignore this email.",
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
        passwordReset: {
          subject: "Zresetuj hasło do JustMate",
          text: "Otwórz ten link, aby ustawić nowe hasło do JustMate: {{url}}\n\nLink wygasa za 1 godzinę. Jeśli to nie Ty, zignoruj tę wiadomość.",
          intro: "Otwórz ten link, aby ustawić nowe hasło do JustMate:",
          cta: "Ustaw nowe hasło",
          expiry: "Link wygasa za 1 godzinę. Jeśli to nie Ty, zignoruj tę wiadomość.",
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
        passwordReset: {
          subject: "Obnov si heslo do JustMate",
          text: "Otvor tento odkaz a nastav si nové heslo do JustMate: {{url}}\n\nOdkaz platí 1 hodinu. Ak si o to nežiadal, tento e-mail ignoruj.",
          intro: "Otvor tento odkaz a nastav si nové heslo do JustMate:",
          cta: "Nastaviť nové heslo",
          expiry: "Odkaz platí 1 hodinu. Ak si o to nežiadal, tento e-mail ignoruj.",
        },
      },
    },
  },
  fallbackLng: "en",
  supportedLngs: ["en", "pl", "sk"],
  interpolation: { escapeValue: false },
  initAsync: false,
})
