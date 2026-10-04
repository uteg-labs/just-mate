import type { Profile } from "@justmate/protocol"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { badgeDesign, badgeDesignFromHash } from "@/components/surface/badgeDesign"
import { VibeBadge } from "@/components/surface/VibeBadge"
import { Button, Icon, Thinking, useScheme } from "@/components/ui"
import { api } from "@/lib/api"
import type { Match } from "@/lib/store"
import { layout, radius, space } from "@/theme/layout"
import { type } from "@/theme/type"

import { type Pronoun, tagOf } from "./MatchCard"

export type PostMeetProps = {
  profile: Profile
  match: Match
  pronoun: Pronoun
  partnerName?: string
  walkedM?: number
  isReported: boolean
  onReport: () => void
  onBack: () => void
}

const BADGE_W = 150
const BAND_H = 384
const TILT = 4

export const PostMeet = ({
  profile,
  match,
  pronoun,
  partnerName,
  walkedM,
  isReported,
  onReport,
  onBack,
}: PostMeetProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const insets = useSafeAreaInsets()
  const [isAgain, setIsAgain] = useState(false)
  const [line, setLine] = useState<string | null>()
  const { partner, mode } = match

  useEffect(() => {
    let isLive = true
    api
      .icebreaker({
        mode,
        interests: profile.interests,
        partnerInterests: partner.interests,
        partnerVibe: partner.vibe,
      })
      .then((reply) => isLive && setLine(reply.line))
      .catch(() => isLive && setLine(null))
    return () => {
      isLive = false
    }
  }, [mode, profile.interests, partner.interests, partner.vibe])

  return (
    <View style={[styles.page, { paddingBottom: Math.max(insets.bottom, 36) }]}>
      <View style={styles.band}>
        <View style={[styles.tilt, { transform: [{ rotate: `${TILT}deg` }] }]}>
          <VibeBadge
            design={badgeDesign(profile)}
            width={BADGE_W}
            strap={74}
            fadeStrap={false}
            eyebrow={t("postmeet.yourVibe")}
            name={profile.name}
          />
        </View>
        <View style={[styles.tilt, { transform: [{ rotate: `${-TILT}deg` }] }]}>
          <VibeBadge
            design={badgeDesignFromHash(partner.badgeSeed, {
              interests: partner.interests,
              hasAnswers: true,
              mode,
            })}
            width={BADGE_W}
            strap={110}
            fadeStrap={false}
            eyebrow={t(`match.vibe.${pronoun}`)}
            quote={partner.vibe}
            tag={tagOf(t, partner, mode)}
          />
        </View>
      </View>

      <View style={styles.copy}>
        <View style={styles.found}>
          <Icon name="circle-check" size={14} strokeWidth={2} color={c.success} />
          <Text style={[type.mono, { color: c.success }]}>{t("postmeet.found")}</Text>
        </View>
        <Text accessibilityRole="header" style={[type.largeTitle, { color: c.fg1 }]}>
          {partnerName ? t("postmeet.sayHi", { name: partnerName }) : t("postmeet.title")}
        </Text>
        <Text style={[type.body, { color: c.fg2 }]}>{t("postmeet.sub")}</Text>
        {line !== null && (
          <View style={[styles.icebreaker, { backgroundColor: c.surfaceCard }]}>
            <Text style={[type.mono, { color: c.fg2 }]}>{t("postmeet.icebreaker")}</Text>
            {line ? (
              <Text style={[type.headline, { color: c.fg1 }]}>{line}</Text>
            ) : (
              <Thinking label={t("postmeet.icebreakerLoading")} lines={1} />
            )}
          </View>
        )}
        {!!walkedM && (
          <View style={styles.found}>
            <Icon name="footprints" size={14} strokeWidth={2} color={c.fg2} />
            <Text style={[type.footnote, { color: c.fg2 }]}>
              {t("postmeet.walked", { m: walkedM })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.extras}>
        {isAgain ? (
          <View style={styles.found}>
            <Icon name="circle-check" size={14} strokeWidth={2} color={c.success} />
            <Text style={[type.footnote, { color: c.fg2 }]}>{t("postmeet.againNoted")}</Text>
          </View>
        ) : (
          <Button
            title={t("postmeet.again")}
            variant="secondary"
            size="sm"
            leadingIcon="calendar-plus"
            onPress={() => setIsAgain(true)}
          />
        )}
        {isReported ? (
          <Text style={[type.footnote, { color: c.fg2 }]}>{t("postmeet.reported")}</Text>
        ) : (
          <Button title={t("postmeet.report")} variant="ghost" size="sm" onPress={onReport} />
        )}
      </View>

      <Button title={t("postmeet.back")} size="lg" fullWidth onPress={onBack} style={styles.back} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: layout.gutter },
  band: { height: BAND_H, flexDirection: "row", justifyContent: "center", gap: 14 },
  tilt: { transformOrigin: "top" },
  copy: { flex: 1, justifyContent: "flex-end", gap: 10 },
  icebreaker: {
    gap: space.s,
    padding: space.l,
    borderRadius: radius.card,
    borderCurve: "continuous",
  },
  found: { flexDirection: "row", alignItems: "center", gap: 6 },
  extras: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.l,
  },
  back: { marginTop: space.l },
})
