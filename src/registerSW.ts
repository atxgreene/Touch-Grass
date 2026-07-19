/**
 * Registers the service worker in production builds. Skipped in dev so Vite's
 * HMR isn't shadowed by a cache. Fails silently on unsupported browsers.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  if (!import.meta.env.PROD) return

  // Resolve against the deploy base so it works at a subpath (GitHub Pages)
  // as well as at the root (local / native).
  const base = import.meta.env.BASE_URL
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${base}sw.js`, { scope: base })
      .catch((err) => {
        console.warn('Service worker registration failed:', err)
      })
  })
}
