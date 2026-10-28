/** Station definitions and fixed model constants. See docs/simulation.md (plan.md §9 numbers superseded 2026-10-28). */

export type StationId = 'order' | 'drinks' | 'pickup'

export type StationConfig = {
  id: StationId
  step: number
  name: string
  /** The average service time. Capacity and the story's "about n seconds" use this. */
  serviceSeconds: number
  /**
   * Service time per customer, repeating every three customers (order 0, 1, 2, then again).
   * Customers differ: paying by card is quicker than a question at the till, an espresso is
   * quicker than a latte, most handovers are instant but now and then a name is called twice.
   * Deterministic, so the same setup always gives the same result. Averages to serviceSeconds.
   */
  pattern: readonly number[]
}

export const STATIONS: readonly StationConfig[] = [
  { id: 'order', step: 1, name: 'Order & pay', serviceSeconds: 24, pattern: [12, 18, 42] },
  { id: 'drinks', step: 2, name: 'Make drinks', serviceSeconds: 30, pattern: [18, 26, 46] },
  { id: 'pickup', step: 3, name: 'Pick up', serviceSeconds: 20, pattern: [6, 10, 44] },
]

export const ORDER_COUNT = 30
export const ARRIVAL_INTERVAL_SECONDS = 20
/** Arrivals stop at this time; processing continues until every order is done. */
export const ADMISSION_WINDOW_SECONDS = 600

/** How long one customer's order takes at one station. */
export function serviceSecondsFor(station: StationConfig, orderId: number): number {
  return station.pattern[orderId % station.pattern.length]
}

/** Station capacity = workers x 60 / average service seconds (orders per minute). */
export function capacityPerMinute(station: StationConfig, workers: number): number {
  return (workers * 60) / station.serviceSeconds
}
