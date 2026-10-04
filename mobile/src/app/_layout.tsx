import { useLocales } from "expo-localization"
import { DefaultTheme, Stack, ThemeProvider } from "expo-router"
import { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import i18n, { languageChoice, resolveLanguage } from "@/localization/i18n"
import { colors } from "@/theme/colors"

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.fg1,
    background: colors.background,
    card: colors.surfaceCard,
    text: colors.fg1,
    border: colors.separator,
    notification: colors.glow,
  },
}

export default function RootLayout() {
  const languageCode = useLocales()[0]?.languageCode

  useEffect(() => {
    if (languageChoice() === "system") void i18n.changeLanguage(resolveLanguage(languageCode))
  }, [languageCode])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.mapBg }}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.mapBg } }}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
