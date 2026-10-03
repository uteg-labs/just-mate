import { INTENTS, type Intent } from "@justmate/protocol"
import { router } from "expo-router"
import { useEffect, useRef, useState } from "react"
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

const STEPS = [
  { title: "What are you up for?", hint: "Pick everything that fits." },
  { title: "What are you into?", hint: `Tailored to your picks. At least ${MIN_INTERESTS}.` },
  { title: "Let's get to know you", hint: `${QUESTIONS} quick questions, one at a time.` },
  {
    title: "What catches your eye?",
    hint: "Swipe left for yes, right for no. Confirm keeps your picks, Skip drops them all.",
  },
]

const label = (intent: string) => intent.replace("_", " ")

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export default function Onboarding() {
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
    send({ t: "hello", interests, adult: true })
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

  const answerTitle = qa.length === QUESTIONS - 1 ? "Show photos" : "Next question"
  const nextTitle = [
    "Pick interests",
    "Start questions",
    answerTitle,
    finishing ? "Writing your profile…" : "Confirm",
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
            <Text style={[type.largeTitle, styles.text]}>{STEPS[step]?.title}</Text>
            <Text style={[type.body, styles.muted]}>{STEPS[step]?.hint}</Text>

            {step === 0 && (
              <View style={styles.chips}>
                {INTENTS.map((intent) => (
                  <Chip
                    key={intent}
                    label={label(intent)}
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
                    label={interest}
                    selected={interests.includes(interest)}
                    onPress={() => setPicked(toggle(interests, interest))}
                  />
                ))}
              </View>
            )}

            {interviewing && (
              <>
                <Text style={[type.footnote, styles.muted]}>
                  Question {Math.min(qa.length + 1, QUESTIONS)} of {QUESTIONS}
                </Text>
                <View style={styles.dots}>
                  {Array.from({ length: QUESTIONS }, (_, i) => (
                    <View key={i} style={[styles.dot, i <= qa.length && styles.dotOn]} />
                  ))}
                </View>
                <Text style={[type.title, question ? styles.text : styles.muted]}>
                  {question ?? "Thinking of a question…"}
                </Text>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  editable={!!question}
                  multiline
                  maxLength={280}
                  placeholder="Your answer"
                  placeholderTextColor={colors.textTertiary}
                  style={[type.body, styles.input]}
                />
              </>
            )}

            {tasting && (
              <>
                {status === "loading" && (
                  <Text style={[type.body, styles.muted]}>Loading photos…</Text>
                )}
                {status === "failed" && (
                  <Text style={[type.body, styles.muted]}>
                    Photos are not available right now. You can skip this step.
                  </Text>
                )}
                {status === "ready" && photos.length === 0 && (
                  <Text style={[type.body, styles.muted]}>No photos to show right now.</Text>
                )}
                {status === "ready" && !finishing && seen < photos.length && (
                  <>
                    <Text style={[type.footnote, styles.muted]}>
                      {seen + 1} of {photos.length} · {liked.length} picked
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
              <Text style={[type.body, styles.text]}>I'm 18 or older</Text>
            </Pressable>
          )}
          <Button title={nextTitle ?? ""} disabled={!canNext} onPress={onNext} />
          {tasting && (
            <Button title="Skip" variant="ghost" disabled={finishing} onPress={() => finish([])} />
          )}
          {step > 0 && !tasting && <Button title="Back" variant="ghost" onPress={back} />}
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
