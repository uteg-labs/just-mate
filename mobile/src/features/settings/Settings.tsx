import { MODES, type Mode, type Profile, WALK_MINUTES, type WalkMin } from "@justmate/protocol"
import {
  Children,
  Fragment,
  isValidElement,
  type ReactNode,
  type SetStateAction,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { LanguagePicker } from "@/components/LanguagePicker"
import { badgeDesign } from "@/components/surface/badgeDesign"
import { VibeBadge } from "@/components/surface/VibeBadge"
import {
  AnimatedPressable,
  Button,
  Card,
  Icon,
  type IconName,
  Segmented,
  Switch,
  usePress,
  useScheme,
} from "@/components/ui"
import { wordLabel } from "@/features/home/categories"
import { tagOf } from "@/features/home/MatchCard"
import { ageLabel, type OnboardingStep } from "@/features/onboarding/flow"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import { useBack } from "@/lib/back"
import { clearProfile } from "@/lib/profile"
import { layout, space } from "@/theme/layout"
import { pressScale } from "@/theme/motion"
import { type } from "@/theme/type"

export type SettingsProps = {
  profile: Profile
  blockedCount: number
  setProfile: (next: SetStateAction<Profile>) => void
  onBack: () => void
  onEdit: (step: OnboardingStep) => void
  onStartMode: (mode: Mode) => void
  onLogout: () => void
}

type Feel = "haptics" | "sounds" | "reduceMotion"

const FEEL: { key: Feel; icon: IconName }[] = [
  { key: "haptics", icon: "vibrate" },
  { key: "sounds", icon: "volume-2" },
  { key: "reduceMotion", icon: "accessibility" },
]

const ROW_INSET = space.l + 20 + space.m

function shortList(items: readonly string[]) {
  return items.length <= 2 ? items.join(", ") : `${items[0]}, ${items[1]} +${items.length - 2}`
}

type RowProps = {
  icon: IconName
  label: string
  value?: string
  onPress?: () => void
  children?: ReactNode
}

// DESIGN.md §13.7 — 52 tall, icon, label, value in fg-2, a chevron when it opens something
const Row = ({ icon, label, value, onPress, children }: RowProps) => {
  const { c } = useScheme()
  const { pressed, style: pressStyle, handlers } = usePress(pressScale.row)

  return (
    <AnimatedPressable
      {...handlers}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={[styles.row, pressed && { backgroundColor: c.active }, pressStyle]}
    >
      <Icon name={icon} size={20} strokeWidth={pressed ? 2 : 1.5} />
      <Text style={[styles.label, { color: c.fg1 }]} numberOfLines={1}>
        {label}
      </Text>
      {value !== undefined && (
        <Text style={[styles.value, { color: c.fg2 }]} numberOfLines={1}>
          {value}
        </Text>
      )}
      {children}
      {onPress && <Icon name="chevron-right" size={18} color={c.fg3} />}
    </AnimatedPressable>
  )
}

type ToggleRowProps = { icon: IconName; label: string; checked: boolean; onToggle: () => void }

// the whole row is the switch, so it reads as one control
const ToggleRow = ({ icon, label, checked, onToggle }: ToggleRowProps) => {
  const { c } = useScheme()

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      style={styles.row}
    >
      <Icon name={icon} size={20} />
      <Text style={[styles.label, { color: c.fg1 }]}>{label}</Text>
      <View pointerEvents="none">
        <Switch checked={checked} onToggle={onToggle} />
      </View>
    </Pressable>
  )
}

const Group = ({ label, children }: { label: string; children: ReactNode }) => {
  const { c } = useScheme()

  return (
    <View style={styles.group}>
      <Text style={[type.mono, styles.groupLabel, { color: c.fg2 }]}>{label}</Text>
      <Card level={2} padding={0} style={styles.groupCard}>
        {Children.toArray(children).map(
          (child, i) =>
            isValidElement(child) && (
              <Fragment key={child.key}>
                {i > 0 && <View style={[styles.separator, { backgroundColor: c.separator }]} />}
                {child}
              </Fragment>
            ),
        )}
      </Card>
    </View>
  )
}

