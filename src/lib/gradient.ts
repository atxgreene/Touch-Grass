/**
 * Deterministic gradient generator so every facility "photo" is stable and
 * distinct without shipping image assets or making network requests.
 */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function gradientFor(seed: string): string {
  const h = hash(seed)
  const hue1 = h % 360
  const hue2 = (hue1 + 40 + ((h >> 9) % 60)) % 360
  const angle = (h >> 3) % 360
  return `linear-gradient(${angle}deg, hsl(${hue1} 55% 42%), hsl(${hue2} 60% 30%))`
}
