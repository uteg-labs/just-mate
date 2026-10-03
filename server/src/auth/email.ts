import nodemailer from "nodemailer"

import { i18n, type SupportedLanguage } from "../localization/i18n"

const smtpHost = process.env.SMTP_HOST
const smtpPort = Number(process.env.SMTP_PORT ?? 587)
const smtpSecure = process.env.SMTP_SECURE === "true"
const smtpUser = process.env.SMTP_USER
const smtpPassword = process.env.SMTP_PASSWORD
const emailFrom = process.env.AUTH_EMAIL_FROM

if (!Number.isInteger(smtpPort) || smtpPort <= 0) throw new Error("SMTP_PORT must be valid")
if (!smtpHost) throw new Error("SMTP_HOST is required")
if (!smtpUser) throw new Error("SMTP_USER is required")
if (!smtpPassword) throw new Error("SMTP_PASSWORD is required")
if (!emailFrom) throw new Error("AUTH_EMAIL_FROM is required")

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: { user: smtpUser, pass: smtpPassword },
})

export async function sendMagicLink(email: string, url: string, language: SupportedLanguage) {
  const t = i18n.getFixedT(language)
  const link = url.replaceAll("&", "&amp;").replaceAll('"', "&quot;")
  const result = await transporter.sendMail({
    from: emailFrom,
    to: email,
    subject: t("magicLink.subject"),
    text: t("magicLink.text", { url }),
    html: `<p>${t("magicLink.intro")}</p><p><a href="${link}">${t("magicLink.cta")}</a></p><p>${t("magicLink.expiry")}</p>`,
  })
  console.info(`[auth:${language}] SMTP accepted email ${result.messageId}`)
}
