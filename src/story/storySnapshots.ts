import { snapshotAt } from '@/simulation/engine'
import { PRESETS } from '@/simulation/presets'
import type { Snapshot } from '@/simulation/types'

/**
 * Every number the story shows comes from the simulation engine (plan.md §9), never from
 * hand-typed counters. Story mode is a deterministic timeline: the same snapshotAt() call
 * gives the same state forward or backward.
 */
const [original, cashier] = PRESETS
const seconds = (n: number) => n * 1000

/** Original team (1 / 1 / 1) at t = 300 s, mid-rush. */
export const baselineMidRush: Snapshot = snapshotAt(original.config, seconds(300))

/** Original team at t = 600 s, when the last order has just arrived. */
export const baselineAtClose: Snapshot = snapshotAt(original.config, seconds(600))

/** Extra cashier (2 / 1 / 1) at t = 600 s. Same 30 orders, same 10 minutes. */
export const cashierAtClose: Snapshot = snapshotAt(cashier.config, seconds(600))

/** The start of the experiment: nothing has arrived yet, extra worker still on the bench. */
export const startOfRush: Snapshot = snapshotAt(original.config, 0)
