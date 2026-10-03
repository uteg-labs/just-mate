import { useLocales } from "expo-localization"
import { DarkTheme, Stack, ThemeProvider } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { authClient } from "@/lib/auth-client"
import i18n, { resolveLanguage } from "@/localization/i18n"
import { colors } from "@/theme/colors"

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, primary: colors.glow },
}

export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession()
  const languageCode = useLocales()[0]?.languageCode

  useEffect(() => {
    void i18n.changeLanguage(resolveLanguage(languageCode))
  }, [languageCode])

  if (isPending) return <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }} />

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="register" />
          </Stack.Protected>
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="home" />
            <Stack.Screen name="account" />
            <Stack.Screen
              name="compass"
              options={{ presentation: "fullScreenModal", gestureEnabled: false }}
            />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
