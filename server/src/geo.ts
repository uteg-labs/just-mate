import type { Bucket, Config } from "@justmate/protocol"

export type LatLng = { lat: number; lng: number }

const EARTH_RADIUS_M = 6_371_000

const rad = (deg: number) => (deg * Math.PI) / 180

export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h))
}

export function bearing(from: LatLng, to: LatLng): number {
  const dLng = rad(to.lng - from.lng)
  const y = Math.sin(dLng) * Math.cos(rad(to.lat))
  const x =
    Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) -
    Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export function bucketFor(meters: number, buckets: Config["buckets"]): Bucket {
  if (meters < buckets.burning) return "burning"
  if (meters < buckets.hot) return "hot"
  if (meters < buckets.warm) return "warm"
  return "cold"
}
