import type { ServerMsg, Venue } from "@justmate/protocol"
import { AppleMaps, GoogleMaps } from "expo-maps"
// the AppleMaps namespace does not re-export this enum
import { AppleMapsMapStyleEmphasis } from "expo-maps/build/apple/AppleMaps.types"
import ngeohash from "ngeohash"
import { type RefObject, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, StyleSheet, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { IconButton } from "@/components/ui"
import { useLastPosition, useOwnPosition } from "@/lib/location"
import { colors } from "@/theme/colors"
import { layout } from "@/theme/layout"

// the only map in the app: swap the map provider here and nowhere else (BUILD-PLAN risks)

type Zone = Extract<ServerMsg, { t: "zones" }>["cells"][number]

type Coordinates = { latitude: number; longitude: number }

type Circle = { id: string; center: Coordinates; radius: number; color: string; lineWidth: 0 }

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
}

const KRAKOW_ARENA = { latitude: 50.0676, longitude: 19.9917 }
const ZOOM = 15
const M_PER_DEG = 111_320
const TAP_M = 300
const BUTTON_TOP = 54

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

function frame(me: Coordinates | undefined, venue: Coordinates) {
  if (!me) return { coordinates: venue, zoom: 16 }
  const middle = {
    latitude: (me.latitude + venue.latitude) / 2,
    longitude: (me.longitude + venue.longitude) / 2,
  }
  return { coordinates: middle, zoom: zoomFor(distanceM(me, venue)) }
}

function markersOf(venues: Venue[], selected?: Venue) {
  return venues.map((v) => ({
    id: v.id,
    coordinates: coordsOf(v),
    title: v.name,
    tintColor: v.id === selected?.id ? colors.fg1 : colors.fg2,
  }))
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

type MapHandle = { setCameraPosition: (config?: Partial<Camera>) => void }

type CanvasProps = {
  camera: Camera
  circles: Circle[]
  markers?: ReturnType<typeof markersOf>
  polylines?: ReturnType<typeof routeOf>
  onMap?: (at: Coordinates) => void
  onVenue?: (id: string) => void
  mapRef?: RefObject<MapHandle | null>
}

const Canvas = ({ camera, circles, markers, polylines, onMap, onVenue, mapRef }: CanvasProps) => {
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
}: ZoneMapProps) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const position = useOwnPosition(track)
  const mapRef = useRef<MapHandle | null>(null)
  const [camera, setCamera] = useState({ coordinates: KRAKOW_ARENA, zoom: ZOOM })
  const [isCentered, setIsCentered] = useState(false)
  const me = position && { latitude: position.lat, longitude: position.lng }
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

  const tap = (at: Coordinates) => {
    if (!onZone) return
    const nearest = shown
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
        markers={markersOf(venues, selected)}
        polylines={routeOf(me, selected)}
        onMap={tap}
        onVenue={onVenue}
        mapRef={mapRef}
      />
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
        markers={markersOf([venue], venue)}
        polylines={routeOf(me, venue)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  recenter: { position: "absolute" },
})
