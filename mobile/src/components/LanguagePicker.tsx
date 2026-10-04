import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { StyleProp, ViewStyle } from "react-native"

import { Segmented } from "@/components/ui"
import { chooseLanguage, LANGUAGES, type LanguageChoice, languageChoice } from "@/localization/i18n"

export const LanguagePicker = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { t } = useTranslation()
  const [language, setLanguage] = useState(languageChoice)

  const pick = (choice: LanguageChoice) => {
    setLanguage(choice)
    chooseLanguage(choice)
  }

  return (
    <Segmented
      items={[
        { value: "system", label: t("settings.languageSystem") },
        ...LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() })),
      ]}
      value={language}
      onChange={pick}
      fullWidth={false}
      style={style}
    />
  )
}
