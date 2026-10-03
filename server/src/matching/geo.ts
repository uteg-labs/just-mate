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

export function offset(from: LatLng, bearingDeg: number, meters: number): LatLng {
  const d = meters / EARTH_RADIUS_M
  const b = rad(bearingDeg)
  const lat1 = rad(from.lat)
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b))
  const dLng = Math.atan2(
    Math.sin(b) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
  )
  return { lat: (lat2 * 180) / Math.PI, lng: from.lng + (dLng * 180) / Math.PI }
}

const GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"

export function geohash(p: LatLng, precision: number): string {
  const ranges: Record<keyof LatLng, [number, number]> = { lat: [-90, 90], lng: [-180, 180] }
  let hash = ""
  let index = 0

  for (let bit = 0; hash.length < precision; bit++) {
    const axis = bit % 2 ? "lat" : "lng"
    const range = ranges[axis]
    const mid = (range[0] + range[1]) / 2
    const isUpper = p[axis] >= mid
    range[isUpper ? 0 : 1] = mid
    index = index * 2 + Number(isUpper)

    if (bit % 5 === 4) {
      hash += GEOHASH_BASE32[index]
      index = 0
    }
  }
  return hash
}
