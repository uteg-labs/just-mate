import { INTERESTS } from "@justmate/protocol"
import { router } from "expo-router"
import { useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import { send } from "@/lib/store"
import { colors } from "@/theme/colors"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

const MIN_INTERESTS = 3

export default function Onboarding() {
  const [interests, setInterests] = useState<string[]>([])
  const [adult, setAdult] = useState(false)

  const toggle = (interest: string) =>
    setInterests((current) =>
      current.includes(interest) ? current.filter((i) => i !== interest) : [...current, interest],
    )

  const enter = () => {
    send({ t: "hello", interests, adult: true })
    router.replace("/home")
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.largeTitle, styles.text]}>What are you into?</Text>
        <Text style={[type.body, styles.muted]}>
          Pick at least {MIN_INTERESTS}. No photos, ever.
        </Text>

        <View style={styles.chips}>
          {INTERESTS.map((interest) => (
            <Chip
              key={interest}
              label={interest}
              selected={interests.includes(interest)}
              onPress={() => toggle(interest)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.check} onPress={() => setAdult(!adult)} hitSlop={10}>
          <View style={[styles.box, adult && styles.boxOn]} />
          <Text style={[type.body, styles.text]}>I'm 18 or older</Text>
        </Pressable>
        <Button
          title="Enter the map"
          disabled={!adult || interests.length < MIN_INTERESTS}
          onPress={enter}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.l, gap: space.l },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s },
  footer: { padding: space.l, gap: space.l },
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
