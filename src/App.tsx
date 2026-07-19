import { useEffect, useMemo, useState } from 'react'
import type { Coords, Facility, Filters, Review, SportId } from './types'
import { FACILITIES } from './data/facilities'
import { DEFAULT_FILTERS, queryFacilities } from './lib/filters'
import { distanceMiles } from './lib/distance'
import { useGeolocation } from './hooks/useGeolocation'
import { useIdList, useLocalStorage } from './hooks/useLocalStorage'
import { SportSelector } from './components/SportSelector'
import { FilterBar } from './components/FilterBar'
import { FacilityCard } from './components/FacilityCard'
import { MapView } from './components/MapView'
import { FacilityDetail } from './components/FacilityDetail'

const FACILITY_BY_ID: Record<string, Facility> = Object.fromEntries(
  FACILITIES.map((f) => [f.id, f]),
)

type ListTab = 'nearby' | 'saved' | 'recent'
type MobileView = 'list' | 'map'
type UserReviews = Record<string, Review[]>

export default function App() {
  const geo = useGeolocation()
  const [sport, setSport] = useState<SportId | null>(null)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyTo, setFlyTo] = useState<Coords | null>(null)
  const [listTab, setListTab] = useState<ListTab>('nearby')
  const [mobileView, setMobileView] = useState<MobileView>('list')

  const favorites = useIdList('pf:favorites')
  const recent = useIdList('pf:recent')
  const [userReviews, setUserReviews] = useLocalStorage<UserReviews>(
    'pf:reviews',
    {},
  )

  // Keep "open now" logic fresh without re-rendering constantly.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const results = useMemo(
    () =>
      queryFacilities(FACILITIES, {
        sport,
        origin: geo.coords,
        filters,
        search,
        now,
      }),
    [sport, geo.coords, filters, search, now],
  )

  const selected = selectedId ? FACILITY_BY_ID[selectedId] : null

  const openFacility = (f: Facility) => {
    setSelectedId(f.id)
    setFlyTo({ lat: f.lat, lng: f.lng })
    recent.pushRecent(f.id)
  }

  const addReview = (facilityId: string, r: Omit<Review, 'id' | 'date'>) => {
    const review: Review = {
      ...r,
      id: `u-${facilityId}-${now.getTime()}`,
      date: now.toISOString().slice(0, 10),
    }
    setUserReviews((prev) => ({
      ...prev,
      [facilityId]: [review, ...(prev[facilityId] ?? [])],
    }))
  }

  // Build the facility list for the active tab.
  const withDistance = (ids: string[]) =>
    ids
      .map((id) => FACILITY_BY_ID[id])
      .filter(Boolean)
      .map((f) => ({
        facility: f,
        distance: distanceMiles(geo.coords, { lat: f.lat, lng: f.lng }),
      }))

  const listItems =
    listTab === 'saved'
      ? withDistance(favorites.ids).sort((a, b) => a.distance - b.distance)
      : listTab === 'recent'
        ? withDistance(recent.ids)
        : results

  // Markers always reflect the current search/filter query.
  const mapResults = results

  const locationLabel = geo.usingFallback
    ? 'Austin, TX'
    : 'Your location'

  return (
    <div className="app">
      <header className="header">
        <div className="header__top">
          <div className="brand">
            <span className="brand__mark">🌱</span>
            PlayFinder
          </div>
          <button className="location-chip" onClick={geo.locate} title="Update location">
            📍 {locationLabel}
            {geo.status === 'locating' ? ' …' : ''}
          </button>
        </div>
        <div className="search">
          <span className="search__icon">🔍</span>
          <input
            type="search"
            placeholder="Search places, cities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search facilities"
          />
        </div>
        <SportSelector selected={sport} onSelect={setSport} />
      </header>

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="body">
        <div className="list-pane" data-hidden={mobileView !== 'list'}>
          <div className="result-head">
            <div style={{ display: 'flex', gap: 6 }}>
              {(['nearby', 'saved', 'recent'] as ListTab[]).map((t) => (
                <button
                  key={t}
                  className={`filter-pill${listTab === t ? ' active' : ''}`}
                  style={{ textTransform: 'capitalize' }}
                  onClick={() => setListTab(t)}
                >
                  {t === 'saved' && `♥ `}
                  {t === 'recent' && `🕘 `}
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="result-head">
            <h2>
              {listTab === 'nearby'
                ? sport
                  ? 'Nearby places'
                  : 'All sports nearby'
                : listTab === 'saved'
                  ? 'Saved places'
                  : 'Recently viewed'}
            </h2>
            <span className="count">{listItems.length} spots</span>
          </div>

          {listItems.length === 0 ? (
            <div className="empty">
              <div className="empty__emoji">
                {listTab === 'saved' ? '💚' : listTab === 'recent' ? '🕘' : '🔎'}
              </div>
              <h3>
                {listTab === 'saved'
                  ? 'No saved places yet'
                  : listTab === 'recent'
                    ? 'Nothing viewed yet'
                    : 'No spots match'}
              </h3>
              <p>
                {listTab === 'saved'
                  ? 'Tap the heart on any place to save it here.'
                  : listTab === 'recent'
                    ? 'Places you open will show up here.'
                    : 'Try widening your filters or picking a different sport.'}
              </p>
            </div>
          ) : (
            listItems.map(({ facility, distance }) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                distance={distance}
                selected={facility.id === selectedId}
                favorite={favorites.has(facility.id)}
                now={now}
                onSelect={() => openFacility(facility)}
                onToggleFav={() => favorites.toggle(facility.id)}
              />
            ))
          )}
        </div>

        <div className="map-pane" data-hidden={mobileView !== 'map'}>
          <MapView
            origin={geo.coords}
            results={mapResults}
            selectedId={selectedId}
            flyTo={flyTo}
            onSelect={openFacility}
          />
          {geo.usingFallback && (
            <div className="fallback-banner">
              📍 Showing Austin, TX
              <button onClick={geo.locate}>Use my location</button>
            </div>
          )}
          <button
            className="map-locate"
            onClick={() => {
              geo.locate()
              setFlyTo({ ...geo.coords })
            }}
            aria-label="Center on my location"
          >
            🎯
          </button>
        </div>
      </div>

      <nav className="tabbar">
        <button
          className={mobileView === 'list' ? 'active' : ''}
          onClick={() => setMobileView('list')}
        >
          <span className="ico">📋</span>
          List
        </button>
        <button
          className={mobileView === 'map' ? 'active' : ''}
          onClick={() => setMobileView('map')}
        >
          <span className="ico">🗺️</span>
          Map
        </button>
      </nav>

      {selected && (
        <FacilityDetail
          facility={selected}
          distance={distanceMiles(geo.coords, {
            lat: selected.lat,
            lng: selected.lng,
          })}
          favorite={favorites.has(selected.id)}
          userReviews={userReviews[selected.id] ?? []}
          now={now}
          onClose={() => setSelectedId(null)}
          onToggleFav={() => favorites.toggle(selected.id)}
          onAddReview={(r) => addReview(selected.id, r)}
        />
      )}
    </div>
  )
}
