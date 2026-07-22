import { useState } from 'react'
import type { SportId } from './types'
import { SPORTS, getSport } from './data/sports'
import { distanceMiles } from './lib/distance'
import { isOpenAt } from './lib/hours'
import { geocodeArea, type Area } from './lib/osm'
import { useGeolocation } from './hooks/useGeolocation'
import { usePlaces } from './hooks/usePlaces'
import { useIdList } from './hooks/useLocalStorage'
import { PlaceCard } from './components/PlaceCard'

type Sort = 'distance' | 'rating' | 'name'

export default function App() {
  const geo = useGeolocation()
  const [pickedArea, setPickedArea] = useState<Area | null>(null)
  const [areaQuery, setAreaQuery] = useState('')
  const [areaBusy, setAreaBusy] = useState(false)
  const [areaError, setAreaError] = useState<string | null>(null)

  const [sport, setSport] = useState<SportId | null>(null)
  const [sort, setSort] = useState<Sort>('distance')
  const [openNow, setOpenNow] = useState(false)
  const [favesOnly, setFavesOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const favorites = useIdList('pf:favorites')

  // Active search area: an explicit city search wins; otherwise the user's
  // location (or the Austin fallback when permission is unavailable).
  const area: Area = pickedArea ?? {
    label: geo.usingFallback ? 'Austin, TX' : 'your location',
    coords: geo.coords,
  }
  const { status, places, retry } = usePlaces(area)

  const now = new Date()

  const searchArea = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = areaQuery.trim()
    if (!q || areaBusy) return
    setAreaBusy(true)
    setAreaError(null)
    try {
      const found = await geocodeArea(q)
      if (!found) {
        setAreaError(`Couldn't find “${q}” — try a city name.`)
      } else {
        setPickedArea(found)
        setExpandedId(null)
      }
    } catch {
      setAreaError('Area search is unreachable right now — try again in a moment.')
    } finally {
      setAreaBusy(false)
    }
  }

  const useMyLocation = () => {
    setPickedArea(null)
    setAreaQuery('')
    setAreaError(null)
    setExpandedId(null)
    geo.locate()
  }

  const list = places
    .filter((f) => (sport ? f.sports.includes(sport) : true))
    .filter((f) => (favesOnly ? favorites.has(f.id) : true))
    .filter((f) => (openNow ? (f.hours ? isOpenAt(f.hours, now) : false) : true))
    .map((f) => ({ f, distance: distanceMiles(area.coords, { lat: f.lat, lng: f.lng }) }))
    .sort((a, b) => {
      if (sort === 'rating') return (b.f.rating ?? -1) - (a.f.rating ?? -1)
      if (sort === 'name') return a.f.name.localeCompare(b.f.name)
      return a.distance - b.distance
    })

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand__mark">🌱</span> PlayFinder
        </div>
        <p className="tagline">Find places to play any sport — anywhere</p>
        <form className="search" onSubmit={searchArea}>
          <span aria-hidden>📍</span>
          <input
            type="search"
            placeholder="Search any city or area…"
            value={areaQuery}
            onChange={(e) => setAreaQuery(e.target.value)}
            aria-label="Search a city or area"
          />
          <button type="submit" className="go" disabled={areaBusy}>
            {areaBusy ? '…' : 'Go'}
          </button>
        </form>
        {areaError && <p className="area-error">{areaError}</p>}
      </header>

      <nav className="sports" aria-label="Filter by sport">
        <button
          className={`chip-sport${sport === null ? ' active' : ''}`}
          onClick={() => setSport(null)}
        >
          🌎 All
        </button>
        {SPORTS.map((s) => (
          <button
            key={s.id}
            className={`chip-sport${sport === s.id ? ' active' : ''}`}
            onClick={() => setSport(s.id)}
          >
            {s.emoji} {s.name.split(' ')[0]}
          </button>
        ))}
      </nav>

      <div className="controls">
        <label className="sortsel">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="distance">Nearest</option>
            <option value="rating">Top rated</option>
            <option value="name">A–Z</option>
          </select>
        </label>
        <button
          className={`toggle${openNow ? ' on' : ''}`}
          onClick={() => setOpenNow((v) => !v)}
          aria-pressed={openNow}
        >
          Open now
        </button>
        <button
          className={`toggle${favesOnly ? ' on' : ''}`}
          onClick={() => setFavesOnly((v) => !v)}
          aria-pressed={favesOnly}
        >
          ♥ Saved
        </button>
        <span className="count">
          {list.length} {list.length === 1 ? 'place' : 'places'}
        </span>
      </div>

      <main className="list">
        {status === 'loading' && (
          <div className="notice">Searching {area.label}…</div>
        )}
        {status === 'error' && (
          <div className="notice error">
            Couldn't reach OpenStreetMap for live results.
            <button onClick={retry}>Retry</button>
          </div>
        )}

        {list.length === 0 && status !== 'loading' ? (
          <div className="empty">
            <div className="empty__emoji">
              {favesOnly ? '💚' : sport ? getSport(sport).emoji : '🔎'}
            </div>
            <h3>No places found</h3>
            <p>
              {favesOnly
                ? 'Tap Save on any place to add it here.'
                : openNow
                  ? 'Nothing verifiably open right now — try turning off "Open now".'
                  : 'Try a different sport or search another area.'}
            </p>
          </div>
        ) : (
          list.map(({ f, distance }) => (
            <PlaceCard
              key={f.id}
              facility={f}
              distance={distance}
              expanded={expandedId === f.id}
              favorite={favorites.has(f.id)}
              now={now}
              onToggleExpand={() =>
                setExpandedId((cur) => (cur === f.id ? null : f.id))
              }
              onToggleFav={() => favorites.toggle(f.id)}
            />
          ))
        )}
      </main>

      <footer className="foot">
        <button onClick={useMyLocation}>
          📍 {pickedArea ? `Showing ${pickedArea.label} · Use my location` : geo.usingFallback ? 'Showing Austin, TX · Use my location' : 'Showing places near you'}
        </button>
        <p className="credit">Live results © OpenStreetMap contributors</p>
      </footer>
    </div>
  )
}
