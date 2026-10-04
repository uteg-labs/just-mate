import nodemailer from "nodemailer"

import { i18n, type SupportedLanguage } from "../localization/i18n"

const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = process.env.SMTP_SECURE === "true"
const smtpUser = process.env.SMTP_USER
const smtpPassword = process.env.SMTP_PASSWORD
const emailFrom = process.env.AUTH_EMAIL_FROM || "JustMate <auth@example.com>"

if (!smtpHost && process.env.NODE_ENV === "production") throw new Error("SMTP_HOST is required")
if (!Number.isInteger(smtpPort) || smtpPort <= 0) throw new Error("SMTP_PORT must be valid")
if (smtpHost && !(smtpUser && smtpPassword))
  throw new Error("SMTP_USER and SMTP_PASSWORD are required")

const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPassword },
    })
  : undefined

export type AuthEmail = "magicLink" | "passwordReset"

export async function sendAuthEmail(
  kind: AuthEmail,
  email: string,
  url: string,
  language: SupportedLanguage,
) {
  if (!transporter) {
    console.info(`[auth:${language}] ${kind} for ${email}: ${url}`)
    return
  }

  const t = i18n.getFixedT(language, undefined, kind)
  const link = url.replaceAll("&", "&amp;").replaceAll('"', "&quot;")
  const result = await transporter.sendMail({
    from: emailFrom,
    to: email,
    subject: t("subject"),
    text: t("text", { url }),
    html: `<p>${t("intro")}</p><p><a href="${link}">${t("cta")}</a></p><p>${t("expiry")}</p>`,
  })
  console.info(`[auth:${language}] SMTP accepted ${kind} ${result.messageId}`)
}
