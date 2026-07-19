import type { Coords } from '../types'

const EARTH_RADIUS_MI = 3958.8

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance in miles between two coordinates (haversine). */
export function distanceMiles(a: Coords, b: Coords): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(h))
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return 'here'
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles)} mi`
}
