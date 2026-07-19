import type { Facility } from '../types'
import { getSport } from '../data/sports'
import { gradientFor } from '../lib/gradient'
import { formatDistance } from '../lib/distance'
import { openStatus } from '../lib/hours'
import { StarRating } from './StarRating'

interface Props {
  facility: Facility
  distance: number
  selected: boolean
  favorite: boolean
  now: Date
  onSelect: () => void
  onToggleFav: () => void
}

export function FacilityCard({
  facility,
  distance,
  selected,
  favorite,
  now,
  onSelect,
  onToggleFav,
}: Props) {
  const status = openStatus(facility.hours, now)
  const primarySport = getSport(facility.sports[0])

  return (
    <div
      className={`card${selected ? ' selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <div
        className="card__thumb"
        style={{ background: gradientFor(facility.photoSeeds[0]) }}
        aria-hidden
      >
        {primarySport.emoji}
      </div>
      <div className="card__body">
        <h3 className="card__name">{facility.name}</h3>
        <div className="card__meta">
          <span>{formatDistance(distance)}</span>
          <span>·</span>
          <span className={`pill-mini ${status.open ? 'open' : 'closed'}`}>
            {status.open ? 'Open' : 'Closed'}
          </span>
          <span className={`pill-mini ${facility.cost === 'free' ? 'free' : ''}`}>
            {facility.cost === 'free' ? 'Free' : 'Paid'}
          </span>
          <span className="pill-mini">
            {facility.environment === 'both'
              ? 'In/Outdoor'
              : facility.environment === 'indoor'
                ? 'Indoor'
                : 'Outdoor'}
          </span>
        </div>
        <StarRating value={facility.rating} count={facility.reviewCount} />
        <div className="card__sports">
          {facility.sports.map((s) => (
            <span key={s} title={getSport(s).name}>
              {getSport(s).emoji}
            </span>
          ))}
        </div>
      </div>
      <button
        className={`card__fav${favorite ? ' on' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleFav()
        }}
        aria-label={favorite ? 'Remove favorite' : 'Save favorite'}
        aria-pressed={favorite}
      >
        {favorite ? '♥' : '♡'}
      </button>
    </div>
  )
}
