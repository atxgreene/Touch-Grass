import type { Coords, Facility, Filters, SportId } from '../types'
import { distanceMiles } from './distance'
import { isOpenAt } from './hours'

export interface RankedFacility {
  facility: Facility
  distance: number
}

export const DEFAULT_FILTERS: Filters = {
  access: 'any',
  environment: 'any',
  cost: 'any',
  maxDistance: null,
  openNow: false,
}

function matchesEnvironment(facility: Facility, want: Filters['environment']): boolean {
  if (want === 'any') return true
  // A "both" facility satisfies either indoor or outdoor filters.
  if (facility.environment === 'both') return true
  return facility.environment === want
}

/**
 * Filter, distance-annotate and sort facilities for the current query.
 */
export function queryFacilities(
  facilities: Facility[],
  {
    sport,
    origin,
    filters,
    search,
    now,
  }: {
    sport: SportId | null
    origin: Coords
    filters: Filters
    search: string
    now: Date
  },
): RankedFacility[] {
  const term = search.trim().toLowerCase()

  return facilities
    .filter((f) => (sport ? f.sports.includes(sport) : true))
    .filter((f) => (filters.access === 'any' ? true : f.access === filters.access))
    .filter((f) => matchesEnvironment(f, filters.environment))
    .filter((f) => (filters.cost === 'any' ? true : f.cost === filters.cost))
    .filter((f) => (filters.openNow ? isOpenAt(f.hours, now) : true))
    .filter((f) => {
      if (!term) return true
      return (
        f.name.toLowerCase().includes(term) ||
        f.city.toLowerCase().includes(term) ||
        f.address.toLowerCase().includes(term)
      )
    })
    .map((facility) => ({
      facility,
      distance: distanceMiles(origin, { lat: facility.lat, lng: facility.lng }),
    }))
    .filter((r) =>
      filters.maxDistance == null ? true : r.distance <= filters.maxDistance,
    )
    .sort((a, b) => a.distance - b.distance)
}
