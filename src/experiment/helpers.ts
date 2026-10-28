import { STATIONS, capacityPerMinute, type StationId } from '@/simulation/config'
import type { ExtraPlacement, Snapshot } from '@/simulation/types'

export const PLACEMENTS: readonly { id: ExtraPlacement; label: string }[] = [
  { id: 'order', label: 'Order & pay' },
  { id: 'drinks', label: 'Make drinks' },
  { id: 'pickup', label: 'Pick up' },
  { id: 'off', label: 'Off duty' },
]

export const placementLabel = (id: ExtraPlacement) => PLACEMENTS.find((p) => p.id === id)?.label ?? id

export const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

/**
 * "Capacity if assigned": what a station could finish per minute if the extra worker stood there.
 * This is capacity from the model's formula, not a promised improvement in waiting time.
 */
export function capacityIfExtraAt(station: StationId, placement: ExtraPlacement): number {
  const config = STATIONS.find((s) => s.id === station)!
  return capacityPerMinute(config, 1 + (placement === station ? 1 : 0))
}

/** Workers on duty: the three fixed workers plus the extra worker unless they are off duty. */
export function activeWorkers(snapshot: Snapshot): number {
  return snapshot.stations.reduce((n, s) => n + s.workers, 0)
}

/**
 * One sentence about the consequence of the current setup, not generic encouragement. It never
 * promises that no queue remains: demand still exceeds ordering capacity after adding a barista.
 */
export function insightFor(destination: ExtraPlacement): string {
  switch (destination) {
    case 'order':
      return 'Orders reach the drinks station sooner, but drinks still finish at the same rate.'
    case 'drinks':
      return 'Drinks can now keep up. Ordering becomes the next limit.'
    case 'pickup':
      return 'Pickup keeps up on average. Another worker here only clears the odd short line after a slow handover.'
    default:
      return 'One worker at each stop. Drinks, at about 2 orders a minute, is the slowest step.'
  }
}
