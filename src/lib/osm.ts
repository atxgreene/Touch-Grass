import type { Coords, Facility, SportId } from '../types'

/**
 * Live worldwide place discovery via OpenStreetMap.
 *
 * - Nominatim geocodes "any city" text into coordinates (free, no key).
 * - Overpass finds sports facilities near those coordinates (free, no key).
 *
 * OSM data is community-maintained: locations are good, but hours, ratings
 * and prices are often missing. We map only what's actually tagged and leave
 * the rest undefined — the UI omits unknown fields rather than faking them.
 */

export interface Area {
  label: string
  coords: Coords
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const OVERPASS = 'https://overpass-api.de/api/interpreter'
/** ~19 miles — a practical "near this city" radius. */
const SEARCH_RADIUS_M = 30000
const MAX_ELEMENTS = 300

interface OsmElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

const SPORT_TAG_MAP: Record<string, SportId> = {
  golf: 'golf',
  basketball: 'basketball',
  pickleball: 'pickleball',
  tennis: 'tennis',
  volleyball: 'volleyball',
  beachvolleyball: 'volleyball',
  soccer: 'soccer',
  disc_golf: 'disc-golf',
  baseball: 'baseball',
  softball: 'baseball',
  hockey: 'hockey',
  ice_hockey: 'hockey',
}

const LEISURE_TAG_MAP: Record<string, SportId> = {
  golf_course: 'golf',
  disc_golf_course: 'disc-golf',
  ice_rink: 'hockey',
}

const DEFAULT_NAMES: Record<SportId, string> = {
  golf: 'Golf course',
  basketball: 'Basketball court',
  pickleball: 'Pickleball court',
  tennis: 'Tennis court',
  volleyball: 'Volleyball court',
  soccer: 'Soccer field',
  'disc-golf': 'Disc golf course',
  baseball: 'Baseball field',
  hockey: 'Ice rink',
}

/** Turn a Nominatim display_name like "Denver, Denver County, Colorado, USA" into "Denver, Colorado". */
function shortLabel(displayName: string): string {
  const parts = displayName.split(',').map((p) => p.trim())
  if (parts.length <= 2) return parts.join(', ')
  return `${parts[0]}, ${parts[parts.length - 2]}`
}

export async function geocodeArea(query: string, signal?: AbortSignal): Promise<Area | null> {
  const url = `${NOMINATIM}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const rows: Array<{ lat: string; lon: string; display_name: string }> = await res.json()
  if (!rows.length) return null
  const r = rows[0]
  return { label: shortLabel(r.display_name), coords: { lat: +r.lat, lng: +r.lon } }
}

function elementSports(tags: Record<string, string>): SportId[] {
  const out = new Set<SportId>()
  for (const raw of (tags.sport ?? '').split(';')) {
    const mapped = SPORT_TAG_MAP[raw.trim()]
    if (mapped) out.add(mapped)
  }
  const leisure = LEISURE_TAG_MAP[tags.leisure ?? '']
  if (leisure) out.add(leisure)
  return [...out]
}

function elementAmenities(tags: Record<string, string>): string[] {
  const out: string[] = []
  if (tags.lit === 'yes') out.push('Lights')
  if (tags.covered === 'yes') out.push('Covered')
  if (tags.drinking_water === 'yes') out.push('Water fountain')
  if (tags.surface) {
    const s = tags.surface.replace(/_/g, ' ')
    out.push(s.charAt(0).toUpperCase() + s.slice(1))
  }
  return out
}

function toFacility(el: OsmElement): Facility | null {
  const tags = el.tags ?? {}
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat == null || lng == null) return null

  const sports = elementSports(tags)
  if (!sports.length) return null

  const addressParts = [
    [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
  ].filter(Boolean)

  const id = `osm-${el.type}-${el.id}`
  return {
    id,
    name: tags.name || DEFAULT_NAMES[sports[0]],
    sports,
    lat,
    lng,
    address: addressParts[0] || undefined,
    city: tags['addr:city'] || undefined,
    state: tags['addr:state'] || undefined,
    zip: tags['addr:postcode'] || undefined,
    access:
      tags.access === 'private' || tags.access === 'no'
        ? 'private'
        : tags.access
          ? 'public'
          : undefined,
    environment: tags.indoor === 'yes' || tags.building ? 'indoor' : 'outdoor',
    cost: tags.fee === 'yes' ? 'paid' : tags.fee === 'no' ? 'free' : undefined,
    phone: tags.phone || tags['contact:phone'] || undefined,
    website: tags.website || tags['contact:website'] || undefined,
    photoSeeds: [id],
    openingHoursRaw: tags.opening_hours || undefined,
    amenities: elementAmenities(tags),
    reviews: [],
    sportDetails: {},
    source: 'osm',
  }
}

/**
 * Collapse clusters of unnamed same-sport elements (e.g. the six individual
 * tennis courts of one park) into a single entry with a count.
 */
function clusterUnnamed(facilities: Facility[]): Facility[] {
  const named = facilities.filter((f) => f.name !== DEFAULT_NAMES[f.sports[0]])
  const unnamed = facilities.filter((f) => f.name === DEFAULT_NAMES[f.sports[0]])

  const groups = new Map<string, { first: Facility; count: number }>()
  for (const f of unnamed) {
    // ~110m grid cells: courts in the same complex share a cell
    const key = `${f.sports.join(',')}|${f.lat.toFixed(3)}|${f.lng.toFixed(3)}`
    const g = groups.get(key)
    if (g) g.count++
    else groups.set(key, { first: f, count: 1 })
  }

  const clustered = [...groups.values()].map(({ first, count }) =>
    count > 1 ? { ...first, name: `${first.name}s (${count})` } : first,
  )
  return [...named, ...clustered]
}

export async function fetchNearbyPlaces(
  coords: Coords,
  signal?: AbortSignal,
): Promise<Facility[]> {
  const sportRe = Object.keys(SPORT_TAG_MAP).join('|')
  const leisureRe = Object.keys(LEISURE_TAG_MAP).join('|')
  const around = `around:${SEARCH_RADIUS_M},${coords.lat},${coords.lng}`
  const query = `
[out:json][timeout:25];
(
  nwr["sport"~"${sportRe}"](${around});
  nwr["leisure"~"^(${leisureRe})$"](${around});
);
out center tags ${MAX_ELEMENTS};
`
  const res = await fetch(OVERPASS, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  })
  if (!res.ok) throw new Error(`Overpass request failed (${res.status})`)
  const data: { elements?: OsmElement[] } = await res.json()

  const facilities = (data.elements ?? [])
    .map(toFacility)
    .filter((f): f is Facility => f !== null)
  return clusterUnnamed(facilities)
}
