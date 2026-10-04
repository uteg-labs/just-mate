import type { Profile } from "@justmate/protocol"
import * as Linking from "expo-linking"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"

import { LanguagePicker } from "@/components/LanguagePicker"
import { Button, Segmented, TextField, useScheme } from "@/components/ui"
import { authClient } from "@/lib/auth-client"
import { loadProfile } from "@/lib/profile"
import { duration } from "@/theme/motion"
import { type } from "@/theme/type"

export type AuthTab = "login" | "register"

export type AuthSheetProps = {
  onLoggedIn: (profile: Profile | null) => void
  onRegistered: () => void
  initialTab?: AuthTab
}

const EMAIL = /\S+@\S+\.\S+/

const OFFLINE = { error: { code: "" } }

const ERROR_KEY: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "auth.errors.credentials",
  USER_ALREADY_EXISTS: "auth.errors.exists",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "auth.errors.exists",
}

export const AuthSheet = ({ onLoggedIn, onRegistered, initialTab = "login" }: AuthSheetProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const [tab, setTab] = useState<AuthTab>(initialTab)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState("")

  const isLogin = tab === "login"
  const address = email.trim().toLowerCase()
  const isReady = EMAIL.test(address) && password.length >= 6

  const switchTab = (next: AuthTab) => {
    setTab(next)
    setNote("")
  }

  const submit = async () => {
    if (!isReady || busy) return
    setBusy(true)
    setNote("")
    const { error } = await (isLogin
      ? authClient.signIn.email({ email: address, password })
      : authClient.signUp.email({ email: address, password, name: "" })
    ).catch(() => OFFLINE)
    if (error) {
      setBusy(false)
      return setNote(t(ERROR_KEY[error.code ?? ""] ?? "auth.errors.generic"))
    }
    if (!isLogin) return onRegistered()

    const profile = await loadProfile().catch(() => undefined)
    setBusy(false)
    if (profile === undefined) return setNote(t("auth.errors.generic"))
    onLoggedIn(profile)
  }

  const forgot = async () => {
    if (!EMAIL.test(address)) return setNote(t("auth.resetNeedsEmail"))
    setBusy(true)
    const { error } = await authClient
      .requestPasswordReset({ email: address, redirectTo: Linking.createURL("reset-password") })
      .catch(() => OFFLINE)
    setBusy(false)
    setNote(t(error ? "auth.errors.generic" : "auth.resetSent"))
  }

  return (
    <View style={styles.sheet}>
      <Segmented
        items={[
          { value: "login", label: t("auth.login") },
          { value: "register", label: t("auth.register") },
        ]}
        value={tab}
        onChange={switchTab}
      />
      <TextField
        label={t("auth.email")}
        kind="email"
        textContentType="username"
        value={email}
        onChangeText={setEmail}
        placeholder={t("auth.emailPlaceholder")}
        returnKeyType="next"
      />
      <TextField
        label={t("auth.password")}
        kind="password"
        autoComplete={isLogin ? "current-password" : "new-password"}
        value={password}
        onChangeText={setPassword}
        placeholder={t("auth.passwordPlaceholder")}
        onSubmitEditing={submit}
      />
      <Button
        title={isLogin ? t("auth.login") : t("auth.register")}
        trailingIcon={isLogin ? undefined : "arrow-right"}
        fullWidth
        disabled={!isReady}
        loading={busy}
        onPress={submit}
      />
      <Animated.View
        key={tab}
        entering={FadeIn.duration(duration.snappy)}
        style={styles.under}
        accessibilityLiveRegion="polite"
      >
        {!!note && <Text style={[type.footnote, styles.center, { color: c.fg2 }]}>{note}</Text>}
        {isLogin ? (
          <Button title={t("auth.forgot")} variant="ghost" size="sm" onPress={forgot} />
        ) : (
          <Text style={[type.footnote, styles.center, styles.note, { color: c.fg2 }]}>
            {t("auth.registerNote")}
          </Text>
        )}
      </Animated.View>
      <LanguagePicker style={styles.language} />
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { padding: 20, paddingBottom: 22, gap: 16 },
  under: { alignItems: "center", gap: 8 },
  center: { textAlign: "center" },
  note: { paddingHorizontal: 12 },
  language: { alignSelf: "center" },
})
