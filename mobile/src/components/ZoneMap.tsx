import { AppleMaps, GoogleMaps } from "expo-maps"
// the AppleMaps namespace does not re-export this enum
import { AppleMapsMapStyleEmphasis } from "expo-maps/build/apple/AppleMaps.types"
import ngeohash from "ngeohash"
import { useState } from "react"
import { Platform, StyleSheet } from "react-native"

import { useOwnPosition } from "@/lib/location"
import { colors } from "@/theme/colors"

// the only map in the app: swap the map provider here and nowhere else (BUILD-PLAN risks)

type Zone = { h: string; n: number }

type Coordinates = { latitude: number; longitude: number }

type Circle = { id: string; center: Coordinates; radius: number; color: string; lineWidth: 0 }

export type ZoneMapProps = { zones: Zone[]; onZone?: (n: number) => void }

const KRAKOW_ARENA = { latitude: 50.0676, longitude: 19.9917 }
const ZOOM = 15
const M_PER_DEG = 111_320
const TAP_M = 300

// DESIGN.md §13.2 — points stretch along the street grid's two directions
const STREETS = [32, -58].map((a) => (a * Math.PI) / 180)
const DENSE = 12

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

// DESIGN.md §13.2 — 14 pt mint with a 4 px ring at 22% and a soft glow; ~3 m per pt at zoom 15
function self(at: Coordinates): Circle[] {
  return [
    { id: "self~glow", center: at, radius: 70, color: withAlpha(colors.self, 0.14), lineWidth: 0 },
    { id: "self~ring", center: at, radius: 33, color: withAlpha(colors.self, 0.22), lineWidth: 0 },
    { id: "self~dot", center: at, radius: 21, color: colors.self, lineWidth: 0 },
  ]
}

export const ZoneMap = ({ zones, onZone }: ZoneMapProps) => {
  const position = useOwnPosition()
  const [camera, setCamera] = useState({ coordinates: KRAKOW_ARENA, zoom: ZOOM })
  const [isCentered, setIsCentered] = useState(false)
  const me = position && { latitude: position.lat, longitude: position.lng }

  if (me && !isCentered) {
    setIsCentered(true)
    setCamera({ coordinates: me, zoom: ZOOM })
  }

  const circles = [...zones.flatMap(heat), ...(me ? self(me) : [])]

  const tap = (at: Coordinates) => {
    if (!onZone) return
    const nearest = zones
      .map((z) => ({ n: z.n, d: distanceM(at, ngeohash.decode(z.h)) }))
      .sort((a, b) => a.d - b.d)[0]
    if (nearest && nearest.d < TAP_M) onZone(nearest.n)
  }
  const tapCircle = ({ center }: { center: Partial<Coordinates> }) =>
    center.latitude !== undefined &&
    center.longitude !== undefined &&
    tap({ latitude: center.latitude, longitude: center.longitude })
  const tapMap = ({
    coordinates: { latitude, longitude },
  }: {
    coordinates: Partial<Coordinates>
  }) => latitude !== undefined && longitude !== undefined && tap({ latitude, longitude })

  if (Platform.OS === "ios") {
    return (
      <AppleMaps.View
        style={StyleSheet.absoluteFill}
        cameraPosition={camera}
        colorScheme={AppleMaps.MapColorScheme.LIGHT}
        circles={circles}
        onMapClick={tapMap}
        onCircleClick={tapCircle}
        properties={{
          isMyLocationEnabled: false,
          selectionEnabled: false,
          emphasis: AppleMapsMapStyleEmphasis.MUTED,
          pointsOfInterest: { including: [] },
        }}
        uiSettings={{ compassEnabled: false, scaleBarEnabled: false, togglePitchEnabled: false }}
      />
    )
  }

  return (
    <GoogleMaps.View
      style={StyleSheet.absoluteFill}
      cameraPosition={camera}
      colorScheme={GoogleMaps.MapColorScheme.LIGHT}
      circles={circles}
      onMapClick={tapMap}
      onCircleClick={tapCircle}
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
