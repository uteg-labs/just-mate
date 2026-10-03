import { Resend } from "resend"

import { i18n, type SupportedLanguage } from "../localization/i18n"

const emailFrom = process.env.AUTH_EMAIL_FROM ?? "JustMate <auth@example.com>"
const resendKey = process.env.RESEND_API_KEY
const resend = resendKey ? new Resend(resendKey) : undefined

export async function sendMagicLink(email: string, url: string, language: SupportedLanguage) {
  if (!resend) {
    console.info(`[auth:${language}] magic link for ${email}: ${url}`)
    return
  }

  const t = i18n.getFixedT(language)
  const { error } = await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: t("magicLink.subject"),
    text: t("magicLink.text", { url }),
    html: `<p>${t("magicLink.intro")}</p><p><a href="${url}">${t("magicLink.cta")}</a></p><p>${t("magicLink.expiry")}</p>`,
  })
  if (error) throw new Error(error.message)
}
