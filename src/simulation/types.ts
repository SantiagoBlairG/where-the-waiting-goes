import type { StationId } from './config'

/** Where the one flexible worker is, or where they are headed. */
export type ExtraPlacement = StationId | 'off'

export type StationSnapshot = {
  id: StationId
  /** Workers at this station. A worker with a pending move still counts where they are. */
  workers: number
  /** Orders waiting for a free worker. */
  queue: number
  /** Orders a worker is making right now. */
  inService: number
}

export type ExtraWorkerSnapshot = {
  /** Current location. "off" means off duty. */
  at: ExtraPlacement
  /** Requested destination while the worker finishes the current order, else null. */
  pending: ExtraPlacement | null
  /** True while the worker is making an order. */
  busy: boolean
}

export type Snapshot = {
  timeMs: number
  timeSeconds: number
  arrived: number
  completed: number
  /** arrived - completed: queued and in service together. */
  inShop: number
  stations: readonly [StationSnapshot, StationSnapshot, StationSnapshot]
  extraWorker: ExtraWorkerSnapshot
}

/** One order's full history. Times are integer simulated milliseconds; -1 means "not yet". */
export type OrderRecord = {
  id: number
  arrivalMs: number
  /** When the order joined each station's line. */
  stationArrivalMs: [number, number, number]
  serviceStartMs: [number, number, number]
  serviceEndMs: [number, number, number]
  /** When the order left the last station, or -1 while still inside. */
  departureMs: number
}

export type WorkerEvent = {
  timeMs: number
  kind: 'assigned' | 'move-requested' | 'move-cancelled' | 'moved'
  to: ExtraPlacement
}

/** Starting allocation for a run. The three fixed workers never move. */
export type SimulationConfig = {
  extra: ExtraPlacement
}
