export {}

/*
import { AppleMaps, GoogleMaps } from "expo-maps"
import ngeohash from "ngeohash"
import { Platform, StyleSheet } from "react-native"

import { colors } from "@/theme/colors"

// the only map in the app: swap the map provider here and nowhere else (BUILD-PLAN risks)

type Props = { zones: { h: string; n: number }[] }

const KRAKOW_ARENA = { latitude: 50.0676, longitude: 19.9917 }

const HALO_RADIUS_M = 450
const CORE_RADIUS_M = 180
const DENSE = 6

function glow(zones: Props["zones"]) {
  return zones.flatMap(({ h, n }) => {
    const center = ngeohash.decode(h)
    const alpha = Math.min(1, n / DENSE)
    return [
      {
        id: `${h}-halo`,
        center,
        radius: HALO_RADIUS_M,
        color: withAlpha(colors.glow, 0.08 + 0.14 * alpha),
        lineWidth: 0,
      },
      {
        id: `${h}-core`,
        center,
        radius: CORE_RADIUS_M,
        color: withAlpha(colors.glowCore, 0.1 + 0.3 * alpha),
        lineWidth: 0,
      },
    ]
  })
}

function withAlpha(hex: string, alpha: number) {
  const n = Number.parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha.toFixed(2)})`
}

export const ZoneMap = ({ zones }: Props) => {
  const circles = glow(zones)
  const cameraPosition = { coordinates: KRAKOW_ARENA, zoom: 14 }

  if (Platform.OS === "ios") {
    return (
      <AppleMaps.View
        style={StyleSheet.absoluteFill}
        cameraPosition={cameraPosition}
        colorScheme={AppleMaps.MapColorScheme.DARK}
        circles={circles}
        properties={{ isMyLocationEnabled: true, selectionEnabled: false }}
        uiSettings={{ compassEnabled: false, scaleBarEnabled: false, togglePitchEnabled: false }}
      />
    )
  }

  return (
    <GoogleMaps.View
      style={StyleSheet.absoluteFill}
      cameraPosition={cameraPosition}
      colorScheme={GoogleMaps.MapColorScheme.DARK}
      circles={circles}
      properties={{ isMyLocationEnabled: true, selectionEnabled: false }}
      uiSettings={{ compassEnabled: false, mapToolbarEnabled: false, zoomControlsEnabled: false }}
    />
  )
}
*/
