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

export default function Register() {
  const { t } = useTranslation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    if (!name.trim() || !email.trim() || pending) return
    setPending(true)
    setError("")
    const result = await authClient.signIn.magicLink({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      callbackURL: "/",
      newUserCallbackURL: "/onboarding",
      metadata: { locale: currentLanguage() },
    })
    setPending(false)
    if (result.error) return setError(t("register.error"))
    setSent(true)
  }

  return (
    <AuthScreen
      eyebrow={t("register.eyebrow")}
      title={sent ? t("register.sentTitle") : t("register.title")}
      description={sent ? t("register.sentDescription", { email }) : t("register.description")}
    >
      {!sent && (
        <>
          <AuthField
            label={t("common.username")}
            value={name}
            onChangeText={setName}
            placeholder={t("register.usernamePlaceholder")}
            autoFocus
          />
          <AuthField
            label={t("common.email")}
            value={email}
            onChangeText={setEmail}
            placeholder={t("common.emailPlaceholder")}
            email
            onSubmitEditing={submit}
          />
          {!!error && <Text style={[type.footnote, styles.error]}>{error}</Text>}
          <Button
            title={pending ? t("register.sending") : t("register.create")}
            onPress={submit}
            disabled={pending}
          />
          <Text style={[type.footnote, styles.footer]}>
            {t("register.alreadyJoined")}{" "}
            <Link href="/sign-in" style={styles.link}>
              {t("register.signIn")}
            </Link>
          </Text>
        </>
      )}
      {sent && (
        <Button
          title={t("register.changeDetails")}
          variant="ghost"
          onPress={() => setSent(false)}
        />
      )}
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  footer: { color: colors.textSecondary, textAlign: "center" },
  link: { color: colors.glow, fontWeight: "600" },
})
