import { snapshotAt } from '@/simulation/engine'
import { PRESETS } from '@/simulation/presets'
import type { Snapshot } from '@/simulation/types'

/**
 * Scroll-to-state mapping for the pinned story. Pure functions, no DOM: story mode is a
 * deterministic visual timeline, so the same scroll position always gives the same state,
 * forward or backward (plan.md §7).
 */

/** Scroll length of each beat, in viewport heights. The rush gets the most: time plays out inside it. */
export const BEAT_WEIGHTS = [1, 1.2, 2.6, 1.3, 1.2, 1.3, 1] as const
export const BEAT_COUNT = BEAT_WEIGHTS.length
export const TOTAL_WEIGHT = BEAT_WEIGHTS.reduce((a, b) => a + b, 0)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Where the page is: which beat, and how far through it (0 to 1). */
export function locate(progress: number): { beat: number; local: number } {
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

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Beat 2: the traced order pauses at each station and glides between them.
 * Returns a position from 0 (Order & pay) to 2 (Pick up).
 */
export function travelPosition(local: number): number {
  const seg = (a: number, b: number) => smooth(clamp01((local - a) / (b - a)))
  return seg(0.16, 0.44) + seg(0.58, 0.86)
}
