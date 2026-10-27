import {
  ADMISSION_WINDOW_SECONDS,
  ARRIVAL_INTERVAL_SECONDS,
  ORDER_COUNT,
  STATIONS,
  type StationId,
} from './config'
import type {
  ExtraPlacement,
  OrderRecord,
  SimulationConfig,
  Snapshot,
  StationSnapshot,
  WorkerEvent,
} from './types'

/**
 * Deterministic discrete-event model of the coffee shop (plan.md §9).
 * No rendering, no wall clock: time only moves when advanceTo() is called, and every
 * consequence at one timestamp is settled in the order the plan fixes:
 *   1 complete services, 2 release finished orders downstream (by order id),
 *   3 resolve pending worker moves, 4 admit arrivals, 5 assign free workers FIFO
 *   (ties by worker id), 6 snapshot.
 * Frame rate, playback speed and batching cannot change the result.
 */

const STATION_INDEX: Record<StationId, number> = { order: 0, drinks: 1, pickup: 2 }
const SERVICE_MS = STATIONS.map((s) => s.serviceSeconds * 1000)
const ARRIVAL_MS = Array.from({ length: ORDER_COUNT }, (_, i) => i * ARRIVAL_INTERVAL_SECONDS * 1000)

/** Workers 0, 1, 2 are the fixed workers of the three stations. Worker 3 is the flexible one. */
const EXTRA_ID = 3

type Worker = {
  id: number
  /** Station index the worker is at, or -1 when off duty. */
  at: number
  busyUntilMs: number
  orderId: number
  pending: ExtraPlacement | null
}

function placementToIndex(p: ExtraPlacement): number {
  return p === 'off' ? -1 : STATION_INDEX[p]
}

function indexToPlacement(i: number): ExtraPlacement {
  return i < 0 ? 'off' : STATIONS[i].id
}

export class Simulation {
  private timeMs = 0
  private readonly orders: OrderRecord[] = []
  private readonly queues: number[][] = [[], [], []]
  private readonly workers: Worker[]
  private nextArrival = 0
  readonly workerEvents: WorkerEvent[] = []

  constructor(config: SimulationConfig) {
    this.workers = [
      { id: 0, at: 0, busyUntilMs: -1, orderId: -1, pending: null },
      { id: 1, at: 1, busyUntilMs: -1, orderId: -1, pending: null },
      { id: 2, at: 2, busyUntilMs: -1, orderId: -1, pending: null },
      { id: EXTRA_ID, at: placementToIndex(config.extra), busyUntilMs: -1, orderId: -1, pending: null },
    ]
    this.workerEvents.push({ timeMs: 0, kind: 'assigned', to: config.extra })
    this.advanceTo(0)
  }

  get now(): number {
    return this.timeMs
  }

  /** True once all orders have arrived and left. */
  get isComplete(): boolean {
    return this.orders.length === ORDER_COUNT && this.orders.every((o) => o.departureMs >= 0)
  }

  /** The order history so far, including orders still inside. */
  get history(): readonly OrderRecord[] {
    return this.orders
  }

  /** Process every event up to and including targetMs. Never goes backwards. */
  advanceTo(targetMs: number): void {
    if (!Number.isInteger(targetMs)) throw new Error('Simulation time must be an integer number of milliseconds')
    while (true) {
      const next = this.nextEventMs()
      if (next === null || next > targetMs) break
      this.timeMs = next
      this.settle(next)
    }
    if (targetMs > this.timeMs) this.timeMs = targetMs
  }

  /**
   * Place the flexible worker. An idle worker moves at once. A busy worker finishes the
   * current order first, and the latest choice wins. Choosing their current station cancels
   * a pending move.
   */
  setExtraWorker(target: ExtraPlacement): void {
    const w = this.workers[EXTRA_ID]
    const busy = w.busyUntilMs >= 0
    if (!busy) {
      if (w.at !== placementToIndex(target)) {
        w.at = placementToIndex(target)
        this.workerEvents.push({ timeMs: this.timeMs, kind: 'moved', to: target })
        this.assign()
      }
      w.pending = null
      return
    }
    if (target === indexToPlacement(w.at)) {
      if (w.pending !== null) this.workerEvents.push({ timeMs: this.timeMs, kind: 'move-cancelled', to: target })
      w.pending = null
      return
    }
    if (w.pending !== target) this.workerEvents.push({ timeMs: this.timeMs, kind: 'move-requested', to: target })
    w.pending = target
  }

