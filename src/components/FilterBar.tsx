import type { Filters } from '../types'
import { DEFAULT_FILTERS } from '../lib/filters'

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
}

const DISTANCES = [5, 10, 25, 50]

export function FilterBar({ filters, onChange }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value })

  const isDefault =
    JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS)

  return (
    <div className="filters" role="group" aria-label="Filters">
      <button
        className={`filter-pill${filters.openNow ? ' active' : ''}`}
        onClick={() => set('openNow', !filters.openNow)}
        aria-pressed={filters.openNow}
      >
        <span className="filter-pill__toggle" />
        Open now
      </button>

      <label className={`filter-pill${filters.access !== 'any' ? ' active' : ''}`}>
        <select
          value={filters.access}
          onChange={(e) => set('access', e.target.value as Filters['access'])}
        >
          <option value="any">Public &amp; private</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </label>

      <label
        className={`filter-pill${filters.environment !== 'any' ? ' active' : ''}`}
      >
        <select
          value={filters.environment}
          onChange={(e) =>
            set('environment', e.target.value as Filters['environment'])
          }
        >
          <option value="any">Indoor &amp; outdoor</option>
          <option value="indoor">Indoor</option>
          <option value="outdoor">Outdoor</option>
        </select>
      </label>

      <label className={`filter-pill${filters.cost !== 'any' ? ' active' : ''}`}>
        <select
          value={filters.cost}
          onChange={(e) => set('cost', e.target.value as Filters['cost'])}
        >
          <option value="any">Free &amp; paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </label>

      <label
        className={`filter-pill${filters.maxDistance != null ? ' active' : ''}`}
      >
        <select
          value={filters.maxDistance ?? 'any'}
          onChange={(e) =>
            set(
              'maxDistance',
              e.target.value === 'any' ? null : Number(e.target.value),
            )
          }
        >
          <option value="any">Any distance</option>
          {DISTANCES.map((d) => (
            <option key={d} value={d}>
              Within {d} mi
            </option>
          ))}
        </select>
      </label>

      {!isDefault && (
        <button className="filter-reset" onClick={() => onChange(DEFAULT_FILTERS)}>
          Reset
        </button>
      )}
    </div>
  )
}
