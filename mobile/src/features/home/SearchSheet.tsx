import { findCategory, OTHER_INTENT } from "@justmate/protocol"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import { Button, Chip, clock, Icon, PulseDot, useScheme } from "@/components/ui"
import type { Searching } from "@/lib/store"
import { radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { intentIcon, intentLabel, picksLabel } from "./categories"
import { useNow } from "./useNow"

export type SearchSheetProps = {
  search: Searching
  onPicks: (picks: string[]) => void
  onStop: () => void
}

const PAD = 20
const DOT = 7

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export const SearchSheet = ({ search, onPicks, onStop }: SearchSheetProps) => {
  const { t } = useTranslation()
  const { c, shadow } = useScheme()
  const now = useNow()
  const { mode, category, intents } = search
  const options = findCategory(mode, category)?.intents ?? []
  const elapsed = (now - search.startedAt) / 1000
  const isLast = (intent: string) => intents.length === 1 && intents[0] === intent

  return (
    <View style={styles.sheet}>
      <View style={styles.head}>
        <View style={[styles.circle, { backgroundColor: c.fg1 }]}>
          <Icon
            name={intentIcon(mode, category, intents[0])}
            size={24}
            strokeWidth={1.75}
            color={c.background}
          />
        </View>
        <View style={styles.grow}>
          <View style={styles.status}>
            <PulseDot size={DOT} />
            <Text style={[type.mono, { color: c.fg2 }]}>
              {t("search.status", {
                mode: t(`modes.${mode}`).toLowerCase(),
                category: t(`categories.${category}`).toLowerCase(),
              })}
            </Text>
          </View>
          <Text style={[type.largeTitle, styles.title, { color: c.fg1 }]}>
            {t("search.title", { picks: picksLabel(t, intents) })}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.chips}
      >
        {[...options, OTHER_INTENT].map((intent) => (
          <Chip
            key={intent}
            size="sm"
            label={intentLabel(t, intent)}
            icon={intent === OTHER_INTENT ? "plus" : undefined}
            selected={intents.includes(intent)}
            onPress={isLast(intent) ? undefined : () => onPicks(toggle(intents, intent))}
          />
        ))}
      </ScrollView>

      <View style={[styles.card, { backgroundColor: c.surfaceCard, boxShadow: shadow[2] }]}>
        <View style={styles.grow}>
          <Text style={[type.headline, { color: c.fg1 }]}>{t("search.visible")}</Text>
          <Text style={[type.footnote, styles.sub, { color: c.fg2 }]}>{t("search.mutual")}</Text>
        </View>
        <Text style={[type.mono, styles.clock, { color: c.fg1 }]}>{clock(elapsed)}</Text>
      </View>

      <Button
        title={t("search.stop")}
        variant="secondary"
        leadingIcon="x"
        fullWidth
        onPress={onStop}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { padding: PAD, paddingBottom: 22, gap: space.l },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  circle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  grow: { flex: 1, minWidth: 0 },
  status: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { marginTop: space.xs },
  bleed: { marginHorizontal: -PAD },
  chips: { gap: space.s, paddingHorizontal: PAD },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
    paddingVertical: 14,
    paddingHorizontal: space.l,
    borderRadius: radius.row,
    borderCurve: "continuous",
  },
  sub: { marginTop: 2 },
  clock: { fontSize: 13, fontVariant: ["tabular-nums"] },
})
