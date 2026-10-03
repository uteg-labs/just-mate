import type { Profile } from "@justmate/protocol"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { badgeDesign, badgeDesignFromHash } from "@/components/surface/badgeDesign"
import { VibeBadge } from "@/components/surface/VibeBadge"
import { Button, Icon, useScheme } from "@/components/ui"
import type { Match } from "@/lib/store"
import { layout, space } from "@/theme/layout"
import { type } from "@/theme/type"

import type { Pronoun } from "./MatchCard"

export type PostMeetProps = {
  profile: Profile
  match: Match
  pronoun: Pronoun
  onBack: () => void
}

const BADGE_W = 150
const BAND_H = 384
const TILT = 4

export const PostMeet = ({ profile, match, pronoun, onBack }: PostMeetProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const insets = useSafeAreaInsets()
  const { partner, mode } = match

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
          />
        </View>
      </View>

      <View style={styles.copy}>
        <View style={styles.found}>
          <Icon name="circle-check" size={14} strokeWidth={2} color={c.success} />
          <Text style={[type.mono, { color: c.success }]}>{t("postmeet.found")}</Text>
        </View>
        <Text accessibilityRole="header" style={[type.largeTitle, { color: c.fg1 }]}>
          {t("postmeet.title")}
        </Text>
        <Text style={[type.body, { color: c.fg2 }]}>{t("postmeet.sub")}</Text>
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
  found: { flexDirection: "row", alignItems: "center", gap: 6 },
  back: { marginTop: space.xl },
})
