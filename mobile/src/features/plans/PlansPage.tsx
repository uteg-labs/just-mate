import type { Venue } from "@justmate/protocol"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button, IconButton, useScheme } from "@/components/ui"
import type { LivePlan } from "@/lib/store"
import { layout, space } from "@/theme/layout"
import { type } from "@/theme/type"
import { isPick, PlanRow, UpcomingCard } from "./PlanRows"
import { Empty, Section } from "./parts"

export type PlansPageProps = {
  plans: LivePlan[]
  venues: Venue[]
  leadMs: number
  onBack: () => void
  onOpen: (plan: LivePlan) => void
  onNew: () => void
}

export function byStart(a: LivePlan, b: LivePlan) {
  return a.startsAtMs - b.startsAtMs
}

export const PlansPage = ({ plans, venues, leadMs, onBack, onOpen, onNew }: PlansPageProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const insets = useSafeAreaInsets()
  const venueOf = (plan: LivePlan) => venues.find((v) => v.id === plan.venueId)

  const picks = plans.filter(isPick)
  const upcoming = plans.filter((p) => p.state === "confirmed").sort(byStart)
  const invites = plans.filter((p) => p.kind === "invite" && !isPick(p) && p.state !== "confirmed")

  return (
    <View style={[styles.page, { paddingTop: insets.top + space.s }]}>
      <View style={styles.head}>
        <IconButton
          icon="arrow-left"
          label={t("plans.page.back")}
          variant="ghost"
          onPress={onBack}
        />
        <Text accessibilityRole="header" style={[type.largeTitle, { color: c.fg1 }]}>
          {t("plans.page.title")}
        </Text>
        <Text style={[type.footnote, { color: c.fg2 }]}>{t("plans.page.sub")}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Section
          label={t("plans.page.proposed", { n: picks.length })}
          right={t("plans.page.byModel")}
        >
          {picks.length ? (
            picks.map((p) => (
              <PlanRow key={p.id} plan={p} venue={venueOf(p)} onPress={() => onOpen(p)} />
            ))
          ) : (
            <Empty text={t("plans.page.noProposals")} />
          )}
        </Section>

        {upcoming.length > 0 && (
          <Section label={t("plans.page.upcoming", { n: upcoming.length })}>
            {upcoming.map((p) => (
              <UpcomingCard
                key={p.id}
                plan={p}
                venue={venueOf(p)}
                leadMs={leadMs}
                onPress={() => onOpen(p)}
              />
            ))}
          </Section>
        )}

        <Section
          label={t("plans.page.invitations", { n: invites.length })}
          right={t("plans.page.youDontPick")}
        >
          {invites.length ? (
            invites.map((p) => (
              <PlanRow key={p.id} plan={p} venue={venueOf(p)} onPress={() => onOpen(p)} />
            ))
          ) : (
            <Empty text={t("plans.page.noInvitations")} />
          )}
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.xxl) }]}>
        <Button title={t("plans.page.new")} leadingIcon="calendar-plus" fullWidth onPress={onNew} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  head: { paddingHorizontal: layout.gutter, paddingBottom: space.s, gap: space.xs },
  scroll: { padding: layout.gutter, paddingBottom: space.xl, gap: 26 },
  footer: { paddingHorizontal: layout.gutter, paddingTop: space.s },
})
