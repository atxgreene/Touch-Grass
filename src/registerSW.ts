/**
 * Registers the service worker in production builds. Skipped in dev so Vite's
 * HMR isn't shadowed by a cache. Fails silently on unsupported browsers.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
