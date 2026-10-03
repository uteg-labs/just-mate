import * as Linking from "expo-linking"
import { useLocales } from "expo-localization"
import { DarkTheme, router, Stack, ThemeProvider } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import { Alert } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { type AuthDestination, parseAuthCallback, storeAuthCallback } from "@/lib/auth-callback"
import { authClient } from "@/lib/auth-client"
import i18n, { resolveLanguage } from "@/localization/i18n"
import { colors } from "@/theme/colors"

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, primary: colors.glow },
}

export default function RootLayout() {
  const { data: session, isPending, isRefetching, refetch } = authClient.useSession()
  const linkingURL = Linking.useLinkingURL()
  const languageCode = useLocales()[0]?.languageCode
  const handledURL = useRef<string | undefined>(undefined)
  const [authDestination, setAuthDestination] = useState<AuthDestination>()
  const [isHandlingAuth, setIsHandlingAuth] = useState(false)

  useEffect(() => {
    void i18n.changeLanguage(resolveLanguage(languageCode))
  }, [languageCode])

  useEffect(() => {
    if (!linkingURL || handledURL.current === linkingURL) return

    const callback = parseAuthCallback(linkingURL)
    if (!callback) return

    handledURL.current = linkingURL
    setIsHandlingAuth(true)
    void storeAuthCallback(callback)
      .then(async () => {
        Linking.clearInitialURL()
        setAuthDestination(callback.destination)
        await refetch()
      })
      .catch(() => {
        Alert.alert(i18n.t("signIn.linkErrorTitle"), i18n.t("signIn.linkError"))
        router.replace("/sign-in")
      })
      .finally(() => setIsHandlingAuth(false))
  }, [linkingURL, refetch])

  useEffect(() => {
    if (!authDestination || isHandlingAuth || isPending || isRefetching) return

    if (session) router.replace(authDestination)
    else router.replace("/sign-in")
    setAuthDestination(undefined)
  }, [authDestination, isHandlingAuth, isPending, isRefetching, session])

  if (isPending || isHandlingAuth || authDestination) {
    return <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }} />
  }

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
