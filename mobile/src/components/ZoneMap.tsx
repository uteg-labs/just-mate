import { type ServerMsg, VENUE_KINDS, type Venue, type VenueKind } from "@justmate/protocol"
import { Image, type ImageRef } from "expo-image"
import { AppleMaps, GoogleMaps } from "expo-maps"
// the AppleMaps namespace does not re-export this enum
import { AppleMapsMapStyleEmphasis } from "expo-maps/build/apple/AppleMaps.types"
import ngeohash from "ngeohash"
import { type RefObject, useEffect, useEffectEvent, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { PixelRatio, Platform, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Icon, IconButton, Material, useReduceMotion, useScheme } from "@/components/ui"
import { useLastPosition, useOwnPosition } from "@/lib/location"
import { venueGlyph, venueIcon, venueSymbol } from "@/lib/venues"
import { colors } from "@/theme/colors"
import { layout, radius, space } from "@/theme/layout"
import { duration } from "@/theme/motion"
import { type } from "@/theme/type"

// the only map in the app: swap the map provider here and nowhere else (docs/archive/BUILD-PLAN.md risks)

type Zone = Extract<ServerMsg, { t: "zones" }>["cells"][number]

type Coordinates = { latitude: number; longitude: number }

type Circle = { id: string; center: Coordinates; radius: number; color: string; lineWidth: 0 }

type Inset = { top: number; bottom: number }

type Viewport = Inset & { width: number; height: number }

export type ZoneMapProps = {
  /** watch your position; off, the dot stays at the last fix */
  track: boolean
  zones?: Zone[]
  /** stand-in crowd while `zones` is empty; off until an activity is picked */
  hasDummy?: boolean
  onZone?: (n: number) => void
  /** public venues, the only other points this map ever draws */
  venues?: Venue[]
  selected?: Venue
  onVenue?: (id: string) => void
  /** shows the button that brings the camera back to you */
  canRecenter?: boolean
  /** what the chrome above and the sheet below cover; a picked venue centres between them */
  inset?: Inset
}

const KRAKOW_ARENA = { latitude: 50.0676, longitude: 19.9917 }
const ZOOM = 15
const VENUE_ZOOM = 16
const MIN_ZOOM = 13
const TILE = 256
const M_PER_DEG = 111_320
const TAP_M = 300
const BUTTON_TOP = 54
const MARKER = 32
const GLYPH = 16
const CENTER = { x: 0.5, y: 0.5 }

// DESIGN.md §13.2 — points stretch along the street grid's two directions
const STREETS = [32, -58].map((a) => (a * Math.PI) / 180)
const DENSE = 12

const DUMMY_CELLS = 6
const DUMMY_RADIUS_M = 1100

// greyscale base so the amber heat and the mint dot are the only colour
const GREY = JSON.stringify([
  { stylers: [{ saturation: -100 }, { lightness: 12 }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
])

function withAlpha(hex: string, alpha: number) {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha.toFixed(3)})`
}

function seeded(text: string) {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return () => {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x6d2b79f5) >>> 0
    return h / 4294967296
  }
}

function offset({ latitude, longitude }: Coordinates, east: number, north: number) {
  return {
    latitude: latitude + north / M_PER_DEG,
    longitude: longitude + east / (M_PER_DEG * Math.cos((latitude * Math.PI) / 180)),
  }
}

// stand-in crowd until the server sends real zones; the same spot always draws the same cells
function dummyZones(center: Coordinates): Zone[] {
  const rnd = seeded(ngeohash.encode(center.latitude, center.longitude, 5))
  return Array.from({ length: DUMMY_CELLS }, () => {
    const angle = rnd() * 2 * Math.PI
    const reach = Math.sqrt(rnd()) * DUMMY_RADIUS_M
    const at = offset(center, Math.cos(angle) * reach, Math.sin(angle) * reach)
    return { h: ngeohash.encode(at.latitude, at.longitude, 6), n: 1 + Math.floor(rnd() * 5) }
  })
}

function distanceM(a: Coordinates, b: Coordinates) {
  const north = (a.latitude - b.latitude) * M_PER_DEG
  const east = (a.longitude - b.longitude) * M_PER_DEG * Math.cos((a.latitude * Math.PI) / 180)
  return Math.hypot(north, east)
}

// Heat.jsx on circle overlays: soft blobs per cell whose stacked alphas ramp glow-core → glow → hot
function heat({ h, n }: Zone): Circle[] {
  const center = ngeohash.decode(h)
  const rnd = seeded(h)
  const d = Math.min(n, DENSE)
  const blobs = 2 + Math.ceil(d / 2)

  const halo = {
    id: `${h}~halo`,
    center,
    radius: 260 + 18 * d,
    color: withAlpha(colors.glowCore, 0.1 + 0.012 * d),
    lineWidth: 0,
  } as const

  const field = Array.from({ length: blobs }, (_, k) => {
    const angle = STREETS[(k + (rnd() > 0.7 ? 1 : 0)) % 2] + (rnd() - 0.5) * 0.35
    const along = (rnd() + rnd() + rnd() - 1.5) * (60 + 16 * d)
    const across = (rnd() + rnd() - 1) * (14 + 2.4 * d)
    const at = offset(
      center,
      Math.cos(angle) * along - Math.sin(angle) * across,
      Math.sin(angle) * along + Math.cos(angle) * across,
    )
    const radius = 70 + rnd() * 50 + 6 * d

    return [
      [colors.glowCore, 1, 0.14],
      [colors.glow, 0.62, 0.16 + 0.01 * d],
      [colors.tempHot, 0.3, 0.12 + 0.012 * d],
    ].map(([color, scale, alpha], layer) => ({
      id: `${h}~${k}~${layer}`,
      center: at,
      radius: radius * (scale as number),
      color: withAlpha(color as string, alpha as number),
      lineWidth: 0 as const,
    }))
  })

  return [halo, ...field.flat()]
}

// two circles per cell: the stand-in crowd must stay cheap to draw
function lightHeat({ h, n }: Zone): Circle[] {
  const center = ngeohash.decode(h)
  const d = Math.min(n, DENSE)
  return [
    {
      id: `${h}~halo`,
      center,
      radius: 220 + 18 * d,
      color: withAlpha(colors.glowCore, 0.12 + 0.012 * d),
      lineWidth: 0,
    },
    {
      id: `${h}~core`,
      center,
      radius: 90 + 6 * d,
      color: withAlpha(colors.glow, 0.2 + 0.012 * d),
      lineWidth: 0,
    },
  ]
}

function coordsOf({ lat, lng }: { lat: number; lng: number }): Coordinates {
  return { latitude: lat, longitude: lng }
}

// close enough to read both points, never closer than the street level the heat uses
function zoomFor(meters: number) {
  if (meters < 400) return 16
  if (meters < 900) return ZOOM
  return meters < 2000 ? 14 : 13
}

// `at` in the middle of the map the chrome and the sheet leave open, zoomed out until `also` fits.
// `base` is meters per point at zoom 0: google tiles are 256 pt wide, while expo-maps spans
// 360° / 2^zoom of longitude across the apple map
function cameraOn(at: Coordinates, maxZoom: number, view: Viewport, also = at) {
  const cos = Math.cos((at.latitude * Math.PI) / 180)
  const base = (360 * M_PER_DEG * cos) / (Platform.OS === "ios" ? view.width : TILE)
  const north = Math.abs(also.latitude - at.latitude) * M_PER_DEG
  const east = Math.abs(also.longitude - at.longitude) * M_PER_DEG * cos
  const need = Math.max(
    east / (view.width / 2 - space.xxl),
    north / ((view.height - view.top - view.bottom) / 2 - space.xxl),
  )
  const zoom = Math.min(maxZoom, Math.max(MIN_ZOOM, Math.log2(base / need)))
  const shift = ((view.bottom - view.top) / 2) * (base / 2 ** zoom)
  return { coordinates: offset(at, 0, -shift), zoom }
}

function frame(me: Coordinates | undefined, venue: Coordinates) {
  if (!me) return { coordinates: venue, zoom: 16 }
  const middle = {
    latitude: (me.latitude + venue.latitude) / 2,
    longitude: (me.longitude + venue.longitude) / 2,
  }
  return { coordinates: middle, zoom: zoomFor(distanceM(me, venue)) }
}

type Icons = Partial<Record<string, ImageRef>>

let icons: Promise<Icons> | undefined

function iconKey(kind: VenueKind, isSelected: boolean) {
  return `${kind}~${isSelected}`
}

// the list's IconDisc as an svg: google maps takes no tint, only a drawn image
function markerSvg(kind: VenueKind, isSelected: boolean) {
  const [fill, ink] = isSelected
    ? [colors.fg1, colors.background]
    : [colors.surfaceCard, colors.fg1]
  const shapes = venueGlyph(kind)
    .node.map(([tag, { key, ...attrs }]) => {
      const pairs = Object.entries(attrs).map(
        ([k, v]) => `${k}="${v === "currentColor" ? ink : v}"`,
      )
      return `<${tag} ${pairs.join(" ")}/>`
    })
    .join("")
  const at = (MARKER - GLYPH) / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARKER} ${MARKER}">
<circle cx="${MARKER / 2}" cy="${MARKER / 2}" r="${MARKER / 2 - 0.5}" fill="${fill}" stroke="${colors.border}"/>
<g transform="translate(${at} ${at}) scale(${GLYPH / 24})" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes}</g>
</svg>`
}

// a failed load leaves google's default pins
function loadIcons() {
  const size = Math.round(MARKER * PixelRatio.get())
  const load = async (kind: VenueKind, isSelected: boolean) => {
    const uri = `data:image/svg+xml;base64,${btoa(markerSvg(kind, isSelected))}`
    const ref = await Image.loadAsync({ uri }, { maxWidth: size, maxHeight: size })
    return [iconKey(kind, isSelected), ref] as const
  }
  icons ??= Promise.all(VENUE_KINDS.flatMap((kind) => [load(kind, false), load(kind, true)]))
    .then(Object.fromEntries)
    .catch(() => ({}))
  return icons
}

// apple maps reads the glyph and tint, google maps the drawn icon; its callout gives way to our popover
function markersOf(venues: Venue[], icons: Icons, selected?: Venue) {
  return venues.map((v) => {
    const isSelected = v.id === selected?.id
    const icon = icons[iconKey(v.kind, isSelected)]
    return {
      id: v.id,
      coordinates: coordsOf(v),
      title: v.name,
      systemImage: venueSymbol(v.kind),
      tintColor: isSelected ? colors.fg1 : colors.fg2,
      zIndex: Number(isSelected),
      showCallout: false,
      ...(icon && { icon, anchor: CENTER }),
    }
  })
}

function routeOf(me: Coordinates | undefined, selected?: Venue) {
  if (!me || !selected) return []
  return [{ id: "route", coordinates: [me, coordsOf(selected)], color: colors.fg2, width: 2 }]
}

// DESIGN.md §13.2 — 14 pt mint with a 4 px ring at 22% and a soft glow; ~3 m per pt at zoom 15
function self(at: Coordinates): Circle[] {
  return [
    { id: "self~glow", center: at, radius: 70, color: withAlpha(colors.self, 0.14), lineWidth: 0 },
    { id: "self~ring", center: at, radius: 33, color: withAlpha(colors.self, 0.22), lineWidth: 0 },
    { id: "self~dot", center: at, radius: 21, color: colors.self, lineWidth: 0 },
  ]
}

type Camera = { coordinates: Coordinates; zoom: number }

type MapHandle = { setCameraPosition: (config?: Partial<Camera> & { duration?: number }) => void }

type CanvasProps = {
  camera: Camera
  circles: Circle[]
  venues: Venue[]
  selected?: Venue
  polylines?: ReturnType<typeof routeOf>
  onMap?: (at: Coordinates) => void
  onVenue?: (id: string) => void
  mapRef?: RefObject<MapHandle | null>
}

const Canvas = ({
  camera,
  circles,
  venues,
  selected,
  polylines,
  onMap,
  onVenue,
  mapRef,
}: CanvasProps) => {
  const [icons, setIcons] = useState<Icons>({})
  const markers = markersOf(venues, icons, selected)

  useEffect(() => {
    if (Platform.OS === "android") void loadIcons().then(setIcons)
  }, [])

  const tapCircle = ({ center }: { center: Partial<Coordinates> }) =>
    center.latitude !== undefined &&
    center.longitude !== undefined &&
    onMap?.({ latitude: center.latitude, longitude: center.longitude })
  const tapMap = ({
    coordinates: { latitude, longitude },
  }: {
    coordinates: Partial<Coordinates>
  }) => latitude !== undefined && longitude !== undefined && onMap?.({ latitude, longitude })
  const tapMarker = ({ id }: { id?: string }) => id && onVenue?.(id)

  if (Platform.OS === "ios") {
    return (
      <AppleMaps.View
        ref={(map) => {
          if (mapRef) mapRef.current = map
        }}
        style={StyleSheet.absoluteFill}
        cameraPosition={camera}
        colorScheme={AppleMaps.MapColorScheme.LIGHT}
        circles={circles}
        markers={markers}
        polylines={polylines}
        onMapClick={tapMap}
        onCircleClick={tapCircle}
        onMarkerClick={tapMarker}
        properties={{
          isMyLocationEnabled: false,
          selectionEnabled: false,
          emphasis: AppleMapsMapStyleEmphasis.MUTED,
          pointsOfInterest: { including: [] },
        }}
        uiSettings={{
          compassEnabled: false,
          myLocationButtonEnabled: false,
          scaleBarEnabled: false,
          togglePitchEnabled: false,
        }}
      />
    )
  }

  return (
    <GoogleMaps.View
      ref={(map) => {
        if (mapRef) mapRef.current = map
      }}
      style={StyleSheet.absoluteFill}
      cameraPosition={camera}
      colorScheme={GoogleMaps.MapColorScheme.LIGHT}
      circles={circles}
      markers={markers}
      polylines={polylines}
      onMapClick={tapMap}
      onCircleClick={tapCircle}
      onMarkerClick={tapMarker}
      properties={{
        isMyLocationEnabled: false,
        selectionEnabled: false,
        isBuildingEnabled: false,
        mapStyleOptions: { json: GREY },
      }}
      uiSettings={{
        compassEnabled: false,
        mapToolbarEnabled: false,
        zoomControlsEnabled: false,
        myLocationButtonEnabled: false,
      }}
    />
  )
}

export const ZoneMap = ({
  track,
  zones = [],
  hasDummy = false,
  onZone,
  venues = [],
  selected,
  onVenue,
  canRecenter = false,
  inset,
}: ZoneMapProps) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const reduceMotion = useReduceMotion()
  const position = useOwnPosition(track)
  const mapRef = useRef<MapHandle | null>(null)
  const [camera, setCamera] = useState({ coordinates: KRAKOW_ARENA, zoom: ZOOM })
  const [isCentered, setIsCentered] = useState(false)
  const [tapped, setTapped] = useState<string>()
  const me = position && { latitude: position.lat, longitude: position.lng }
  const top = inset?.top ?? insets.top
  const bottom = inset?.bottom ?? 0
  const marked = onVenue ? selected : venues.find((v) => v.id === tapped)
  const dummy = useMemo(() => dummyZones(camera.coordinates), [camera.coordinates])
  const isDummy = !zones.length && hasDummy
  const shown = isDummy ? dummy : zones
  const lat = me?.latitude
  const lng = me?.longitude
  const circles = useMemo(
    () => [
      ...shown.flatMap(isDummy ? lightHeat : heat),
      ...(lat === undefined || lng === undefined ? [] : self({ latitude: lat, longitude: lng })),
    ],
    [shown, isDummy, lat, lng],
  )

  if (me && !isCentered) {
    setIsCentered(true)
    setCamera({ coordinates: me, zoom: ZOOM })
  }

  // a picked venue, or you once the sheet moves, lands in the open map between chrome and sheet
  const centre = useEffectEvent((venue: Venue | undefined, sheet: number) => {
    const view = { width, height, top, bottom: sheet }
    const next = venue
      ? cameraOn(coordsOf(venue), VENUE_ZOOM, view, me)
      : me && cameraOn(me, ZOOM, view)
    if (!next) return
    if (reduceMotion) return setCamera(next)
    mapRef.current?.setCameraPosition({ ...next, duration: duration.default })
  })

  useEffect(() => centre(selected, bottom), [selected, bottom])

  const tap = (at: Coordinates) => {
    setTapped(undefined)
    if (!onZone) return
    // a stand-in cell is decoration: it never claims people
    const nearest = zones
      .map((z) => ({ n: z.n, d: distanceM(at, ngeohash.decode(z.h)) }))
      .sort((a, b) => a.d - b.d)[0]
    if (nearest && nearest.d < TAP_M) onZone(nearest.n)
  }

  const recenter = () => {
    if (me) mapRef.current?.setCameraPosition({ coordinates: me, zoom: ZOOM })
  }

  return (
    <>
      <Canvas
        camera={camera}
        circles={circles}
        venues={venues}
        selected={marked}
        polylines={routeOf(me, selected)}
        onMap={tap}
        onVenue={onVenue ?? setTapped}
        mapRef={mapRef}
      />
      {Platform.OS === "android" && marked && <Popover venue={marked} top={top} />}
      {canRecenter && me && (
        <View
          pointerEvents="box-none"
          style={[styles.recenter, { top: insets.top + BUTTON_TOP, right: layout.gutter }]}
        >
          <IconButton icon="locate-fixed" label={t("home.recenter")} onPress={recenter} />
        </View>
      )}
    </>
  )
}

