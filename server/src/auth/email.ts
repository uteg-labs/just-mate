import { Resend } from "resend"

import { i18n, type SupportedLanguage } from "../localization/i18n"

const emailFrom = process.env.AUTH_EMAIL_FROM ?? "JustMate <auth@example.com>"
const resendKey = process.env.RESEND_API_KEY
const resend = resendKey ? new Resend(resendKey) : undefined

export type AuthEmail = "magicLink" | "passwordReset"

export async function sendAuthEmail(
  kind: AuthEmail,
  email: string,
  url: string,
  language: SupportedLanguage,
) {
  if (!resend) {
    console.info(`[auth:${language}] ${kind} for ${email}: ${url}`)
    return
  }

  const t = i18n.getFixedT(language, undefined, kind)
  const { error } = await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: t("subject"),
    text: t("text", { url }),
    html: `<p>${t("intro")}</p><p><a href="${url}">${t("cta")}</a></p><p>${t("expiry")}</p>`,
  })
  if (error) throw new Error(error.message)
}
