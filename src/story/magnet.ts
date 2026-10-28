import type { ScrollTrigger } from '@/lib/gsap'

/**
 * The story's scroll magnet (a ScrollTrigger with snap, created in StoryExperience). Deliberate
 * jumps, a chapter dot or the hero's button, stop any settling move first; otherwise the magnet
 * could finish its own small move after the jump began and cancel it.
 */
let magnet: ScrollTrigger | null = null

export function setMagnet(trigger: ScrollTrigger | null) {
  magnet = trigger
}

export function stopMagnet() {
  magnet?.getTween(true)?.kill()
}