type PopoverProps = { venue: Venue; top: number }

// google's info window in our material, docked under the chrome instead of over the pin
const Popover = ({ venue, top }: PopoverProps) => {
  const { t } = useTranslation()
  const { c, shadow } = useScheme()

  return (
    <View pointerEvents="none" style={[styles.popover, { top }]}>
      <View style={[styles.round, { boxShadow: shadow[3] }]}>
        <Material thickness="thin" style={styles.card}>
          <View style={[styles.disc, { backgroundColor: c.fg1 }]}>
            <Icon name={venueIcon(venue.kind)} size={GLYPH} color={c.background} />
          </View>
          <View style={styles.shrink}>
            <Text numberOfLines={1} style={[type.headline, { color: c.fg1 }]}>
              {venue.name}
            </Text>
            <Text numberOfLines={1} style={[type.footnote, { color: c.fg2 }]}>
              {t(`plans.kinds.${venue.kind}`)}
            </Text>
          </View>
        </Material>
      </View>
    </View>
  )
}

export type VenueMapProps = { venue: Venue }

// a still map framing you and one venue: cards and headers, never touchable
export const VenueMap = ({ venue }: VenueMapProps) => {
  const position = useLastPosition()
  const me = position && { latitude: position.lat, longitude: position.lng }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas
        camera={frame(me, coordsOf(venue))}
        circles={me ? self(me) : []}
        venues={[venue]}
        selected={venue}
        polylines={routeOf(me, venue)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  recenter: { position: "absolute" },
  popover: {
    position: "absolute",
    left: layout.gutter + layout.hitMin + space.s,
    right: layout.gutter + layout.hitMin + space.s,
    alignItems: "center",
  },
  round: { maxWidth: "100%", borderRadius: radius.pill },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.s,
    padding: space.xs,
    paddingRight: space.l,
    borderRadius: radius.pill,
  },
  disc: {
    width: MARKER + space.xs,
    height: MARKER + space.xs,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  shrink: { flexShrink: 1 },
})
