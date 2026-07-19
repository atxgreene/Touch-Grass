import { useCallback, useEffect, useState } from 'react'

/**
 * State synced to localStorage. Safe against JSON parse errors and
 * environments where storage is unavailable (private mode, SSR).
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore write failures (quota / disabled storage)
    }
  }, [key, value])

  return [value, setValue] as const
}

/**
 * Convenience helper for a set of string ids persisted to localStorage,
 * used by favorites and recently-viewed.
 */
export function useIdList(key: string) {
  const [ids, setIds] = useLocalStorage<string[]>(key, [])

  const toggle = useCallback(
    (id: string) => {
      setIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev],
      )
    },
    [setIds],
  )

  const pushRecent = useCallback(
    (id: string, max = 12) => {
      setIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, max))
    },
    [setIds],
  )

  const has = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, setIds, toggle, pushRecent, has }
}
