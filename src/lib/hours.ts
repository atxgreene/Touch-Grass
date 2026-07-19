import type { WeeklyHours, DayHours } from '../types'

/** Convert "HH:MM" (24h) to minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Convert minutes since midnight to a friendly "7:00 AM" label. */
export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const period = h24 < 12 ? 'AM' : 'PM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  const mm = m.toString().padStart(2, '0')
  return `${h12}:${mm} ${period}`
}

/** Build a WeeklyHours array with the same open/close every day. */
export function everyDay(open: string, close: string): WeeklyHours {
  const day: DayHours = { open: toMinutes(open), close: toMinutes(close) }
  return Array.from({ length: 7 }, () => ({ ...day }))
}

/** Build WeeklyHours from a set of per-day overrides on a base schedule. */
export function withHours(
  base: WeeklyHours,
  overrides: Partial<Record<number, DayHours | null>>,
): WeeklyHours {
  return base.map((d, i) => (i in overrides ? overrides[i] ?? null : d))
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Is the facility open at the given moment?
 * Handles overnight ranges (close < open) by rolling into the next day.
 */
export function isOpenAt(hours: WeeklyHours, when: Date): boolean {
  const day = when.getDay()
  const minutes = when.getHours() * 60 + when.getMinutes()

  const today = hours[day]
  if (today) {
    if (today.close >= today.open) {
      if (minutes >= today.open && minutes < today.close) return true
    } else {
      // Overnight: open today, closes after midnight
      if (minutes >= today.open) return true
    }
  }

  // Check if yesterday's overnight range spills into today
  const yesterday = hours[(day + 6) % 7]
  if (yesterday && yesterday.close < yesterday.open) {
    if (minutes < yesterday.close) return true
  }

  return false
}

export interface OpenStatus {
  open: boolean
  /** e.g. "Closes 9:00 PM" or "Opens 7:00 AM" */
  label: string
}

export function openStatus(hours: WeeklyHours, when: Date): OpenStatus {
  const open = isOpenAt(hours, when)
  const day = when.getDay()
  const today = hours[day]

  if (open && today) {
    return { open: true, label: `Closes ${formatTime(today.close)}` }
  }

  // Find the next opening within the coming week
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7
    const slot = hours[d]
    if (!slot) continue
    if (i === 0) {
      const minutes = when.getHours() * 60 + when.getMinutes()
      if (minutes < slot.open) {
        return { open: false, label: `Opens ${formatTime(slot.open)}` }
      }
      continue
    }
    const dayLabel = i === 1 ? 'tomorrow' : DAY_NAMES[d]
    return { open: false, label: `Opens ${formatTime(slot.open)} ${dayLabel}` }
  }

  return { open: false, label: 'Closed' }
}
