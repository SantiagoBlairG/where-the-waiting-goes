import { STATIONS } from './config'
import type { OrderRecord } from './types'

/** Everything below is derived from order history. Nothing is stored separately. */

const done = (orders: readonly OrderRecord[]) => orders.filter((o) => o.departureMs >= 0)

/** Orders that have left the shop by timeMs, inclusive. */
export function completedBy(orders: readonly OrderRecord[], timeMs: number): number {
  return orders.filter((o) => o.departureMs >= 0 && o.departureMs <= timeMs).length
}

/**
 * Mean time from arrival to leaving the pickup station, over all orders.
 * Returns null until every order has left: a partial average is biased toward the
 * early, easy orders (plan.md §9, "Honest comparisons"), so it is never offered as the cohort figure.
 */
export function meanTotalSeconds(orders: readonly OrderRecord[], expected: number): number | null {
  if (orders.length < expected || done(orders).length < expected) return null
  return orders.reduce((sum, o) => sum + (o.departureMs - o.arrivalMs), 0) / orders.length / 1000
}

/** Mean time spent waiting in line (not being served) at each station, for completed orders. */
export function meanQueueWaitSeconds(orders: readonly OrderRecord[]): [number, number, number] {
  const finished = done(orders)
  if (finished.length === 0) return [0, 0, 0]
  return STATIONS.map((_, s) =>
    finished.reduce((sum, o) => sum + (o.serviceStartMs[s] - o.stationArrivalMs[s]), 0) / finished.length / 1000,
  ) as [number, number, number]
}

/** Mean arrival-to-pickup time of orders completed so far. Secondary detail only. */
export function meanSoFarSeconds(orders: readonly OrderRecord[]): number | null {
  const finished = done(orders)
  if (finished.length === 0) return null
  return finished.reduce((sum, o) => sum + (o.departureMs - o.arrivalMs), 0) / finished.length / 1000
}

/** Time the last order left, in seconds, or null while orders remain inside. */
export function lastPickupSeconds(orders: readonly OrderRecord[], expected: number): number | null {
  if (orders.length < expected || done(orders).length < expected) return null
  return Math.max(...orders.map((o) => o.departureMs)) / 1000
}
