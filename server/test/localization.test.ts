import { describe, expect, test } from "bun:test"

import { i18n, resolveLanguage } from "../src/localization/i18n"

describe("localization", () => {
  test("resolves supported regional language tags", () => {
    expect(resolveLanguage("pl-PL")).toBe("pl")
    expect(resolveLanguage("sk-SK")).toBe("sk")
    expect(resolveLanguage("de-DE")).toBe("en")
    expect(resolveLanguage(undefined)).toBe("en")
  })

  test("translates magic-link emails", () => {
    expect(i18n.t("magicLink.subject", { lng: "en" })).toBe("Your JustMate sign-in link")
    expect(i18n.t("magicLink.subject", { lng: "pl" })).toBe("Twój link logowania do JustMate")
    expect(i18n.t("magicLink.subject", { lng: "sk" })).toBe("Tvoj prihlasovací odkaz do JustMate")
  })
})
