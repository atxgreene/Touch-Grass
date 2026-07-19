// Core domain types for PlayFinder

export type SportId =
  | 'golf'
  | 'basketball'
  | 'pickleball'
  | 'tennis'
  | 'volleyball'
  | 'soccer'
  | 'disc-golf'
  | 'baseball'
  | 'hockey'

export interface Sport {
  id: SportId
  name: string
  emoji: string
  /** Accent color used for markers and chips */
  color: string
}

export type Access = 'public' | 'private'
export type Environment = 'indoor' | 'outdoor' | 'both'
export type Cost = 'free' | 'paid'

/** Minutes since midnight, or null for a closed day. */
export interface DayHours {
  open: number
  close: number
}

/** Index 0 = Sunday ... 6 = Saturday. null means closed that day. */
export type WeeklyHours = (DayHours | null)[]

export interface Review {
  id: string
  author: string
  rating: number
  text: string
  /** ISO date string */
  date: string
}

/** Optional sport-specific attributes shown on the detail page. */
export interface SportDetails {
  // Golf
  greenFee?: string
  drivingRange?: boolean
  teeTimeUrl?: string
  courseRating?: number
  holes?: number
  // Basketball
  courtType?: 'full' | 'half' | 'both'
  courtCondition?: string
  // Pickleball / Tennis / Volleyball
  courtCount?: number
  reservations?: boolean
  surface?: string
  // Disc golf
  discHoles?: number
}

export interface Facility {
  id: string
  name: string
  sports: SportId[]
  lat: number
  lng: number
  address: string
  city: string
  state: string
  zip: string
  access: Access
  environment: Environment
  cost: Cost
  /** Human-readable price info, e.g. "$25 / round" or "Free" */
  price: string
  phone?: string
  website?: string
  /** Gradient seeds used to render placeholder photos without external assets */
  photoSeeds: string[]
  hours: WeeklyHours
  amenities: string[]
  rating: number
  reviewCount: number
  reviews: Review[]
  sportDetails: Partial<Record<SportId, SportDetails>>
  description: string
}

export interface Coords {
  lat: number
  lng: number
}

export interface Filters {
  access: Access | 'any'
  environment: Environment | 'any'
  cost: Cost | 'any'
  /** Max distance in miles, or null for no limit */
  maxDistance: number | null
  openNow: boolean
}
