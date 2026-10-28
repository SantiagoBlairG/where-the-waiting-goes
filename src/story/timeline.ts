import { snapshotAt } from '@/simulation/engine'
import { PRESETS } from '@/simulation/presets'
import type { Snapshot } from '@/simulation/types'

/**
 * Scroll-to-state mapping for the pinned story. Pure functions, no DOM: story mode is a
 * deterministic visual timeline, so the same scroll position always gives the same state,
 * forward or backward (plan.md §7).
 */

/**
 * Scroll length of each beat, in viewport heights. The rush gets the most: ten minutes play out
 * inside it while numbers change on every tile, so it scrolls about 40% slower than it used to (4.5, was 3.2).
 */
export const BEAT_WEIGHTS = [1.7, 2.2, 4.5, 1.4, 1.4, 1.4, 1.3, 1] as const
export const BEAT_COUNT = BEAT_WEIGHTS.length
export const TOTAL_WEIGHT = BEAT_WEIGHTS.reduce((a, b) => a + b, 0)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Where the page is: which beat, and how far through it (0 to 1). */
export function locate(progress: number): { beat: number; local: number } {
  // The very end is exactly the end of the last beat, whatever the rounding of the weights.
  if (progress >= 1) return { beat: BEAT_COUNT - 1, local: 1 }
  const p = clamp01(progress) * TOTAL_WEIGHT
  let start = 0
  for (let beat = 0; beat < BEAT_COUNT; beat++) {
    const end = start + BEAT_WEIGHTS[beat]
    if (p < end || beat === BEAT_COUNT - 1) return { beat, local: clamp01((p - start) / BEAT_WEIGHTS[beat]) }
    start = end
  }
  return { beat: BEAT_COUNT - 1, local: 1 }
}

/** The scroll progress (0 to 1) at which a beat begins. */
export function beatStart(beat: number): number {
  let start = 0
  for (let i = 0; i < beat; i++) start += BEAT_WEIGHTS[i]
  return start / TOTAL_WEIGHT
}

/** Original team, a snapshot every 20 simulated seconds from t=0 to t=600. */
export const RUSH_STEP_SECONDS = 20
export const RUSH_STEPS: readonly Snapshot[] = Array.from({ length: 600 / RUSH_STEP_SECONDS + 1 }, (_, i) =>
  snapshotAt(PRESETS[0].config, i * RUSH_STEP_SECONDS * 1000),
)

/**
 * Inside the rush beat the simulated clock follows the scroll: a short dwell at the start,
 * then t=0 to t=600, then a short dwell at the end so the reader can take in the final state.
 */
export function rushStepIndex(local: number): number {
  const t = clamp01((local - 0.06) / 0.88)
  return Math.round(t * (RUSH_STEPS.length - 1))
}

/**
 * Where the scroll comes to rest inside each beat (local 0 to 1). A beat whose state does not change
 * with the scroll rests in its middle. The traced order rests at its three stops (the plateaus of
 * travelPosition). The rush rests at its start and its end; in between, the clock follows the
 * scroll freely, so no snapping happens there.
 */
const REST_LOCALS: readonly (readonly number[])[] = [[0.5], [0.08, 0.51, 0.93], [0.03, 0.97], [0.5], [0.5], [0.5], [0.5], [0.5]]
const RUSH_BEAT = 2
/** Inside the rush, between these locals, the scroll is free (the clock is the content). */
const RUSH_FREE: readonly [number, number] = [0.06, 0.94]

/** Every resting point of the story, as scroll progress (0 to 1), in order. */
export function restPoints(): number[] {
  const points: number[] = []
  REST_LOCALS.forEach((locals, beat) => locals.forEach((l) => points.push(beatStart(beat) + (BEAT_WEIGHTS[beat] * l) / TOTAL_WEIGHT)))
  return points
}

/** The first resting point of a beat: where the chapter rail and the hero's button land. */
export function beatRest(beat: number): number {
  return beatStart(beat) + (BEAT_WEIGHTS[beat] * REST_LOCALS[beat][0]) / TOTAL_WEIGHT
}

/** The part of the rush where the scroll is free, as scroll progress. */
export function rushFreeRange(): [number, number] {
  const at = (l: number) => beatStart(RUSH_BEAT) + (BEAT_WEIGHTS[RUSH_BEAT] * l) / TOTAL_WEIGHT
  return [at(RUSH_FREE[0]), at(RUSH_FREE[1])]
}

/**
 * Where to settle after the reader stops scrolling. A magnet with a sense of direction: going
 * forward it settles on the next resting point, unless the reader only just passed one (within
 * 12% of the gap), which it returns to; going back, the mirror image. Inside a free range it
 * stays put. Works in any unit (progress or pixels), as long as value and points share it.
 */
export function snapTarget(value: number, points: readonly number[], direction: number, free?: readonly [number, number]): number {
  if (free && value > free[0] && value < free[1]) return value
  let prev: number | undefined
  let next: number | undefined
  for (const p of points) {
    if (p <= value) prev = p
    else if (next === undefined) next = p
  }
  if (prev === undefined) return next ?? value
  if (next === undefined) return prev
  const gap = next - prev
  if (direction > 0) return value - prev < gap * 0.12 ? prev : next
  if (direction < 0) return next - value < gap * 0.12 ? next : prev
  return value - prev < next - value ? prev : next
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Beat 2: the traced order pauses at each station and glides between them.
 * Returns a position from 0 (Order & pay) to 2 (Pick up).
 */
export function travelPosition(local: number): number {
  const seg = (a: number, b: number) => smooth(clamp01((local - a) / (b - a)))
  return seg(0.16, 0.44) + seg(0.58, 0.86)
}
