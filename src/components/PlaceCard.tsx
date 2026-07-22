import type { Facility } from '../types'
import { getSport } from '../data/sports'
import { gradientFor } from '../lib/gradient'
import { formatDistance } from '../lib/distance'
import { DAY_NAMES, formatTime, openStatus } from '../lib/hours'
import { StarRating } from './StarRating'

interface Props {
  facility: Facility
  distance: number
  expanded: boolean
  favorite: boolean
  now: Date
  onToggleExpand: () => void
  onToggleFav: () => void
}

function directionsUrl(f: Facility): string {
  const q = encodeURIComponent(`${f.name}, ${f.address}, ${f.city}, ${f.state}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`
}

const SPORT_LABELS: Record<string, string> = {
  greenFee: 'Green fee',
  drivingRange: 'Driving range',
  courseRating: 'Course rating',
  holes: 'Holes',
  courtType: 'Court',
  courtCondition: 'Condition',
  courtCount: 'Courts',
  reservations: 'Reservations',
  surface: 'Surface',
  discHoles: 'Holes',
}

function renderVal(key: string, val: unknown): string {
  if (typeof val === 'boolean') return val ? 'Yes' : 'No'
  if (key === 'courtType') return val === 'both' ? 'Full & half' : `${String(val)} court`
  return String(val)
}

export function PlaceCard({
  facility,
  distance,
  expanded,
  favorite,
  now,
  onToggleExpand,
  onToggleFav,
}: Props) {
  const status = openStatus(facility.hours, now)
  const today = now.getDay()
  const primary = getSport(facility.sports[0])

  return (
    <article className={`card${expanded ? ' expanded' : ''}`}>
      <button className="card__summary" onClick={onToggleExpand} aria-expanded={expanded}>
        <span
          className="card__thumb"
          style={{ background: gradientFor(facility.photoSeeds[0]) }}
          aria-hidden
        >
          {primary.emoji}
        </span>
        <span className="card__main">
          <span className="card__name">{facility.name}</span>
          <span className="card__meta">
            <span>{formatDistance(distance)}</span>
            <span className="dot">·</span>
            <span className={status.open ? 'ok' : 'no'}>
              {status.open ? 'Open' : 'Closed'}
            </span>
            <span className="dot">·</span>
            <span>{facility.cost === 'free' ? 'Free' : facility.price}</span>
          </span>
          <span className="card__tags">
            <StarRating value={facility.rating} count={facility.reviewCount} />
            <span className="card__sportemojis">
              {facility.sports.map((s) => (
                <span key={s} title={getSport(s).name}>
                  {getSport(s).emoji}
                </span>
              ))}
            </span>
          </span>
        </span>
        <span className="card__chevron" aria-hidden>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="card__detail">
          <p className="card__desc">{facility.description}</p>

          <div className="card__actions">
            <a
              className="btn primary"
              href={directionsUrl(facility)}
              target="_blank"
              rel="noreferrer"
            >
              🧭 Directions
            </a>
            {facility.phone && (
              <a className="btn" href={`tel:${facility.phone.replace(/[^0-9+]/g, '')}`}>
                📞 Call
              </a>
            )}
            <button
              className={`btn fav${favorite ? ' on' : ''}`}
              onClick={onToggleFav}
              aria-pressed={favorite}
            >
              {favorite ? '♥ Saved' : '♡ Save'}
            </button>
          </div>

          <dl className="kv-rows">
            <div>
              <dt>Where</dt>
              <dd>
                {facility.address}, {facility.city}, {facility.state} {facility.zip}
              </dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>
                {facility.access === 'public' ? 'Public' : 'Private'} ·{' '}
                {facility.environment === 'both'
                  ? 'Indoor & outdoor'
                  : facility.environment === 'indoor'
                    ? 'Indoor'
                    : 'Outdoor'}{' '}
                · {facility.cost === 'free' ? 'Free' : facility.price}
              </dd>
            </div>
            <div>
              <dt>Today</dt>
              <dd>
                {facility.hours[today]
                  ? `${formatTime(facility.hours[today]!.open)} – ${formatTime(
                      facility.hours[today]!.close,
                    )}`
                  : 'Closed'}{' '}
                <span className={status.open ? 'ok' : 'no'}>({status.label})</span>
              </dd>
            </div>
          </dl>

          {facility.sports.some((s) => facility.sportDetails[s]) && (
            <div className="card__block">
              <h4>Details</h4>
              {facility.sports.map((s) => {
                const d = facility.sportDetails[s]
                if (!d) return null
                const entries = Object.entries(d).filter(
                  ([k, v]) => v != null && k !== 'teeTimeUrl' && k in SPORT_LABELS,
                )
                if (!entries.length) return null
                return (
                  <div className="sport-line" key={s}>
                    <span className="sport-line__name">
                      {getSport(s).emoji} {getSport(s).name}
                    </span>
                    <span className="sport-line__vals">
                      {entries
                        .map(([k, v]) => `${SPORT_LABELS[k]}: ${renderVal(k, v)}`)
                        .join(' · ')}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="card__block">
            <h4>Amenities</h4>
            <div className="chips">
              {facility.amenities.map((a) => (
                <span className="chip" key={a}>
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="card__block">
            <h4>Hours</h4>
            <table className="hours">
              <tbody>
                {facility.hours.map((h, i) => (
                  <tr key={i} className={i === today ? 'today' : ''}>
                    <td>{DAY_NAMES[i]}</td>
                    <td>
                      {h ? `${formatTime(h.open)} – ${formatTime(h.close)}` : 'Closed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </article>
  )
}
