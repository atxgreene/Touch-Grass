import type { Sport, SportId } from '../types'

export const SPORTS: Sport[] = [
  { id: 'golf', name: 'Golf', emoji: '⛳', color: '#2f8f4e' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', color: '#e0752d' },
  { id: 'pickleball', name: 'Pickleball', emoji: '🥒', color: '#5fa832' },
  { id: 'tennis', name: 'Tennis', emoji: '🎾', color: '#b7d43b' },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', color: '#d9a441' },
  { id: 'soccer', name: 'Soccer', emoji: '⚽', color: '#3a86c8' },
  { id: 'disc-golf', name: 'Disc Golf', emoji: '🥏', color: '#7a5cc4' },
  { id: 'baseball', name: 'Baseball / Softball', emoji: '⚾', color: '#c8503a' },
  { id: 'hockey', name: 'Hockey', emoji: '🏒', color: '#4a5aa8' },
]

export const SPORTS_BY_ID: Record<SportId, Sport> = SPORTS.reduce(
  (acc, s) => {
    acc[s.id] = s
    return acc
  },
  {} as Record<SportId, Sport>,
)

export function getSport(id: SportId): Sport {
  return SPORTS_BY_ID[id]
}
