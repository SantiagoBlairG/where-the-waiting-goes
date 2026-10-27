import type { Snapshot } from '@/simulation/types'

/**
 * PHASE 1 PLACEHOLDER DATA.
 * These counts were computed offline with a throwaway script that applies the rules in
 * plan.md §9 (FIFO, 24/30/15 s service, arrivals every 20 s). The script reproduced every
 * fixture in the plan (18/18/23 completed, 214/214/127 s means, 939/939/765 s last pickup,
 * 58/87/0, 0/145/0 and 58/0/0 s queue waits).
 * Phase 2 replaces this file with output from the real engine's snapshotAt(time).
 */

/** Original team (1 / 1 / 1) at t = 300 s, mid-rush. */
export const baselineMidRush: Snapshot = {
  timeSeconds: 300,
  arrived: 16,
  completed: 8,
  inShop: 8,
  stations: [
    { id: 'order', workers: 1, queue: 3, inService: 1 },
    { id: 'drinks', workers: 1, queue: 2, inService: 1 },
    { id: 'pickup', workers: 1, queue: 0, inService: 1 },
  ],
}

/** Original team (1 / 1 / 1) at t = 600 s. */
export const baselineAtClose: Snapshot = {
  timeSeconds: 600,
  arrived: 30,
  completed: 18,
  inShop: 12,
  stations: [
    { id: 'order', workers: 1, queue: 4, inService: 1 },
    { id: 'drinks', workers: 1, queue: 5, inService: 1 },
    { id: 'pickup', workers: 1, queue: 0, inService: 1 },
  ],
}

/** Extra cashier (2 / 1 / 1) at t = 600 s. Same 30 orders, same 10 minutes. */
export const cashierAtClose: Snapshot = {
  timeSeconds: 600,
  arrived: 30,
  completed: 18,
  inShop: 12,
  stations: [
    { id: 'order', workers: 2, queue: 0, inService: 1 },
    { id: 'drinks', workers: 1, queue: 9, inService: 1 },
    { id: 'pickup', workers: 1, queue: 0, inService: 1 },
  ],
}

/** The very start of the experiment: nothing has arrived yet. */
export const startOfRush: Snapshot = {
  timeSeconds: 0,
  arrived: 0,
  completed: 0,
  inShop: 0,
  stations: [
    { id: 'order', workers: 1, queue: 0, inService: 0 },
    { id: 'drinks', workers: 1, queue: 0, inService: 0 },
    { id: 'pickup', workers: 1, queue: 0, inService: 0 },
  ],
}