export const Settings = ({
  profile,
  blockedCount,
  setProfile,
  onBack,
  onEdit,
  onStartMode,
  onLogout,
}: SettingsProps) => {
  const { t } = useTranslation()
  const { c } = useScheme()
  const insets = useSafeAreaInsets()
  const { data: session } = authClient.useSession()
  const [isBusy, setIsBusy] = useState(false)

  const design = badgeDesign(profile)
  const { settings } = profile
  const isDate = profile.mode === "date"

  useBack(onBack)

  const setSettings = (patch: Partial<Profile["settings"]>) =>
    setProfile((p) => ({ ...p, settings: { ...p.settings, ...patch } }))

  const who = isDate
    ? `${t(`onboarding.who.seeks.${profile.date.seek}`)} · ${ageLabel(profile.date.ageMin, profile.date.ageMax)}`
    : `${t(`onboarding.who.whos.${profile.mate.who}`)} · ${t(`onboarding.who.groups.${profile.mate.group}`)}`

  const download = async () => {
    setIsBusy(true)
    try {
      const data = await api.exportAccount()
      await Share.share({ message: JSON.stringify(data, null, 2) })
    } catch {
      Alert.alert(t("settings.downloadError"))
    }
    setIsBusy(false)
  }

  const logout = async () => {
    await authClient.signOut().catch(() => {})
    clearProfile()
    onLogout()
  }

  const deleteAccount = async () => {
    setIsBusy(true)
    try {
      await api.deleteAccount()
      await logout()
    } catch {
      setIsBusy(false)
      Alert.alert(t("settings.deleteError"))
    }
  }

  const confirmDelete = () =>
    Alert.alert(t("settings.deleteTitle"), t("settings.deleteBody"), [
      { text: t("settings.cancel"), style: "cancel" },
      { text: t("settings.deleteConfirm"), style: "destructive", onPress: deleteAccount },
    ])

  // simulators have no dialer
  const call = (number: string) => Linking.openURL(`tel:${number}`).catch(() => {})

  const showHelp = () =>
    Alert.alert(t("settings.helpTitle"), t("settings.helpBody"), [
      { text: t("settings.helpAdults"), onPress: () => call("116123") },
      { text: t("settings.helpYoung"), onPress: () => call("116111") },
      { text: t("settings.cancel"), style: "cancel" },
    ])

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top, paddingBottom: insets.bottom + space.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Button
        title={t("settings.back")}
        variant="ghost"
        size="sm"
        leadingIcon="arrow-left"
        onPress={onBack}
        style={styles.back}
      />
      <Text accessibilityRole="header" style={[type.largeTitle, { color: c.fg1 }]}>
        {t("settings.title")}
      </Text>

      <View style={styles.profile}>
        <VibeBadge
          design={design}
          eyebrow={t("onboarding.badge.wants", {
            name: profile.name,
            interest: wordLabel(t, profile.interests[0] ?? ""),
          })}
          quote={profile.vibe}
          name={profile.vibe ? undefined : profile.name}
          tag={tagOf(t, { tags: profile }, profile.mode)}
          width={224}
          strap={64}
        />
        <Text style={[type.mono, styles.center, { color: c.fg2 }]}>
          {t("settings.card", {
            mode: t(`modes.${profile.mode}`).toLowerCase(),
            verified: t(profile.verified ? "settings.verified" : "settings.notVerified"),
            serial: design.serial,
          })}
        </Text>
      </View>

      <Group label={t("settings.groups.profile")}>
        <Row
          icon="user"
          label={t("settings.name")}
          value={profile.name}
          onPress={() => onEdit("name")}
        />
        <Row
          icon="sparkle"
          label={t("settings.interests")}
          value={shortList(profile.interests.map((i) => wordLabel(t, i)))}
          onPress={() => onEdit("interests")}
        />
        <Row
          icon="sparkles"
          label={t("settings.questions")}
          value={t("settings.answers", { count: profile.qa.length })}
          onPress={() => onEdit("questions")}
        />
        <Row
          icon={isDate ? "heart" : "users"}
          label={t("settings.who")}
          value={who}
          onPress={() => onEdit("who")}
        />
        {isDate ? (
          <Row
            icon="eye"
            label={t("settings.taste")}
            value={t("settings.neverShown")}
            onPress={() => onEdit("swipe")}
          />
        ) : (
          <Row
            icon="clock"
            label={t("settings.when")}
            value={shortList(profile.mate.when.map((w) => t(`onboarding.schedule.slots.${w}`)))}
            onPress={() => onEdit("schedule")}
          />
        )}
      </Group>

      <Group label={t("settings.groups.map")}>
        {profile.adult && (
          <Row icon="map" label={t("settings.startMode")}>
            <Segmented
              items={MODES.map((m) => ({ value: m, label: t(`modes.${m}`) }))}
              value={settings.startMode ?? profile.mode}
              onChange={onStartMode}
              fullWidth={false}
            />
          </Row>
        )}
        <Row icon="footprints" label={t("settings.walk")}>
          <Segmented
            items={WALK_MINUTES.map((m) => ({
              value: String(m),
              label: t("settings.minutes", { count: m }),
            }))}
            value={String(settings.walkMin)}
            onChange={(v) => setSettings({ walkMin: Number(v) as WalkMin })}
            fullWidth={false}
          />
        </Row>
        <ToggleRow
          icon="timer"
          label={t("settings.autoStop")}
          checked={settings.autoStop}
          onToggle={() => setSettings({ autoStop: !settings.autoStop })}
        />
      </Group>

      <Group label={t("settings.groups.feel")}>
        <Row icon="languages" label={t("settings.language")}>
          <LanguagePicker />
        </Row>
        {FEEL.map(({ key, icon }) => (
          <ToggleRow
            key={key}
            icon={icon}
            label={t(`settings.${key}`)}
            checked={settings[key]}
            onToggle={() => setSettings({ [key]: !settings[key] })}
          />
        ))}
      </Group>

      <Group label={t("settings.groups.privacy")}>
        <Row icon="camera" label={t("settings.photos")} value={t("settings.photosValue")} />
        <Row icon="ban" label={t("settings.blocked")} value={String(blockedCount)} />
        <Row
          icon="download"
          label={t("settings.download")}
          onPress={isBusy ? undefined : download}
        />
      </Group>

      <Group label={t("settings.groups.help")}>
        <Row icon="hand" label={t("settings.help")} onPress={showHelp} />
      </Group>

      <Group label={t("settings.groups.account")}>
        <Row icon="mail" label={t("settings.email")} value={session?.user.email ?? ""} />
        <Row icon="log-out" label={t("settings.logout")} onPress={logout} />
      </Group>

      <View style={styles.footer}>
        <Button
          title={t("settings.delete")}
          variant="ghost"
          size="md"
          disabled={isBusy}
          onPress={confirmDelete}
        />
        <Text style={[type.mono, styles.center, { color: c.fg2 }]}>{t("settings.footer")}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { gap: space.l, paddingHorizontal: layout.gutter },
  back: { alignSelf: "flex-start", marginLeft: -space.s },
  profile: { gap: space.m },
  group: { gap: space.s },
  groupLabel: { paddingHorizontal: space.l },
  groupCard: { overflow: "hidden" },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: space.m,
    paddingHorizontal: space.l,
    paddingVertical: space.s,
  },
  label: { ...type.body, fontSize: 15, lineHeight: 20, flex: 1 },
  value: { ...type.body, fontSize: 15, lineHeight: 20, maxWidth: "55%", textAlign: "right" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: ROW_INSET },
  footer: { alignItems: "center", gap: space.m, paddingTop: space.s },
  center: { textAlign: "center" },
})
