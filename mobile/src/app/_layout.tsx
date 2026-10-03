import { useLocales } from "expo-localization"
import { DefaultTheme, Stack, ThemeProvider } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { authClient } from "@/lib/auth-client"
import i18n, { resolveLanguage } from "@/localization/i18n"
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
  const { data: session, isPending } = authClient.useSession()
  const languageCode = useLocales()[0]?.languageCode

  useEffect(() => {
    void i18n.changeLanguage(resolveLanguage(languageCode))
  }, [languageCode])

  if (isPending)
    return <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }} />

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
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
