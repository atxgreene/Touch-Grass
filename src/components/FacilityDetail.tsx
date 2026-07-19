import { useState } from 'react'
import type { Facility, Review, SportDetails, SportId } from '../types'
import { getSport } from '../data/sports'
import { gradientFor } from '../lib/gradient'
import { formatDistance } from '../lib/distance'
import { DAY_NAMES, formatTime, openStatus } from '../lib/hours'
import { StarRating } from './StarRating'

interface Props {
  facility: Facility
  distance: number
  favorite: boolean
  userReviews: Review[]
  now: Date
  onClose: () => void
  onToggleFav: () => void
  onAddReview: (review: Omit<Review, 'id' | 'date'>) => void
}

function directionsUrl(f: Facility): string {
  const q = encodeURIComponent(`${f.name}, ${f.address}, ${f.city}, ${f.state}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`
}

const SPORT_FIELD_LABELS: Record<string, string> = {
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
  if (key === 'courtType') {
    return val === 'both' ? 'Full & half' : `${String(val)} court`
  }
  return String(val)
}

function SportDetailBlock({ sport, details }: { sport: SportId; details: SportDetails }) {
  const s = getSport(sport)
  const entries = Object.entries(details).filter(
    ([k, v]) => v != null && k !== 'teeTimeUrl' && k in SPORT_FIELD_LABELS,
  )
  if (entries.length === 0) return null
  return (
    <div className="sport-block">
      <div className="sport-block__title">
        <span>{s.emoji}</span> {s.name}
      </div>
      <div className="detail-list">
        {entries.map(([k, v]) => (
          <div className="kv" key={k}>
            <div className="k">{SPORT_FIELD_LABELS[k]}</div>
            <div className="v">{renderVal(k, v)}</div>
          </div>
        ))}
      </div>
      {details.teeTimeUrl && (
        <a
          className="btn primary"
          href={details.teeTimeUrl}
          target="_blank"
          rel="noreferrer"
          style={{ marginTop: 10 }}
        >
          ⛳ Book a tee time
        </a>
      )}
    </div>
  )
}

function ReviewForm({
  onSubmit,
}: {
  onSubmit: (r: Omit<Review, 'id' | 'date'>) => void
}) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')

  const submit = () => {
    if (rating === 0) return
    onSubmit({ rating, text: text.trim(), author: author.trim() || 'You' })
    setRating(0)
    setText('')
    setAuthor('')
  }

  return (
    <div className="review-form">
      <div className="star-input" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            className={n <= rating ? 'on' : ''}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      <input
        className="search"
        style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--line-strong)', borderRadius: 8, marginBottom: 8, font: 'inherit', fontSize: 14 }}
        placeholder="Your name (optional)"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <textarea
        placeholder="Share a few words about this spot…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn primary"
        style={{ marginTop: 8 }}
        disabled={rating === 0}
        onClick={submit}
      >
        Post review
      </button>
    </div>
  )
}

export function FacilityDetail({
  facility,
  distance,
  favorite,
  userReviews,
  now,
  onClose,
  onToggleFav,
  onAddReview,
}: Props) {
  const status = openStatus(facility.hours, now)
  const today = now.getDay()
  const allReviews = [...userReviews, ...facility.reviews]
  const primary = getSport(facility.sports[0])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div
          className="sheet__hero"
          style={{ background: gradientFor(facility.photoSeeds[0]) }}
        >
          <div className="sheet__hero-emoji">{primary.emoji}</div>
          <button className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <button
            className={`sheet__fav${favorite ? ' on' : ''}`}
            onClick={onToggleFav}
            aria-label={favorite ? 'Remove favorite' : 'Save favorite'}
          >
            {favorite ? '♥' : '♡'}
          </button>
        </div>

        {facility.photoSeeds.length > 1 && (
          <div className="sheet__thumbs">
            {facility.photoSeeds.map((seed, i) => (
              <div
                key={seed}
                className="sheet__thumb"
                style={{ background: gradientFor(seed) }}
              >
                {getSport(facility.sports[i % facility.sports.length]).emoji}
              </div>
            ))}
          </div>
        )}

        <div className="sheet__pad">
          <h1>{facility.name}</h1>
          <div className="sheet__row">
            <StarRating value={facility.rating} count={facility.reviewCount} />
          </div>
          <div className="sheet__row">
            <span className={`pill-mini ${status.open ? 'open' : 'closed'}`}>
              {status.open ? '● ' : '○ '}
              {status.label}
            </span>
            <span className="pill-mini">{formatDistance(distance)} away</span>
            <span className="pill-mini">
              {facility.access === 'public' ? 'Public' : 'Private'}
            </span>
            <span className={`pill-mini ${facility.cost === 'free' ? 'free' : ''}`}>
              {facility.price}
            </span>
          </div>

          <p className="sheet__desc">{facility.description}</p>

          <div className="actions">
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
            {facility.website && (
              <a
                className="btn"
                href={facility.website}
                target="_blank"
                rel="noreferrer"
              >
                🌐 Website
              </a>
            )}
          </div>

          <div className="section">
            <h3>Details</h3>
            <div className="info-grid">
              <span className="ic">📍</span>
              <span>
                {facility.address}, {facility.city}, {facility.state} {facility.zip}
              </span>
              {facility.phone && (
                <>
                  <span className="ic">📞</span>
                  <a href={`tel:${facility.phone.replace(/[^0-9+]/g, '')}`}>
                    {facility.phone}
                  </a>
                </>
              )}
              {facility.website && (
                <>
                  <span className="ic">🌐</span>
                  <a href={facility.website} target="_blank" rel="noreferrer">
                    {facility.website.replace(/^https?:\/\//, '')}
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="section">
            <h3>What you can play</h3>
            {facility.sports.map((s) =>
              facility.sportDetails[s] ? (
                <SportDetailBlock key={s} sport={s} details={facility.sportDetails[s]!} />
              ) : (
                <div className="sport-block" key={s}>
                  <div className="sport-block__title">
                    <span>{getSport(s).emoji}</span> {getSport(s).name}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="section">
            <h3>Amenities</h3>
            <div className="amenities">
              {facility.amenities.map((a) => (
                <span className="amenity" key={a}>
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Hours</h3>
            <table className="hours-table">
              <tbody>
                {facility.hours.map((h, i) => (
                  <tr key={i} className={i === today ? 'today' : ''}>
                    <td className="day">{DAY_NAMES[i]}</td>
                    <td>
                      {h
                        ? `${formatTime(h.open)} – ${formatTime(h.close)}`
                        : 'Closed'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section">
            <h3>
              Ratings &amp; reviews{' '}
              <span style={{ color: 'var(--ink-faint)', fontWeight: 600 }}>
                ({allReviews.length})
              </span>
            </h3>
            <ReviewForm onSubmit={onAddReview} />
            {allReviews.length === 0 && (
              <p style={{ color: 'var(--ink-faint)', fontSize: 14 }}>
                No reviews yet — be the first!
              </p>
            )}
            {allReviews.map((r) => (
              <div className="review" key={r.id}>
                <div className="review__head">
                  <span className="review__author">{r.author}</span>
                  <span className="review__date">{r.date}</span>
                </div>
                <StarRating value={r.rating} showNumber={false} />
                {r.text && <p className="review__text">{r.text}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
