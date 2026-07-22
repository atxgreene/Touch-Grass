import { useCallback, useEffect, useState } from 'react'
import type { Facility } from '../types'
import { FACILITIES } from '../data/facilities'
import { distanceMiles } from '../lib/distance'
import { fetchNearbyPlaces, type Area } from '../lib/osm'
import { DEFAULT_LOCATION } from './useGeolocation'

export type PlacesStatus = 'loading' | 'ready' | 'error'

/** Curated seed entries apply when browsing within this range of Austin. */
const SEED_RANGE_MILES = 40

function seedFor(area: Area): Facility[] {
  return distanceMiles(area.coords, DEFAULT_LOCATION) <= SEED_RANGE_MILES
    ? FACILITIES
    : []
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Drop OSM entries that duplicate a curated seed entry (same-ish name, close by). */
function mergeSeedAndOsm(seed: Facility[], osm: Facility[]): Facility[] {
  const deduped = osm.filter(
    (o) =>
      !seed.some(
        (s) =>
          distanceMiles(s, o) < 1 &&
          (normalize(o.name).includes(normalize(s.name)) ||
            normalize(s.name).includes(normalize(o.name))),
      ),
  )
  return [...seed, ...deduped]
}

export function usePlaces(area: Area) {
  const [status, setStatus] = useState<PlacesStatus>('loading')
  const [places, setPlaces] = useState<Facility[]>(() => seedFor(area))
  const [nonce, setNonce] = useState(0)

  const retry = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    const seed = seedFor(area)
    const ctrl = new AbortController()
    let cancelled = false

    setStatus('loading')
    setPlaces(seed)

    fetchNearbyPlaces(area.coords, ctrl.signal)
      .then((osm) => {
        if (cancelled) return
        setPlaces(mergeSeedAndOsm(seed, osm))
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return
        setStatus('error')
      })

    return () => {
      cancelled = true
      ctrl.abort()
    }
    // Refetch when the coordinates actually change (or on explicit retry).
  }, [area.coords.lat, area.coords.lng, nonce]) // eslint-disable-line react-hooks/exhaustive-deps

  return { status, places, retry }
}
