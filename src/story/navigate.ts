import { gsap } from '@/lib/gsap'
import { stopMagnet } from './magnet'
import { beatRest } from './timeline'

/**
 * The page's two deliberate journeys, shared by the hero's button and the floating nav. Both stop
 * the scroll magnet first, so a settling move cannot cancel them, and both respect reduced motion.
 */
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The story track exists only in the pinned layout. */
const storyTrack = () => document.querySelector<HTMLElement>('[data-story-track]')

/**
 * To the first chapter, "A familiar moment". In the pinned layout this lands on its resting point
 * (so the magnet has nothing left to do) and plays the hero's zoom on the way; otherwise it is the
 * first story section.
 */
export function goToStory() {
  const track = storyTrack()
  const target = track ? track.getBoundingClientRect().top + window.scrollY + beatRest(0) * (track.offsetHeight - window.innerHeight) : '#story'
  if (reduced()) {
    if (typeof target === 'number') window.scrollTo(0, target)
    else document.querySelector(target)?.scrollIntoView()
    return
  }
  stopMagnet()
  gsap.to(window, { scrollTo: { y: target, autoKill: true }, duration: track ? 2.8 : 1, ease: 'power2.inOut', overwrite: true })
}

/** Back to the welcome card at the very top, the story rewinding on the way. */
export function backToTop() {
  if (reduced()) {
    window.scrollTo(0, 0)
    return
  }
  stopMagnet()
  // Long way up (the whole story), so it takes its time, but never more than 2.4 s.
  const duration = Math.min(2.4, 0.9 + window.scrollY / 9000)
  gsap.to(window, { scrollTo: { y: 0, autoKill: true }, duration, ease: 'power3.inOut', overwrite: true })
}
