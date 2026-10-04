import { getLocales } from "expo-localization"
import * as SecureStore from "expo-secure-store"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { en } from "./locales/en"
import { pl } from "./locales/pl"
import { sk } from "./locales/sk"

export const LANGUAGES = ["en", "pl", "sk"] as const

export type SupportedLanguage = (typeof LANGUAGES)[number]
export type LanguageChoice = SupportedLanguage | "system"

const KEY = "justmate.language"

const supportedLanguages = new Set<string>(LANGUAGES)

export function resolveLanguage(language?: string | null): SupportedLanguage {
  const code = language?.split("-")[0]?.toLowerCase() as SupportedLanguage
  return supportedLanguages.has(code) ? code : "en"
}

export function currentLanguage(): SupportedLanguage {
  return resolveLanguage(i18n.resolvedLanguage)
}

export function languageChoice(): LanguageChoice {
  const saved = SecureStore.getItem(KEY)
  return saved && supportedLanguages.has(saved) ? (saved as SupportedLanguage) : "system"
}

export function deviceLanguage(): SupportedLanguage {
  return resolveLanguage(getLocales()[0]?.languageCode)
}

export function chooseLanguage(choice: LanguageChoice) {
  if (choice === "system") SecureStore.deleteItemAsync(KEY).catch(() => {})
  else SecureStore.setItemAsync(KEY, choice).catch(() => {})
  void i18n.changeLanguage(choice === "system" ? deviceLanguage() : choice)
}

function initialLanguage(): SupportedLanguage {
  const choice = languageChoice()
  return choice === "system" ? deviceLanguage() : choice
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, pl: { translation: pl }, sk: { translation: sk } },
  lng: initialLanguage(),
  fallbackLng: "en",
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false },
  initAsync: false,
})

export default i18n
