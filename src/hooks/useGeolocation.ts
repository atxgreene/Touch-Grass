import { useCallback, useEffect, useState } from 'react'
import type { Coords } from '../types'

/** Fallback location: downtown Austin, TX. */
export const DEFAULT_LOCATION: Coords = { lat: 30.2672, lng: -97.7431 }

type Status = 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable'

export interface GeolocationState {
  coords: Coords
  status: Status
  /** True while we're falling back to the default location. */
  usingFallback: boolean
  locate: () => void
}

export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<Coords>(DEFAULT_LOCATION)
  const [status, setStatus] = useState<Status>('idle')

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable')
      return
    }
    setStatus('locating')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('granted')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    )
  }, [])

  // Attempt to locate on first mount.
  useEffect(() => {
    locate()
  }, [locate])

  return {
    coords,
    status,
    usingFallback: status !== 'granted',
    locate,
  }
}
