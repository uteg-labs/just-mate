import type { QuestionReply } from "@justmate/protocol"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"

import { badgeDesign } from "@/components/surface/badgeDesign"
import { VibeBadge } from "@/components/surface/VibeBadge"
import { Button, Chip, Icon, TextField, Thinking, useScheme } from "@/components/ui"
import { api } from "@/lib/api"
import { space } from "@/theme/layout"
import { type } from "@/theme/type"

import type { StepProps } from "./flow"
import { Step } from "./Step"

const TOTAL = 4

export const StepQuestions = ({ profile, set, next, isEditing }: StepProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const [question, setQuestion] = useState<QuestionReply>()
  const [answer, setAnswer] = useState("")
  const [own, setOwn] = useState("")
  const [shown, setShown] = useState<string[]>(profile.vibe ? [profile.vibe] : [])
  const [hasFailed, setHasFailed] = useState(false)
  const { mode, name, interests, qa, vibe, character } = profile
  const isBadge = qa.length >= TOTAL

  // editing restarts the questions; the old answers would only steer the new ones
  useEffect(() => {
    if (isEditing) set({ qa: [], vibe: "", character: "" })
  }, [isEditing, set])

  useEffect(() => {
    if (isBadge || question || hasFailed) return
    let isLive = true
    api
      .question({ mode, name: name.trim(), interests, qa })
      .then((reply) => isLive && setQuestion(reply))
      .catch(() => isLive && setHasFailed(true))
    return () => {
      isLive = false
    }
  }, [isBadge, question, hasFailed, mode, name, interests, qa])

  useEffect(() => {
    if (!isBadge || vibe || hasFailed) return
    let isLive = true
    api
      .vibe({ mode, interests, qa, avoid: shown })
      .then((reply) => {
        if (!isLive) return
        set({ vibe: reply.vibe })
        setShown((s) => [...s, reply.vibe])
      })
      .catch(() => isLive && setHasFailed(true))
    return () => {
      isLive = false
    }
  }, [isBadge, vibe, hasFailed, mode, interests, qa, shown, set])

  // never shown: what matching reads, written once per set of answers
  useEffect(() => {
    if (!isBadge || character) return
    let isLive = true
    api
      .character({ mode, interests, qa })
      .then((reply) => isLive && set({ character: reply.character }))
      .catch(() => isLive && set({ character: qa.map((x) => x.a).join("\n") }))
    return () => {
      isLive = false
    }
  }, [isBadge, character, mode, interests, qa, set])

  const pick = (option: string) => {
    setAnswer(option)
    setOwn("")
  }

  const write = (text: string) => {
    setOwn(text)
    setAnswer(text)
  }

  const commit = () => {
    if (!question) return
    set({ qa: [...qa, { q: question.question, a: answer.trim() }] })
    setQuestion(undefined)
    setAnswer("")
    setOwn("")
  }

  const retryButton = (
    <Button title={t("onboarding.retry")} fullWidth onPress={() => setHasFailed(false)} />
  )
  const offline = hasFailed && (
    <Text style={[type.footnote, { color: c.fg2 }]}>{t("onboarding.offline")}</Text>
  )

  if (isBadge) {
    const design = badgeDesign({ interests, qa, mode })
    return (
      <Step
        eyebrow={t("onboarding.badge.eyebrow")}
        title={t("onboarding.badge.title")}
        sub={t("onboarding.badge.sub")}
        footer={
          <View style={styles.row}>
            <Button
              title={t("onboarding.badge.reroll")}
              variant="tertiary"
              size="md"
              leadingIcon="shuffle"
              disabled={!vibe}
              onPress={() => set({ vibe: "" })}
            />
          </View>
        }
        cta={
          hasFailed ? (
            retryButton
          ) : (
            <Button
              title={t("onboarding.badge.keep")}
              fullWidth
              disabled={!vibe || !character}
              onPress={next}
            />
          )
        }
      >
        <VibeBadge
          design={design}
          eyebrow={t("onboarding.badge.wants", { name: name.trim(), interest: interests[0] })}
          quote={vibe || t("onboarding.badge.writing")}
          tag={mode}
          width={224}
          strap={64}
        />
        <Text style={[type.footnote, styles.center, { color: c.fg2 }]}>
          {t("onboarding.badge.caption", { interests: design.tags.join(", "), count: qa.length })}
        </Text>
        {offline}
      </Step>
    )
  }

  const caption =
    question?.source === "sample"
      ? t("onboarding.questions.sample")
      : qa.length
        ? t("onboarding.questions.fromLast")
        : t("onboarding.questions.fromInterests", { a: interests[0], b: interests[1] })

  return (
    <Step
      eyebrow={t("onboarding.questions.eyebrow", { n: qa.length + 1, m: TOTAL })}
      title={question?.question}
      caption={
        question && (
          <View style={styles.caption}>
            <Icon name="sparkles" size={14} color={c.fg2} />
            <Text style={[type.footnote, { color: c.fg2 }]}>{caption}</Text>
          </View>
        )
      }
      cta={
        hasFailed ? (
          retryButton
        ) : (
          <Button
            title={t(
              qa.length === TOTAL - 1 ? "onboarding.questions.last" : "onboarding.questions.next",
            )}
            fullWidth
            disabled={!question || !answer.trim()}
            onPress={commit}
          />
        )
      }
    >
      {!question && !hasFailed && (
        <Thinking
          label={t(
            qa.length ? "onboarding.questions.thinking" : "onboarding.questions.thinkingFirst",
          )}
        />
      )}
      {offline}
      {question && (
        <>
          <View style={styles.chips}>
            {question.options.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={!own && answer === option}
                onPress={() => pick(option)}
              />
            ))}
          </View>
          <TextField
            label={t("onboarding.questions.own")}
            value={own}
            onChangeText={write}
            maxLength={60}
            placeholder={t("onboarding.questions.ownPlaceholder")}
            onSubmitEditing={() => answer.trim() && commit()}
          />
        </>
      )}
      {qa.length > 0 && (
        <Text style={[type.footnote, { color: c.fg1 }]}>
          <Text style={[type.mono, { color: c.fg3 }]}>{t("onboarding.questions.soFar")} </Text>
          {qa.map((x) => x.a).join(" · ")}
        </Text>
      )}
    </Step>
  )
}

const styles = StyleSheet.create({
  caption: { flexDirection: "row", alignItems: "center", gap: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  center: { textAlign: "center" },
  row: { alignItems: "center" },
})
