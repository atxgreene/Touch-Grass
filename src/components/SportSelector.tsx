import { SPORTS } from '../data/sports'
import type { SportId } from '../types'

interface Props {
  selected: SportId | null
  onSelect: (sport: SportId | null) => void
}

export function SportSelector({ selected, onSelect }: Props) {
  return (
    <div className="sports" role="tablist" aria-label="Choose a sport">
      <button
        role="tab"
        aria-selected={selected === null}
        className={`sport-chip all${selected === null ? ' active' : ''}`}
        onClick={() => onSelect(null)}
      >
        <span className="sport-chip__emoji">🌎</span>
        All
      </button>
      {SPORTS.map((sport) => (
        <button
          key={sport.id}
          role="tab"
          aria-selected={selected === sport.id}
          className={`sport-chip${selected === sport.id ? ' active' : ''}`}
          onClick={() => onSelect(sport.id)}
        >
          <span className="sport-chip__emoji">{sport.emoji}</span>
          {sport.name.split(' ')[0]}
        </button>
      ))}
    </div>
  )
}
