import {
  CloseCode,
  DEFAULT_PROFILE,
  findCategory,
  type Mode,
  type Profile,
  parseSearchOn,
} from "@justmate/protocol"
import * as Linking from "expo-linking"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"
import Animated from "react-native-reanimated"

import { Morph, SHAPES, type Shape } from "@/components/surface/Morph"
import { MotionScope } from "@/components/ui"
import { AuthSheet, type AuthTab } from "@/features/auth/AuthSheet"
import type { OnboardingStep } from "@/features/onboarding/flow"
import { Onboarding } from "@/features/onboarding/Onboarding"
import { Settings } from "@/features/settings/Settings"
import { authClient } from "@/lib/auth-client"
import { usePositionReports } from "@/lib/location"
import { clearProfile, loadProfile, updateProfile, useProfile } from "@/lib/profile"
import { connect, disconnect, type Live, leavePostMeet, send, useLive } from "@/lib/store"
import { CompassView } from "./CompassView"
import { picksLabel } from "./categories"
import { haptic, setHaptics } from "./haptics"
import { MapChrome } from "./MapChrome"
import { MatchCard, type Pronoun } from "./MatchCard"
import { PostMeet } from "./PostMeet"
import { ResetSheet } from "./ResetSheet"
import { SearchSheet } from "./SearchSheet"
import { SelectSheet } from "./SelectSheet"
import { useKeyboardLift } from "./useKeyboardLift"

type Place = { at: "map" } | { at: "settings" } | { at: "edit"; step: OnboardingStep }

const MAP: Place = { at: "map" }
const MS_PER_MIN = 60_000

function resetTokenOf(url: string | null) {
  if (!url?.includes("reset-password")) return
  const token = Linking.parse(url).queryParams?.token
  return typeof token === "string" ? token : undefined
}

// STRUCTURE.md › screen map: a live match outranks where you are; settings outrank the search
function shapeOf(profile: Profile | null | undefined, place: Place, live: Live): Shape | null {
  if (profile === undefined) return null
  if (profile === null || place.at === "edit") return "onboard"
  if (live.session) return "compass"
  if (live.met && live.match) return "postmeet"
  if (live.offer && live.match) return "match"
  if (place.at === "settings") return "settings"
  return live.search ? "search" : "select"
}

function pronounOf(profile: Profile, mode: Mode): Pronoun {
  if (mode === "mate") return "their"
  if (profile.date.seek === "women") return "her"
  return profile.date.seek === "men" ? "his" : "their"
}

