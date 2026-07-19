import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.playfinder.app',
  appName: 'PlayFinder',
  // Capacitor bundles the Vite production build. Build with the default base
  // ('/') — NOT the GitHub Pages subpath — before running `cap sync`.
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
}

export default config
