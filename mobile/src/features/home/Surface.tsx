import {
  CloseCode,
  DEFAULT_PROFILE,
  findCategory,
  type Mode,
  type Profile,
  parseSearchOn,
} from "@justmate/protocol"
import * as Linking from "expo-linking"
import { useNetworkState } from "expo-network"
import { StatusBar } from "expo-status-bar"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, View } from "react-native"
import Animated from "react-native-reanimated"

import { Morph, SHAPES, type Shape } from "@/components/surface/Morph"
import { MotionScope } from "@/components/ui"
import { AuthSheet, type AuthTab } from "@/features/auth/AuthSheet"
import type { OnboardingStep } from "@/features/onboarding/flow"
import { Onboarding } from "@/features/onboarding/Onboarding"
import { type Draft, inviteOf, slotTimes } from "@/features/plans/draft"
import { type CreateStep, PlanCreate } from "@/features/plans/PlanCreate"
import { PlanDetail } from "@/features/plans/PlanDetail"
import { PlanOfferCard } from "@/features/plans/PlanOfferCard"
import { isPick } from "@/features/plans/PlanRows"
import { PlansPage } from "@/features/plans/PlansPage"
import { PlanWhereSheet } from "@/features/plans/PlanWhereSheet"
import { Settings } from "@/features/settings/Settings"
import { authClient } from "@/lib/auth-client"
import { lastPosition, useLastPosition, usePositionReports } from "@/lib/location"
import { clearProfile, loadProfile, updateProfile, useProfile } from "@/lib/profile"
import {
  connect,
  disconnect,
  type Live,
  type LivePlan,
  leavePostMeet,
  send,
  useLive,
} from "@/lib/store"
import { useVenues } from "@/lib/venues"
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

type Back = "map" | "plans"

type Place =
  | { at: "map" }
  | { at: "settings" }
  | { at: "edit"; step: OnboardingStep }
  | { at: "setup"; step: OnboardingStep }
  | { at: "plans" }
  | { at: "plan"; id: string }
  | { at: "offer"; id: string; back: Back }
  | { at: "create"; step: CreateStep }
  | { at: "where" }

const MAP: Place = { at: "map" }
const PLANS: Place = { at: "plans" }

const PLACE_SHAPE: Partial<Record<Place["at"], Shape>> = {
  settings: "settings",
  plans: "plans",
  plan: "plan",
  offer: "planoffer",
  create: "plancreate",
  where: "where",
}

const NEW_DRAFT: Omit<Draft, "mode" | "category" | "intents"> = {
  slots: {},
  flex: true,
  until: "day",
  venueId: null,
}
const MS_PER_MIN = 60_000

function resetTokenOf(url: string | null) {
  if (!url?.includes("reset-password")) return
  const token = Linking.parse(url).queryParams?.token
  return typeof token === "string" ? token : undefined
}

// STRUCTURE.md › screen map: a live match outranks where you are; settings outrank the search
function shapeOf(profile: Profile | null | undefined, place: Place, live: Live): Shape | null {
  if (profile === undefined) return null
  if (profile === null || place.at === "edit" || place.at === "setup") return "onboard"
  if (live.session) return "compass"
  if (live.met && live.match) return "postmeet"
  if (live.offer && live.match) return "match"
  const shape = PLACE_SHAPE[place.at]
  if (shape) return shape
  return live.search ? "search" : "select"
}

// the date and mate flows share name, interests, questions and the selfie; only `who` onward differs
function isSetUp(profile: Profile, mode: Mode) {
  return mode === "date" ? !!profile.taste : profile.mate.when.length > 0
}

