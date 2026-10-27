import { useSyncExternalStore } from 'react'

/**
 * "pinned": the sticky, scroll-driven stage (wide screens, motion allowed).
 * "static": the same content as ordinary sections (phones, tablets, reduced motion).
 */
export type StoryMode = 'pinned' | 'static'

const WIDE = '(min-width: 900px) and (min-height: 660px)'
const REDUCED = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(WIDE), window.matchMedia(REDUCED)]
  queries.forEach((q) => q.addEventListener('change', onChange))
  return () => queries.forEach((q) => q.removeEventListener('change', onChange))
}

function snapshot(): StoryMode {
  return window.matchMedia(WIDE).matches && !window.matchMedia(REDUCED).matches ? 'pinned' : 'static'
}

export function useStoryMode(): StoryMode {
  return useSyncExternalStore(subscribe, snapshot, () => 'static')
}
