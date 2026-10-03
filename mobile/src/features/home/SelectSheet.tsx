import type { Mode } from "@justmate/protocol"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"

import { CategoryBento } from "@/components/surface/CategoryBento"
import { MorphHeadline } from "@/components/surface/MorphHeadline"
import { Button, useScheme } from "@/components/ui"
import type { Note } from "@/lib/store"
import { duration } from "@/theme/motion"
import { type } from "@/theme/type"

import { bentoCategories, picksLabel } from "./categories"

export type SelectSheetProps = {
  mode: Mode
  category: string | null
  picks: string[]
  note?: Note
  autoStopMin: number
  onCategory: (id: string | null) => void
  onPicks: (picks: string[]) => void
  onFind: () => void
}

export const SelectSheet = ({
  mode,
  category,
  picks,
  note,
  autoStopMin,
  onCategory,
  onPicks,
  onFind,
}: SelectSheetProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const lines = t(`home.headlines.${mode}`, { returnObjects: true }) as string[]
  const footer = note ? t(`home.ended.${note}`, { min: autoStopMin }) : t("home.invisibleNote")

  return (
    <View style={styles.sheet}>
      <Animated.View
        key={`head-${mode}`}
        entering={FadeIn.duration(duration.snappy)}
        style={styles.head}
      >
        <MorphHeadline lines={lines} paused={!!category} />
        <Text style={[type.footnote, { color: c.fg2 }]}>{t(`home.footnote.${mode}`)}</Text>
      </Animated.View>

      <CategoryBento
        key={`bento-${mode}`}
        categories={bentoCategories(t, mode)}
        selected={category}
        onPick={onCategory}
        picks={picks}
        onPicks={onPicks}
      />

      {category ? (
        <Animated.View entering={FadeIn.duration(duration.default)}>
          <Button
            title={
              picks.length ? t("home.find", { picks: picksLabel(t, picks) }) : t("home.pickOne")
            }
            leadingIcon="search"
            fullWidth
            disabled={!picks.length}
            onPress={onFind}
          />
        </Animated.View>
      ) : (
        <Text
          accessibilityLiveRegion="polite"
          style={[type.footnote, styles.center, { color: c.fg2 }]}
        >
          {footer}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { padding: 20, paddingBottom: 22, gap: 20 },
  head: { gap: 6 },
  center: { textAlign: "center" },
})