function planAt(place: Place, plans: LivePlan[]) {
  if (place.at !== "plan" && place.at !== "offer") return
  return plans.find((p) => p.id === place.id)
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
  const [isPlanning, setIsPlanning] = useState(false)
  const [startVenue, setStartVenue] = useState<string | null>(null)
  const [isEditingWhat, setIsEditingWhat] = useState(false)
  const [isProfileFailed, setIsProfileFailed] = useState(false)
  const [planDraft, setPlanDraft] = useState<Draft>({
    ...NEW_DRAFT,
    mode: DEFAULT_PROFILE.mode,
    category: "",
    intents: [],
  })
  const venues = useVenues()
  const here = useLastPosition()
  const isOnline = !!useNetworkState().isConnected

  const userId = auth?.user.id
  const hasProfile = !!profile
  const resetToken = url === handledUrl ? undefined : resetTokenOf(url)
  const signedIn = userId ? shapeOf(profile, place, live) : "auth"
  const shape = resetToken ? "auth" : isPending ? null : signedIn
  const mode = tab ?? profile?.settings.startMode ?? profile?.mode ?? DEFAULT_PROFILE.mode
  const lift = useKeyboardLift(!!shape && SHAPES[shape].kind === "sheet")
  const { config } = live
  const plan = planAt(place, live.plans)
  const isPlanGone = (place.at === "plan" || place.at === "offer") && !plan
  const draftVenues = venues.filter((v) => v.modes.includes(planDraft.mode))
  const draftVenue = venues.find((v) => v.id === planDraft.venueId)
  const hasHere = !!here

  usePositionReports(
    !!live.search || !!live.session || !!live.going,
    live.session || live.going ? config.sessionIntervalMs : config.positionIntervalMs,
  )

  // venues are picked halfway from where you are, so the first fix is worth a fresh ask
  useEffect(() => {
    if (live.link !== "open") return
    const at = hasHere ? lastPosition() : undefined
    send(at ? { t: "plans_get", lat: at.lat, lng: at.lng } : { t: "plans_get" })
  }, [live.link, hasHere])

  useEffect(() => {
    if (isPlanGone) setPlace(MAP)
  }, [isPlanGone])

  useEffect(() => {
    if (!userId || profile !== undefined || isProfileFailed) return
    loadProfile().catch(() => setIsProfileFailed(true))
  }, [userId, profile, isProfileFailed])

  // a failed profile load leaves nothing to draw, so it says so and retries on tap or reconnect
  useEffect(() => {
    if (isOnline) setIsProfileFailed(false)
  }, [isOnline])

  useEffect(() => {
    if (!isProfileFailed) return
    Alert.alert(
      t("home.loadFailed"),
      undefined,
      [{ text: t("home.retry"), onPress: () => setIsProfileFailed(false) }],
      { cancelable: false },
    )
  }, [isProfileFailed, t])

  useEffect(() => {
    if (live.refused) Alert.alert(t("home.refused"))
  }, [live.refused, t])

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
    setIsPlanning(false)
  }

  const switchMode = (next: Mode) => {
    haptic.select()
    if (profile && (next === "mate" || profile.adult) && !isSetUp(profile, next)) {
      setDraft({ ...profile, mode: next })
      return setPlace({ at: "setup", step: "who" })
    }
    setTab(next)
    setCategory(null)
    setPicks([])
  }

  const changeStartMode = (startMode: Mode) => {
    switchMode(startMode)
    if (profile && isSetUp(profile, startMode))
      updateProfile((p) => ({ ...p, settings: { ...p.settings, startMode } }))
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

  const planning = (on: boolean, venueId?: string) => {
    haptic.select()
    setIsPlanning(on)
    setStartVenue(venueId ?? null)
    setIsEditingWhat(false)
    setPlace(MAP)
    if (on) return
    setCategory(null)
    setPicks([])
  }

  const startPlan = () => {
    if (!category) return
    const what = { mode, category, intents: picks }
    const isReady = isEditingWhat && slotTimes(planDraft).length > 0 && !!planDraft.venueId
    setPlanDraft((d) =>
      isEditingWhat ? { ...d, ...what } : { ...NEW_DRAFT, ...what, venueId: startVenue },
    )
    setPlace({ at: "create", step: isReady ? "review" : "when" })
  }

  const editWhat = () => {
    setIsPlanning(true)
    setIsEditingWhat(true)
    setPlace(MAP)
  }

  const sendInvite = () => {
    const msg = inviteOf(planDraft)
    if (!msg) return Alert.alert(t("home.refused"))
    haptic.find()
    send(msg)
    planning(false)
    setPlace(PLANS)
  }

  const openPlan = (p: LivePlan, back: Back) => {
    const isTaker = back === "map" && p.mine && p.state === "taken"
    if (isPick(p) || isTaker) return setPlace({ at: "offer", id: p.id, back })
    setPlace({ at: "plan", id: p.id })
  }

  const leaveOffer = (back: Back) => setPlace(back === "plans" ? PLANS : MAP)

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
        if (place.at === "setup")
          return (
            <Onboarding
              startStep={place.step}
              profile={draft}
              setProfile={setDraft}
              onDone={finishOnboarding}
              onExit={() => setPlace(MAP)}
            />
          )
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
              blockedCount={live.blockedCount}
              setProfile={updateProfile}
              onBack={() => setPlace(MAP)}
              onEdit={edit}
              onStartMode={changeStartMode}
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
            plans={live.plans}
            venues={venues}
            interests={profile?.interests ?? []}
            here={here}
            isPlanning={isPlanning}
            onMode={switchMode}
            onCategory={pickCategory}
            onPicks={changePicks}
            onFind={find}
            onPlanning={planning}
            onPlan={startPlan}
            onOpenPlan={(p) => openPlan(p, "map")}
            onAllPlans={() => setPlace(PLANS)}
          />
        )

      case "plans":
        return (
          <PlansPage
            plans={live.plans}
            venues={venues}
            leadMs={config.planCompassLeadMs}
            onBack={() => setPlace(MAP)}
            onOpen={(p) => openPlan(p, "plans")}
            onNew={() => planning(true)}
          />
        )

      case "plancreate":
        return (
          place.at === "create" && (
            <PlanCreate
              step={place.step}
              draft={planDraft}
              setDraft={setPlanDraft}
              venues={venues}
              onWhere={() => setPlace({ at: "where" })}
              onEditWhat={editWhat}
              onWhen={() => setPlace({ at: "create", step: "when" })}
              onSend={sendInvite}
              onBack={editWhat}
              onExit={() => planning(false)}
            />
          )
        )

      case "where":
        return (
          <PlanWhereSheet
            venues={draftVenues}
            intents={planDraft.intents}
            here={here}
            venueId={planDraft.venueId}
            onPick={(venueId) => setPlanDraft((d) => ({ ...d, venueId }))}
            onBack={() => setPlace({ at: "create", step: "when" })}
            onNext={() => setPlace({ at: "create", step: "review" })}
            onExit={() => planning(false)}
          />
        )

      case "planoffer":
        return (
          place.at === "offer" &&
          plan &&
          profile && (
            <PlanOfferCard
              key={`${plan.id}:${plan.venueId}`}
              plan={plan}
              venues={venues}
              pronoun={pronounOf(profile, plan.mode)}
              onAccept={(venueId) =>
                send(
                  plan.mine
                    ? { t: "plan_confirm", planId: plan.id }
                    : { t: "plan_accept", planId: plan.id, ...(venueId && { venueId }) },
                )
              }
              onPass={() => {
                send({ t: "plan_pass", planId: plan.id })
                leaveOffer(place.back)
              }}
              onLater={() => leaveOffer(place.back)}
              onDone={() => setPlace({ at: "plan", id: plan.id })}
            />
          )
        )

      case "plan":
        return (
          plan && (
            <PlanDetail
              key={plan.id}
              plan={plan}
              venues={venues}
              leadMs={config.planCompassLeadMs}
              isGoing={live.going === plan.id}
              onBack={() => setPlace(PLANS)}
              onCompass={() => send({ t: "plan_go", planId: plan.id })}
              onCancel={() => {
                send({ t: "plan_cancel", planId: plan.id })
                setPlace(PLANS)
              }}
              onSeeTaker={() => setPlace({ at: "offer", id: plan.id, back: "plans" })}
            />
          )
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
          live.session && (
            <CompassView
              session={live.session}
              match={live.match}
              buckets={config.buckets}
              place={venues.find((v) => v.id === sessionPlan?.venueId)?.name}
              onVanish={() => {
                haptic.vanish()
                if (live.session) send({ t: "vanish", sessionId: live.session.id })
              }}
              onReport={() =>
                live.session && send({ t: "report", sessionId: live.session.id, reason: "unsafe" })
              }
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
              partnerName={live.partnerName}
              walkedM={live.walkedM}
              isReported={!!live.metSessionId && live.reportedId === live.metSessionId}
              onReport={() =>
                live.metSessionId &&
                send({ t: "report", sessionId: live.metSessionId, reason: "other" })
              }
              onBack={leavePostMeet}
            />
          )
        )
    }
  }

  const sessionPlan = live.plans.find((p) => p.id === live.planId)
  const tone = shape ? SHAPES[shape].tone : "paper"
  const isDark = tone === "ink" || tone === "night"

  return (
    <MotionScope reduce={profile?.settings.reduceMotion ?? false}>
      <View style={styles.screen}>
        <StatusBar
          style={isDark ? "light" : "dark"}
          hidden={shape === "match" || shape === "planoffer"}
          animated
        />
        <MapChrome
          shape={shape ?? "auth"}
          live={live}
          picks={picksLabel(t, live.search?.intents ?? [])}
          hasActivity={!!category || !!live.search}
          initials={profile?.name.slice(0, 1) ?? ""}
          mode={mode}
          onMode={switchMode}
          onProfile={() => setPlace({ at: "settings" })}
          venues={shape === "where" ? draftVenues : undefined}
          venue={shape === "where" ? draftVenue : undefined}
          onVenue={(venueId) => setPlanDraft((d) => ({ ...d, venueId }))}
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
