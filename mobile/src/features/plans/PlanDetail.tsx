import type { Venue } from "@justmate/protocol"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Button, Card, Icon, IconButton, useScheme, VibeCard } from "@/components/ui"
import { useNow } from "@/features/home/useNow"
import { useLastPosition } from "@/lib/location"
import type { LivePlan } from "@/lib/store"
import { venueIcon, walkMin } from "@/lib/venues"
import { layout, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { IconDisc, InfoRow, MapFrame, planTitle, VenueLine } from "./parts"
import { capital, dateMono, dayWord, slotGroups, timeOf } from "./time"

export type PlanDetailProps = {
  plan: LivePlan
  venues: Venue[]
  leadMs: number
  isGoing: boolean
  onBack: () => void
  onCompass: () => void
  onCancel: () => void
  onSeeTaker: () => void
}

const MAP_H = 300
const FADE_H = 70

export const PlanDetail = ({
  plan,
  venues,
  leadMs,
  isGoing,
  onBack,
  onCompass,
  onCancel,
  onSeeTaker,
}: PlanDetailProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const insets = useSafeAreaInsets()
  const here = useLastPosition()
  const now = useNow()
  const [isAsking, setIsAsking] = useState(false)

  const venue = venues.find((v) => v.id === plan.venueId)
  const isConfirmed = plan.state === "confirmed"
  const isTaken = plan.state === "taken"
  const ms = Date.parse(plan.startsAt)
  const opensAt = plan.startsAtMs - leadMs
  const isCompassTime = now >= opensAt
  const slots = plan.mine && plan.slots ? plan.slots.map((s) => Date.parse(s)) : [ms]
  const mode = t(`modes.${plan.mode}`).toLowerCase()
  const status = plan.mine ? (isTaken ? "someonesIn" : "open") : "waiting"

  const eyebrow = isConfirmed
    ? t("plans.detail.confirmed", { mode, date: dateMono(ms) })
    : t("plans.detail.invitation", {
        status: t(`plans.status.${status}`),
        when: slots.length > 1 ? t("plans.detail.times", { count: slots.length }) : dateMono(ms),
      })

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        {venue ? (
          <MapFrame venue={venue} height={MAP_H} r={0} />
        ) : (
          <View style={[styles.header, { backgroundColor: c.mapBg }]} />
        )}
        <View
          pointerEvents="none"
          style={[
            styles.fade,
            { experimental_backgroundImage: `linear-gradient(transparent, ${c.background})` },
          ]}
        />
        <IconButton
          icon="arrow-left"
          label={t("plans.detail.back")}
          variant="material"
          onPress={onBack}
          style={[styles.back, { top: insets.top + space.s }]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleBlock}>
          <View style={styles.eyebrow}>
            {isConfirmed && (
              <Icon name="circle-check" size={13} strokeWidth={2} color={c.success} />
            )}
            <Text style={[type.mono, { color: isConfirmed ? c.success : c.fg2 }]}>{eyebrow}</Text>
          </View>
          <Text accessibilityRole="header" style={[type.largeTitle, { color: c.fg1 }]}>
            {planTitle(t, plan)}
          </Text>
        </View>

        <View style={styles.venue}>
          <IconDisc icon={venue ? venueIcon(venue.kind) : "sparkles"} size={44} />
          <View style={styles.grow}>
            <Text style={[type.headline, { color: c.fg1 }]}>{venue?.name}</Text>
            {venue && <VenueLine venue={venue} walk={here && walkMin(here, venue)} />}
          </View>
        </View>

        {isConfirmed && plan.partner ? (
          <VibeCard compact eyebrow={t("plans.detail.meeting")} quote={plan.partner.vibe} />
        ) : (
          <Card level={2} padding={space.l} style={styles.note}>
            <Text style={[type.headline, { color: c.fg1 }]}>{t("plans.youDontPick")}</Text>
            <Text style={[type.footnote, { color: c.fg2 }]}>{t("plans.detail.howOffered")}</Text>
          </Card>
        )}

        {!isConfirmed && slots.length > 1 && (
          <Card level={2} padding={0} style={styles.clip}>
            {slotGroups(slots).map((g, i, all) => (
              <InfoRow
                key={g.day}
                icon="clock"
                label={capital(dayWord(t, g.day))}
                value={g.times.map(timeOf).join(" · ")}
                last={i === all.length - 1}
              />
            ))}
          </Card>
        )}

        <Card level={2} padding={0} style={styles.clip}>
          {isConfirmed ? (
            <>
              <InfoRow
                icon="compass"
                label={t("plans.detail.compassOpens")}
                value={timeOf(ms - leadMs)}
              />
              <InfoRow
                icon="user"
                label={t("plans.detail.namesUnlock")}
                value={t("plans.detail.whenYouMeet")}
                last
              />
            </>
          ) : (
            <>
              <InfoRow
                icon="users"
                label={t("plans.detail.offeredTo")}
                value={t("plans.detail.compatible")}
              />
              {plan.until && (
                <InfoRow
                  icon="timer"
                  label={t("plans.detail.openUntil")}
                  value={t(`plans.until.${plan.until}`)}
                />
              )}
              <InfoRow
                icon="eye-off"
                label={t("plans.detail.theySee")}
                value={t("plans.detail.vibePlaceTime")}
                last
              />
            </>
          )}
        </Card>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.xxl) }]}>
        {isConfirmed && !isAsking && (
          <>
            {isGoing ? (
              <Button title={t("match.waiting")} variant="secondary" fullWidth disabled />
            ) : (
              <Button
                title={
                  isCompassTime
                    ? t("match.openCompass")
                    : t("plans.detail.opensAt", { time: timeOf(ms - leadMs) })
                }
                variant={isCompassTime ? "glow" : "secondary"}
                leadingIcon="compass"
                fullWidth
                disabled={!isCompassTime}
                onPress={onCompass}
              />
            )}
            <Button
              title={t("plans.detail.cantMakeIt")}
              variant="ghost"
              size="md"
              fullWidth
              onPress={() => setIsAsking(true)}
            />
          </>
        )}
        {isConfirmed && isAsking && (
          <>
            <View style={styles.pair}>
              <View style={styles.grow}>
                <Button
                  title={t("plans.detail.keep")}
                  variant="secondary"
                  fullWidth
                  onPress={() => setIsAsking(false)}
                />
              </View>
              <View style={styles.grow}>
                <Button
                  title={t("plans.detail.cancel")}
                  variant="danger"
                  leadingIcon="x"
                  fullWidth
                  onPress={onCancel}
                />
              </View>
            </View>
            <Text style={[type.footnote, styles.center, { color: c.fg2 }]}>
              {t("plans.detail.cancelNote")}
            </Text>
          </>
        )}
        {!isConfirmed && plan.mine && isTaken && (
          <Button
            title={t("plans.detail.seeWho")}
            variant="glow"
            leadingIcon="sparkles"
            fullWidth
            onPress={onSeeTaker}
          />
        )}
        {!isConfirmed && !(plan.mine && isTaken) && (
          <Button
            title={t(plan.mine ? "plans.detail.withdraw" : "plans.detail.takeBack")}
            variant="secondary"
            leadingIcon="x"
            fullWidth
            onPress={onCancel}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { height: MAP_H },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0, height: FADE_H },
  back: { position: "absolute", left: layout.gutter },
  scroll: { paddingHorizontal: layout.gutter, paddingBottom: space.m, gap: space.l },
  titleBlock: { gap: 6 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 6 },
  venue: { flexDirection: "row", alignItems: "center", gap: space.m },
  grow: { flex: 1, minWidth: 0 },
  note: { gap: 6 },
  clip: { overflow: "hidden" },
  footer: { paddingHorizontal: layout.gutter, paddingTop: space.s, gap: space.xs },
  pair: { flexDirection: "row", gap: 10 },
  center: { textAlign: "center", paddingTop: 6 },
})
