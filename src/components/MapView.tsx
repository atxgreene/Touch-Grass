import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Coords, Facility } from '../types'
import { getSport } from '../data/sports'
import type { RankedFacility } from '../lib/filters'

function pinIcon(emoji: string, selected: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="pin${selected ? ' selected' : ''}"><span>${emoji}</span></div>`,
    iconSize: selected ? [38, 38] : [30, 30],
    iconAnchor: selected ? [19, 38] : [15, 30],
  })
}

const meIcon = L.divIcon({
  className: '',
  html: '<div class="pin me"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

/** Keeps the map centered on the active target without fighting user panning. */
function Recenter({ target }: { target: Coords | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), {
        duration: 0.6,
      })
    }
  }, [target, map])
  return null
}

interface Props {
  origin: Coords
  results: RankedFacility[]
  selectedId: string | null
  flyTo: Coords | null
  onSelect: (facility: Facility) => void
}

export function MapView({ origin, results, selectedId, flyTo, onSelect }: Props) {
  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={12}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[origin.lat, origin.lng]} icon={meIcon} />
      {results.map(({ facility }) => (
        <Marker
          key={facility.id}
          position={[facility.lat, facility.lng]}
          icon={pinIcon(
            getSport(facility.sports[0]).emoji,
            facility.id === selectedId,
          )}
          eventHandlers={{ click: () => onSelect(facility) }}
        />
      ))}
      <Recenter target={flyTo} />
    </MapContainer>
  )
}
