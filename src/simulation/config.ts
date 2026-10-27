/** Station definitions and fixed model constants. See plan.md §9 and docs/simulation.md. */

export type StationId = 'order' | 'drinks' | 'pickup'

export type StationConfig = {
  id: StationId
  step: number
  name: string
  serviceSeconds: number
}

export const STATIONS: readonly StationConfig[] = [
  { id: 'order', step: 1, name: 'Order & pay', serviceSeconds: 24 },
  { id: 'drinks', step: 2, name: 'Make drinks', serviceSeconds: 30 },
  { id: 'pickup', step: 3, name: 'Pick up', serviceSeconds: 15 },
]

export const ORDER_COUNT = 30
export const ARRIVAL_INTERVAL_SECONDS = 20
/** Arrivals stop at this time; processing continues until every order is done. */
export const ADMISSION_WINDOW_SECONDS = 600

/** Station capacity = workers x 60 / service seconds (orders per minute). */
export function capacityPerMinute(station: StationConfig, workers: number): number {
  return (workers * 60) / station.serviceSeconds
}