export const Surface = () => {
  const { t } = useTranslation()
  const { data: auth, isPending } = authClient.useSession()
  const profile = useProfile()
  const live = useLive()
  const url = Linking.useURL()
  const [handledUrl, setHandledUrl] = useState<string | null>(null)
  const [place, setPlace] = useState<Place>(MAP)
  const [authTab, setAuthTab] = useState<AuthTab>("login")
  const [draft, setDraft] = useState<Profile>(DEFAULT_PROFILE)
  const [tab, setTab] = useState<Mode | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [picks, setPicks] = useState<string[]>([])

  const userId = auth?.user.id
  const hasProfile = !!profile
  const resetToken = url === handledUrl ? undefined : resetTokenOf(url)
  const signedIn = userId ? shapeOf(profile, place, live) : "auth"
  const shape = resetToken ? "auth" : isPending ? null : signedIn
  const mode = tab ?? profile?.settings.startMode ?? profile?.mode ?? "date"
  const lift = useKeyboardLift(!!shape && SHAPES[shape].kind === "sheet")
  const { config } = live

  usePositionReports(
    !!live.search || !!live.session,
    live.session ? config.sessionIntervalMs : config.positionIntervalMs,
  )

  useEffect(() => {
    if (userId && profile === undefined) loadProfile().catch(() => {})
  }, [userId, profile])

  useEffect(() => {
    if (!userId || !hasProfile) return
    void connect()
    return disconnect
  }, [userId, hasProfile])

  useEffect(() => {
    if (live.closedWith === CloseCode.NoProfile) loadProfile().catch(() => {})
    if (live.closedWith !== CloseCode.Unauthorized) return
    authClient.signOut().catch(() => {})
    clearProfile()
  }, [live.closedWith])

  useEffect(() => setHaptics(profile?.settings.haptics ?? true), [profile?.settings.haptics])

  const offerId = live.offer?.offerId
  useEffect(() => {
    if (offerId) haptic.match()
  }, [offerId])

  const sessionId = live.session?.id
  useEffect(() => {
    if (sessionId) haptic.unlock()
  }, [sessionId])

  const resetMap = () => {
    setDraft(DEFAULT_PROFILE)
    setPlace(MAP)
    setTab(null)
    setCategory(null)
    setPicks([])
  }

  const switchMode = (next: Mode) => {
    haptic.select()
    setTab(next)
    setCategory(null)
    setPicks([])
  }

  const pickCategory = (id: string | null) => {
    haptic.select()
    const first = id && id !== category ? findCategory(mode, id)?.intents[0] : undefined
    setCategory(first ? id : null)
    setPicks(first ? [first] : [])
  }

  const changePicks = (next: string[]) => {
    haptic.select()
    setPicks(next)
  }

  const search = (searchMode: Mode, searchCategory: string, intents: string[]) => {
    const msg = parseSearchOn({ mode: searchMode, category: searchCategory, intents })
    if (msg.ok) send(msg.value)
  }

  const find = () => {
    if (!category) return
    haptic.find()
    search(mode, category, picks)
  }

  const adjust = (next: string[]) => {
    if (!live.search) return
    changePicks(next)
    search(live.search.mode, live.search.category, next)
  }

  const exitOnboarding = () => {
    authClient.signOut().catch(() => {})
    clearProfile()
    setAuthTab("register")
  }

  const finishOnboarding = (stored: Profile) => {
    resetMap()
    setTab(stored.mode)
  }

  const edit = (step: OnboardingStep) => {
    if (!profile) return
    setDraft(profile)
    setPlace({ at: "edit", step })
  }

  const render = (s: Shape) => {
    switch (s) {
      case "auth":
        return resetToken ? (
          <ResetSheet token={resetToken} onDone={() => setHandledUrl(url)} />
        ) : (
          <AuthSheet
            key={authTab}
            initialTab={authTab}
            onLoggedIn={resetMap}
            onRegistered={resetMap}
          />
        )

      case "onboard":
        return place.at === "edit" ? (
          <Onboarding
            single
            startStep={place.step}
            profile={draft}
            setProfile={setDraft}
            onDone={() => setPlace({ at: "settings" })}
            onExit={() => setPlace({ at: "settings" })}
          />
        ) : (
          <Onboarding
            profile={draft}
            setProfile={setDraft}
            onDone={finishOnboarding}
            onExit={exitOnboarding}
          />
        )

      case "settings":
        return (
          profile && (
            <Settings
              profile={profile}
              setProfile={updateProfile}
              onBack={() => setPlace(MAP)}
              onEdit={edit}
              onLogout={() => {
                resetMap()
                setAuthTab("login")
              }}
            />
          )
        )

      case "select":
        return (
          <SelectSheet
            mode={mode}
            category={category}
            picks={picks}
            note={live.note}
            autoStopMin={Math.round(config.autoStopMs / MS_PER_MIN)}
            onCategory={pickCategory}
            onPicks={changePicks}
            onFind={find}
          />
        )

      case "search":
        return (
          live.search && (
            <SearchSheet
              search={live.search}
              onPicks={adjust}
              onStop={() => send({ t: "search_off" })}
            />
          )
        )

      case "match":
        return (
          live.offer &&
          live.match &&
          profile && (
            <MatchCard
              offer={live.offer}
              match={live.match}
              pronoun={pronounOf(profile, live.match.mode)}
              onAccept={() => live.offer && send({ t: "accept", offerId: live.offer.offerId })}
              onDismiss={() => live.offer && send({ t: "dismiss", offerId: live.offer.offerId })}
            />
          )
        )

      case "compass":
        return (
          live.session &&
          live.match && (
            <CompassView
              session={live.session}
              match={live.match}
              buckets={config.buckets}
              onVanish={() => {
                haptic.vanish()
                if (live.session) send({ t: "vanish", sessionId: live.session.id })
              }}
              onMet={() => live.session && send({ t: "met", sessionId: live.session.id })}
            />
          )
        )

      case "postmeet":
        return (
          live.match &&
          profile && (
            <PostMeet
              profile={profile}
              match={live.match}
              pronoun={pronounOf(profile, live.match.mode)}
              onBack={leavePostMeet}
            />
          )
        )
    }
  }

  const tone = shape ? SHAPES[shape].tone : "paper"
  const isDark = tone === "ink" || tone === "night"

  return (
    <MotionScope reduce={profile?.settings.reduceMotion ?? false}>
      <View style={styles.screen}>
        <StatusBar style={isDark ? "light" : "dark"} hidden={shape === "match"} animated />
        <MapChrome
          shape={shape ?? "auth"}
          live={live}
          picks={picksLabel(t, live.search?.intents ?? [])}
          initials={profile?.name.slice(0, 1) ?? ""}
          mode={mode}
          onMode={switchMode}
          onProfile={() => setPlace({ at: "settings" })}
        />
        {shape && (
          <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, lift]}>
            <Morph shape={shape} render={render} />
          </Animated.View>
        )}
      </View>
    </MotionScope>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
})
