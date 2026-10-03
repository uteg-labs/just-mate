import { INTENTS, type Intent } from "@justmate/protocol"
import { router } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import { SwipeDeck } from "@/components/SwipeDeck"
import { authClient } from "@/lib/auth-client"
import { interestsFor } from "@/lib/interests"
import { describeTaste, nextQuestion, QUESTIONS, type QA, warmUp, writeVibe } from "@/lib/llm"
import { newProfileId, profileCard, saveProfileCard } from "@/lib/profile"
import { send } from "@/lib/store"
import { type TastePhoto, useTastePhotos } from "@/lib/taste"
import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { fade } from "@/theme/motion"
import { type } from "@/theme/type"

const MIN_INTERESTS = 3
const INTERVIEW = 2
const TASTE = 3
const SLOTS = Array.from({ length: QUESTIONS }, (_, i) => i)

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export default function Onboarding() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [intents, setIntents] = useState<Intent[]>([])
  const [picked, setPicked] = useState<string[]>([])
  const [adult, setAdult] = useState(false)
  const [qa, setQa] = useState<QA[]>([])
  const [question, setQuestion] = useState<string>()
  const [draft, setDraft] = useState("")
  const [liked, setLiked] = useState<string[]>([])
  const [seen, setSeen] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const asked = useRef(0)

  const available = interestsFor(intents)
  const interests = picked.filter((i) => available.some((a) => a === i))
  const interviewing = step === INTERVIEW
  const tasting = step === TASTE
  const { status, photos } = useTastePhotos(tasting)

  const steps = [
    { title: t("onboarding.intentsTitle"), hint: t("onboarding.intentsHint") },
    {
      title: t("onboarding.title"),
      hint: t("onboarding.interestsHint", { count: MIN_INTERESTS }),
    },
    {
      title: t("onboarding.interviewTitle"),
      hint: t("onboarding.interviewHint", { count: QUESTIONS }),
    },
    { title: t("onboarding.tasteTitle"), hint: t("onboarding.tasteHint") },
  ]

  useEffect(() => {
    warmUp()
  }, [])

  const ask = (history: QA[]) => {
    const id = ++asked.current
    setQuestion(undefined)
    nextQuestion(intents, interests, history).then((q) => id === asked.current && setQuestion(q))
  }

  const canNext = [
    intents.length > 0 && adult,
    interests.length >= MIN_INTERESTS,
    !!question && draft.trim() !== "",
    liked.length > 0 && !finishing,
  ][step]

  const back = () => {
    asked.current++
    setQa([])
    setDraft("")
    setStep(step - 1)
  }

  const answer = () => {
    if (!question) return
    const done = [...qa, { question, answer: draft.trim() }]
    setQa(done)
    setDraft("")
    if (done.length < QUESTIONS) return ask(done)
    setStep(TASTE)
  }

  const finish = async (ids: string[]) => {
    setFinishing(true)
    const [vibe, taste] = await Promise.all([
      writeVibe(intents, interests, qa),
      describeTaste(photos.filter((p) => ids.includes(p.id))),
    ])
    const id = newProfileId()
    const card = profileCard(id, intents, interests, vibe, taste)
    console.log(card)
    await saveProfileCard(id, card)
    const sessionCookie = await authClient.getCookie()
    send({ t: "hello", sessionCookie, interests, adult: true })
    router.replace("/home")
  }

  const swipe = (photo: TastePhoto, yes: boolean) => {
    if (finishing) return
    const next = yes ? [...liked, photo.id] : liked
    setLiked(next)
    if (seen + 1 < photos.length) return setSeen(seen + 1)
    setSeen(seen + 1)
    finish(next)
  }

  const onNext = () => {
    if (interviewing) return answer()
    if (tasting) return finish(liked)
    setStep(step + 1)
    if (step + 1 === INTERVIEW) ask([])
  }

  const answerTitle =
    qa.length === QUESTIONS - 1 ? t("onboarding.showPhotos") : t("onboarding.nextQuestion")
  const nextTitle = [
    t("onboarding.pickInterests"),
    t("onboarding.startQuestions"),
    answerTitle,
    finishing ? t("onboarding.writing") : t("onboarding.confirm"),
  ][step]

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={!tasting}
        >
          <Animated.View key={step} entering={FadeIn.duration(fade.duration)} style={styles.step}>
            <Text style={[type.largeTitle, styles.text]}>{steps[step]?.title}</Text>
            <Text style={[type.body, styles.muted]}>{steps[step]?.hint}</Text>

            {step === 0 && (
              <View style={styles.chips}>
                {INTENTS.map((intent) => (
                  <Chip
                    key={intent}
                    label={t(`intents.${intent}`)}
                    selected={intents.includes(intent)}
                    onPress={() => setIntents(toggle(intents, intent))}
                  />
                ))}
              </View>
            )}

            {step === 1 && (
              <View style={styles.chips}>
                {available.map((interest) => (
                  <Chip
                    key={interest}
                    label={t(`interests.${interest}`)}
                    selected={interests.includes(interest)}
                    onPress={() => setPicked(toggle(interests, interest))}
                  />
                ))}
              </View>
            )}

            {interviewing && (
              <>
                <Text style={[type.footnote, styles.muted]}>
                  {t("onboarding.question", {
                    current: Math.min(qa.length + 1, QUESTIONS),
                    total: QUESTIONS,
                  })}
                </Text>
                <View style={styles.dots}>
                  {SLOTS.map((slot) => (
                    <View key={slot} style={[styles.dot, slot <= qa.length && styles.dotOn]} />
                  ))}
                </View>
                <Text style={[type.title, question ? styles.text : styles.muted]}>
                  {question ?? t("onboarding.thinking")}
                </Text>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  editable={!!question}
                  multiline
                  maxLength={280}
                  placeholder={t("onboarding.answerPlaceholder")}
                  placeholderTextColor={colors.textTertiary}
                  style={[type.body, styles.input]}
                />
              </>
            )}

            {tasting && (
              <>
                {status === "loading" && (
                  <Text style={[type.body, styles.muted]}>{t("onboarding.photosLoading")}</Text>
                )}
                {status === "failed" && (
                  <Text style={[type.body, styles.muted]}>{t("onboarding.photosFailed")}</Text>
                )}
                {status === "ready" && photos.length === 0 && (
                  <Text style={[type.body, styles.muted]}>{t("onboarding.photosEmpty")}</Text>
                )}
                {status === "ready" && !finishing && seen < photos.length && (
                  <>
                    <Text style={[type.footnote, styles.muted]}>
                      {t("onboarding.progress", {
                        current: seen + 1,
                        total: photos.length,
                        liked: liked.length,
                      })}
                    </Text>
                    <SwipeDeck photos={photos.slice(seen)} onSwipe={swipe} />
                  </>
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          {step === 0 && (
            <Pressable style={styles.check} onPress={() => setAdult(!adult)} hitSlop={10}>
              <View style={[styles.box, adult && styles.boxOn]} />
              <Text style={[type.body, styles.text]}>{t("onboarding.adult")}</Text>
            </Pressable>
          )}
          <Button title={nextTitle ?? ""} disabled={!canNext} onPress={onNext} />
          {tasting && (
            <Button
              title={t("onboarding.skip")}
              variant="ghost"
              disabled={finishing}
              onPress={() => finish([])}
            />
          )}
          {step > 0 && !tasting && (
            <Button title={t("onboarding.back")} variant="ghost" onPress={back} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.l },
  step: { gap: space.l },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  dots: { flexDirection: "row", gap: space.xs },
  dot: { flex: 1, height: 4, borderRadius: radius.full, backgroundColor: colors.surfaceRaised },
  dotOn: { backgroundColor: colors.glow },
  input: {
    minHeight: 96,
    padding: space.l,
    borderRadius: radius.card,
    borderCurve: "continuous",
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    textAlignVertical: "top",
  },
  footer: { padding: space.l, gap: space.m },
  check: { flexDirection: "row", alignItems: "center", gap: space.m },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.button / 2,
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  boxOn: { backgroundColor: colors.glow, borderColor: colors.glow },
  text: { color: colors.textPrimary },
  muted: { color: colors.textSecondary },
})
