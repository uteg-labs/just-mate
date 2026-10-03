import { Link } from "expo-router"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text } from "react-native"

import { AuthField } from "@/components/AuthField"
import { AuthScreen } from "@/components/AuthScreen"
import { Button } from "@/components/Button"
import { authClient } from "@/lib/auth-client"
import { currentLanguage } from "@/localization/i18n"
import { colors } from "@/theme/colors"
import { type } from "@/theme/type"

export default function SignIn() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    if (!email.trim() || pending) return
    setPending(true)
    setError("")
    const result = await authClient.signIn.magicLink({
      email: email.trim().toLowerCase(),
      callbackURL: "/",
      metadata: { locale: currentLanguage() },
    })
    setPending(false)
    if (result.error) return setError(t("signIn.error"))
    setSent(true)
  }

  return (
    <AuthScreen
      eyebrow={t("signIn.eyebrow")}
      title={sent ? t("signIn.sentTitle") : t("signIn.title")}
      description={sent ? t("signIn.sentDescription", { email }) : t("signIn.description")}
    >
      {!sent && (
        <>
          <AuthField
            label={t("common.email")}
            value={email}
            onChangeText={setEmail}
            placeholder={t("common.emailPlaceholder")}
            email
            autoFocus
            onSubmitEditing={submit}
          />
          {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
          <Button
            title={pending ? t("signIn.sending") : t("signIn.send")}
            onPress={submit}
            disabled={pending}
          />
          <Text style={[type.footnote, styles.footer]}>
            {t("signIn.newHere")}{" "}
            <Link href="/register" style={styles.link}>
              {t("signIn.createAccount")}
            </Link>
          </Text>
        </>
      )}
      {sent && (
        <Button
          title={t("signIn.anotherEmail")}
          variant="tertiary"
          onPress={() => setSent(false)}
        />
      )}
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.fg1 },
  footer: { color: colors.fg2, textAlign: "center" },
  link: { color: colors.link, fontWeight: "600" },
})
