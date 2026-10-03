import { getLocales } from "expo-localization"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { en } from "./locales/en"
import { pl } from "./locales/pl"
import { sk } from "./locales/sk"

export type SupportedLanguage = "en" | "pl" | "sk"

const supportedLanguages = new Set<SupportedLanguage>(["en", "pl", "sk"])

export function resolveLanguage(language?: string | null): SupportedLanguage {
  const code = language?.split("-")[0]?.toLowerCase() as SupportedLanguage
  return supportedLanguages.has(code) ? code : "en"
}

export function currentLanguage(): SupportedLanguage {
  return resolveLanguage(i18n.resolvedLanguage)
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, pl: { translation: pl }, sk: { translation: sk } },
  lng: resolveLanguage(getLocales()[0]?.languageCode),
  fallbackLng: "en",
  supportedLngs: ["en", "pl", "sk"],
  interpolation: { escapeValue: false },
  initAsync: false,
})

export default i18n