  snapshot(): Snapshot {
    const arrived = this.nextArrival
    const completed = this.orders.filter((o) => o.departureMs >= 0).length
    const stations = STATIONS.map((station, s): StationSnapshot => ({
      id: station.id,
      workers: this.workers.filter((w) => w.at === s).length,
      queue: this.queues[s].length,
      inService: this.workers.filter((w) => w.at === s && w.busyUntilMs >= 0).length,
    })) as unknown as Snapshot['stations']
    const extra = this.workers[EXTRA_ID]
    return {
      timeMs: this.timeMs,
      timeSeconds: this.timeMs / 1000,
      arrived,
      completed,
      inShop: arrived - completed,
      stations,
      extraWorker: { at: indexToPlacement(extra.at), pending: extra.pending, busy: extra.busyUntilMs >= 0 },
    }
  }

  private nextEventMs(): number | null {
    let next: number | null = this.nextArrival < ORDER_COUNT ? ARRIVAL_MS[this.nextArrival] : null
    for (const w of this.workers) {
      if (w.busyUntilMs >= 0 && (next === null || w.busyUntilMs < next)) next = w.busyUntilMs
    }
    return next
  }

  /** Settle every consequence of one timestamp, in the plan's fixed order. */
  private settle(t: number): void {
    // 1. Complete all service events (workers in id order).
    const finished: { orderId: number; station: number }[] = []
    for (const w of this.workers) {
      if (w.busyUntilMs !== t) continue
      this.orders[w.orderId].serviceEndMs[w.at] = t
      finished.push({ orderId: w.orderId, station: w.at })
      w.busyUntilMs = -1
      w.orderId = -1
    }
    // 2. Release finished orders downstream, ties broken by order id.
    finished.sort((a, b) => a.orderId - b.orderId)
    for (const { orderId, station } of finished) {
      if (station < STATIONS.length - 1) {
        this.queues[station + 1].push(orderId)
        this.orders[orderId].stationArrivalMs[station + 1] = t
      } else {
        this.orders[orderId].departureMs = t
      }
    }
    // 3. Resolve pending worker moves for workers who are now free.
    for (const w of this.workers) {
      if (w.busyUntilMs < 0 && w.pending !== null) {
        w.at = placementToIndex(w.pending)
        this.workerEvents.push({ timeMs: t, kind: 'moved', to: w.pending })
        w.pending = null
      }
    }
    // 4. Admit external arrivals scheduled for this timestamp.
    while (this.nextArrival < ORDER_COUNT && ARRIVAL_MS[this.nextArrival] === t) {
      const id = this.nextArrival++
      this.orders.push({
        id,
        arrivalMs: t,
        stationArrivalMs: [t, -1, -1],
        serviceStartMs: [-1, -1, -1],
        serviceEndMs: [-1, -1, -1],
        departureMs: -1,
      })
      this.queues[0].push(id)
    }
    // 5. Assign free workers to queued orders, FIFO, worker ties by id.
    this.assign()
  }

  private assign(): void {
    for (let s = 0; s < STATIONS.length; s++) {
      for (const w of this.workers) {
        if (w.at !== s || w.busyUntilMs >= 0) continue
        const orderId = this.queues[s].shift()
        if (orderId === undefined) break
        w.orderId = orderId
        w.busyUntilMs = this.timeMs + SERVICE_MS[s]
        this.orders[orderId].serviceStartMs[s] = this.timeMs
      }
    }
  }
}

/** Run one whole rush to the end and return the finished simulation. */
export function runToCompletion(config: SimulationConfig): Simulation {
  const sim = new Simulation(config)
  // Safe upper bound: all arrivals plus every order's time through the slowest station.
  const horizonMs = (ADMISSION_WINDOW_SECONDS + ORDER_COUNT * Math.max(...SERVICE_MS) / 1000) * 1000
  sim.advanceTo(horizonMs)
  return sim
}

/** The state at one moment of a fresh run with a fixed allocation. Used for story snapshots. */
export function snapshotAt(config: SimulationConfig, timeMs: number): Snapshot {
  const sim = new Simulation(config)
  sim.advanceTo(timeMs)
  return sim.snapshot()
}
