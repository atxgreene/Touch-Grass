import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal declaration so this config type-checks without pulling @types/node
// (which would leak Node globals into the browser app types).
declare const process: { env: Record<string, string | undefined> }

// Base path is '/' for local dev and native (Capacitor) builds, but is set to
// '/Touch-Grass/' by the GitHub Pages workflow so assets resolve at the
// project-site subpath. See .github/workflows/deploy-pages.yml.
const base = process.env.VITE_BASE || '/'

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
