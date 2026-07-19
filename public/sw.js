// PlayFinder service worker — gives the app offline, installable, app-like
// behavior. Uses runtime caching so it works with Vite's hashed asset names
// without a hardcoded precache list.

const VERSION = 'playfinder-v1'
const APP_SHELL = 'app-shell'
const RUNTIME = 'runtime'
const TILES = 'osm-tiles'
const TILE_LIMIT = 300

self.addEventListener('install', () => {
  // Activate this worker as soon as it finishes installing.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from older versions.
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => ![APP_SHELL, RUNTIME, TILES].includes(k))
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

/** Trim a cache to a maximum number of entries (FIFO). */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName)
  const keys = await cache.keys()
  if (keys.length <= max) return
  for (const req of keys.slice(0, keys.length - max)) {
    await cache.delete(req)
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Map tiles: cache-first, capped. Lets a previously-viewed area work offline.
  if (/tile\.openstreetmap\.org$/.test(url.hostname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILES)
        const hit = await cache.match(request)
        if (hit) return hit
        try {
          const res = await fetch(request)
          if (res.ok) {
            cache.put(request, res.clone())
            trim(TILES, TILE_LIMIT)
          }
          return res
        } catch {
          return hit || Response.error()
        }
      })(),
    )
    return
  }

  // Only handle our own origin beyond this point.
  if (url.origin !== self.location.origin) return

  // Navigation requests: network-first, fall back to cached app shell so the
  // app opens offline. Cached by the actual URL so it works at the site root
  // or a project subpath (e.g. GitHub Pages /Touch-Grass/).
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(APP_SHELL)
        try {
          const res = await fetch(request)
          cache.put(request, res.clone())
          return res
        } catch {
          return (
            (await cache.match(request)) ||
            (await cache.match(self.registration.scope)) ||
            Response.error()
          )
        }
      })(),
    )
    return
  }

  // Static assets (hashed JS/CSS/icons): cache-first.
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME)
      const hit = await cache.match(request)
      if (hit) return hit
      try {
        const res = await fetch(request)
        if (res.ok) cache.put(request, res.clone())
        return res
      } catch {
        return hit || Response.error()
      }
    })(),
  )
})
