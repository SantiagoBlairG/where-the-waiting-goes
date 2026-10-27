import { ADMISSION_WINDOW_SECONDS, ORDER_COUNT, type StationId } from './config'
import { runToCompletion } from './engine'
import { completedBy, lastPickupSeconds, meanQueueWaitSeconds, meanTotalSeconds } from './metrics'
import type { ExtraPlacement, SimulationConfig } from './types'

export type PresetId = 'original' | 'cashier' | 'barista'

export type Preset = {
  id: PresetId
  name: string
  config: SimulationConfig
  /** Workers at order / drinks / pickup, counting the extra worker where placed. */
  workers: readonly [number, number, number]
  totalWorkers: number
}

function preset(id: PresetId, name: string, extra: ExtraPlacement): Preset {
  const workers: [number, number, number] = [1, 1, 1]
  const index: Record<StationId, number> = { order: 0, drinks: 1, pickup: 2 }
  if (extra !== 'off') workers[index[extra]] += 1
  return Object.freeze({
    id,
    name,
    config: Object.freeze({ extra }),
    workers: Object.freeze(workers) as unknown as Preset['workers'],
    totalWorkers: 3 + (extra === 'off' ? 0 : 1),
  })
}

export const PRESETS: readonly Preset[] = Object.freeze([
  preset('original', 'Original team', 'off'),
  preset('cashier', 'Extra cashier', 'order'),
  preset('barista', 'Extra barista', 'drinks'),
])

export type FullRunResult = {
  completedAtClose: number
  inShopAtClose: number
  meanTotalSeconds: number
  lastPickupSeconds: number
  queueWaitSeconds: [number, number, number]
}

/** Full-run model results for a preset, computed from a fresh run. Never mutates the preset. */
export function fullRunResult(p: Preset): FullRunResult {
  const sim = runToCompletion(p.config)
  const orders = sim.history
  const closeMs = ADMISSION_WINDOW_SECONDS * 1000
  const completedAtClose = completedBy(orders, closeMs)
  return {
    completedAtClose,
    inShopAtClose: ORDER_COUNT - completedAtClose,
    meanTotalSeconds: meanTotalSeconds(orders, ORDER_COUNT) as number,
    lastPickupSeconds: lastPickupSeconds(orders, ORDER_COUNT) as number,
    queueWaitSeconds: meanQueueWaitSeconds(orders),
  }
}
