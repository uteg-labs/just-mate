import { DarkTheme, Stack, ThemeProvider } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"

import { colors } from "@/theme/colors"

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, primary: colors.glow },
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen
            name="compass"
            options={{ presentation: "fullScreenModal", gestureEnabled: false }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
