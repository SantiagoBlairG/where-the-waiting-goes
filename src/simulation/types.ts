import type { StationId } from './config'

export type StationSnapshot = {
  id: StationId
  workers: number
  /** Orders waiting for a free worker. */
  queue: number
  /** Orders a worker is making right now. */
  inService: number
}

export type Snapshot = {
  timeSeconds: number
  arrived: number
  completed: number
  /** arrived - completed: queued and in service together. */
  inShop: number
  stations: readonly [StationSnapshot, StationSnapshot, StationSnapshot]
}
