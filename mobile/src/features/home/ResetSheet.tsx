import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { Button, TextField, useScheme } from "@/components/ui"
import { authClient } from "@/lib/auth-client"
import { type } from "@/theme/type"

export type ResetSheetProps = { token: string; onDone: () => void }

const MIN_PASSWORD = 6

// where the password-reset email lands: `justmate://reset-password?token=…`
export const ResetSheet = ({ token, onDone }: ResetSheetProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const [password, setPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [note, setNote] = useState("")
  const isReady = password.length >= MIN_PASSWORD

  const save = async () => {
    if (!isReady || busy) return
    setBusy(true)
    const { error } = await authClient
      .resetPassword({ newPassword: password, token })
      .catch(() => ({ error: { status: 0 } }))
    setBusy(false)
    if (!error) return setIsSaved(true)
    setNote(t(error.status === 400 ? "reset.expired" : "auth.errors.generic"))
  }

  if (isSaved)
    return (
      <View style={styles.sheet}>
        <Text style={[type.title, { color: c.fg1 }]}>{t("reset.done")}</Text>
        <Button title={t("auth.login")} fullWidth onPress={onDone} />
      </View>
    )

  return (
    <View style={styles.sheet}>
      <View style={styles.head}>
        <Text style={[type.title, { color: c.fg1 }]}>{t("reset.title")}</Text>
        <Text style={[type.footnote, { color: c.fg2 }]}>{t("reset.sub")}</Text>
      </View>
      <TextField
        label={t("reset.password")}
        kind="password"
        textContentType="newPassword"
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        placeholder={t("auth.passwordPlaceholder")}
        onSubmitEditing={save}
      />
      <Button title={t("reset.save")} fullWidth disabled={!isReady} loading={busy} onPress={save} />
      {!!note && (
        <Text
          accessibilityLiveRegion="polite"
          style={[type.footnote, styles.center, { color: c.fg2 }]}
        >
          {note}
        </Text>
      )}
      <Button title={t("reset.back")} variant="ghost" size="sm" onPress={onDone} />
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { padding: 20, paddingBottom: 22, gap: 16 },
  head: { gap: 6 },
  center: { textAlign: "center" },
})
