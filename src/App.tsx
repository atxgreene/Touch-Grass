import { useState } from 'react'
import type { SportId } from './types'
import { FACILITIES } from './data/facilities'
import { SPORTS, getSport } from './data/sports'
import { distanceMiles } from './lib/distance'
import { isOpenAt } from './lib/hours'
import { useGeolocation } from './hooks/useGeolocation'
import { useIdList } from './hooks/useLocalStorage'
import { PlaceCard } from './components/PlaceCard'

type Sort = 'distance' | 'rating' | 'name'

export default function App() {
  const geo = useGeolocation()
  const [sport, setSport] = useState<SportId | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<Sort>('distance')
  const [openNow, setOpenNow] = useState(false)
  const [favesOnly, setFavesOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const favorites = useIdList('pf:favorites')

  const now = new Date()
  const term = search.trim().toLowerCase()

  const list = FACILITIES.filter((f) => (sport ? f.sports.includes(sport) : true))
    .filter((f) => (favesOnly ? favorites.has(f.id) : true))
    .filter((f) => (openNow ? isOpenAt(f.hours, now) : true))
    .filter(
      (f) =>
        !term ||
        f.name.toLowerCase().includes(term) ||
        f.city.toLowerCase().includes(term) ||
        f.address.toLowerCase().includes(term),
    )
    .map((f) => ({ f, distance: distanceMiles(geo.coords, { lat: f.lat, lng: f.lng }) }))
    .sort((a, b) => {
      if (sort === 'rating') return b.f.rating - a.f.rating
      if (sort === 'name') return a.f.name.localeCompare(b.f.name)
      return a.distance - b.distance
    })

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand__mark">🌱</span> PlayFinder
        </div>
        <p className="tagline">Find places to play any sport near you</p>
        <div className="search">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            placeholder="Search by name or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search places"
          />
        </div>
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
        {list.length === 0 ? (
          <div className="empty">
            <div className="empty__emoji">
              {favesOnly ? '💚' : sport ? getSport(sport).emoji : '🔎'}
            </div>
            <h3>No places found</h3>
            <p>
              {favesOnly
                ? 'Tap Save on any place to add it here.'
                : 'Try a different sport or clear your filters.'}
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
        {geo.usingFallback ? (
          <button onClick={geo.locate}>📍 Showing Austin, TX · Use my location</button>
        ) : (
          <span>📍 Showing places near you</span>
        )}
      </footer>
    </div>
  )
}
