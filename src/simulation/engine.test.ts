import { describe, expect, it } from 'vitest'
import { ORDER_COUNT, STATIONS, serviceSecondsFor } from './config'
import { Simulation, runToCompletion, snapshotAt } from './engine'
import { PRESETS, fullRunResult } from './presets'
import { completedBy, meanQueueWaitSeconds } from './metrics'

const s = (seconds: number) => seconds * 1000
const [original, cashier, barista, runner] = PRESETS

// The model's fixtures since 2026-10-28, when service times began to vary per customer
// (docs/simulation.md). They replace the numbers in plan.md §9.
describe('model fixtures (docs/simulation.md)', () => {
  const expected = [
    { preset: original, completed: 17, inside: 13, mean: 232, last: 982, waits: [58, 91, 10] },
    { preset: cashier, completed: 18, inside: 12, mean: 213, last: 972, waits: [0, 130, 8] },
    { preset: barista, completed: 21, inside: 9, mean: 142, last: 820, waits: [58, 0, 10] },
    { preset: runner, completed: 17, inside: 13, mean: 222, last: 982, waits: [58, 91, 0] },
  ]
  for (const e of expected) {
    it(`${e.preset.name}: completed, still inside, mean, last pickup, queue waits`, () => {
      const r = fullRunResult(e.preset)
      expect(r.completedAtClose).toBe(e.completed)
      expect(r.inShopAtClose).toBe(e.inside)
      expect(Math.round(r.meanTotalSeconds)).toBe(e.mean)
      expect(r.lastPickupSeconds).toBe(e.last)
      expect(r.queueWaitSeconds.map(Math.round)).toEqual(e.waits)
    })
  }

  it('gives every order exactly its own service times, which average to the station averages', () => {
    const orders = runToCompletion(original.config).history
    for (const o of orders) {
      for (let i = 0; i < 3; i++) expect(o.serviceEndMs[i] - o.serviceStartMs[i]).toBe(serviceSecondsFor(STATIONS[i], o.id) * 1000)
    }
    for (const st of STATIONS) expect(st.pattern.reduce((a, b) => a + b, 0) / st.pattern.length).toBe(st.serviceSeconds)
  })

  it('gives four different outcomes, with the extra barista clearly best', () => {
    const r = PRESETS.map((p) => fullRunResult(p))
    expect(new Set(r.map((x) => Math.round(x.meanTotalSeconds))).size).toBe(4)
    const best = r.reduce((a, b) => (b.meanTotalSeconds < a.meanTotalSeconds ? b : a))
    expect(best).toBe(r[2])
  })

  it('shows the same totals at t=600 in the story snapshots', () => {
    const base = snapshotAt(original.config, s(600))
    expect(base.stations.map((st) => [st.queue, st.inService])).toEqual([[4, 1], [5, 1], [1, 1]])
    expect(base.completed).toBe(17)
    const extra = snapshotAt(cashier.config, s(600))
    expect(extra.stations.map((st) => [st.queue, st.inService])).toEqual([[0, 1], [9, 1], [0, 1]])
    expect(extra.completed).toBe(18)
    expect(extra.inShop).toBe(12)
  })
})

describe('model invariants', () => {
  it('conserves orders: arrived = queued + in service + completed, at every second', () => {
    for (const p of PRESETS) {
      const sim = new Simulation(p.config)
      for (let t = 0; t <= 1000; t++) {
        sim.advanceTo(s(t))
        const snap = sim.snapshot()
        const queued = snap.stations.reduce((n, st) => n + st.queue, 0)
        const serving = snap.stations.reduce((n, st) => n + st.inService, 0)
        expect(queued + serving + snap.completed).toBe(snap.arrived)
        expect(snap.inShop).toBe(queued + serving)
      }
    }
  })

  it('never has an order in two places or completes one twice', () => {
    const sim = runToCompletion(cashier.config)
    const orders = sim.history
    expect(orders).toHaveLength(ORDER_COUNT)
    for (const o of orders) {
      expect(o.departureMs).toBeGreaterThan(o.arrivalMs)
      for (let i = 0; i < 3; i++) {
        expect(o.serviceStartMs[i]).toBeGreaterThanOrEqual(o.stationArrivalMs[i])
        expect(o.serviceEndMs[i]).toBeGreaterThan(o.serviceStartMs[i])
      }
      // Leaves each station before entering the next, exactly when service ends.
      expect(o.stationArrivalMs[1]).toBe(o.serviceEndMs[0])
      expect(o.stationArrivalMs[2]).toBe(o.serviceEndMs[1])
      expect(o.departureMs).toBe(o.serviceEndMs[2])
    }
  })

  it('serves each station first come, first served', () => {
    for (const p of PRESETS) {
      const orders = [...runToCompletion(p.config).history]
      for (let i = 0; i < 3; i++) {
        const byStart = [...orders].sort((a, b) => a.serviceStartMs[i] - b.serviceStartMs[i] || a.id - b.id)
        const byArrival = [...orders].sort((a, b) => a.stationArrivalMs[i] - b.stationArrivalMs[i] || a.id - b.id)
        expect(byStart.map((o) => o.id)).toEqual(byArrival.map((o) => o.id))
      }
    }
  })

  it('admits no arrivals at or after t=600', () => {
    const sim = new Simulation(original.config)
    sim.advanceTo(s(5000))
    expect(Math.max(...sim.history.map((o) => o.arrivalMs))).toBe(s(580))
    expect(sim.snapshot().arrived).toBe(ORDER_COUNT)
  })

  it('gives the same result however time is batched (playback speed and frame rate)', () => {
    const run = (step: (i: number) => number) => {
      const sim = new Simulation(cashier.config)
      for (let t = 0, i = 0; t < s(1000); i++) {
        t = Math.min(s(1000), t + step(i))
        sim.advanceTo(t)
      }
      return JSON.stringify(sim.history)
    }
    const oneJump = run(() => s(1000))
    expect(run(() => 16)).toBe(oneJump)
    expect(run((i) => 1 + ((i * 7919) % 5000))).toBe(oneJump)
  })

  it('does not mutate presets; running twice gives identical results', () => {
    const before = JSON.stringify(PRESETS)
    const a = fullRunResult(barista)
    const b = fullRunResult(barista)
    expect(a).toEqual(b)
    expect(JSON.stringify(PRESETS)).toBe(before)
    expect(Object.isFrozen(PRESETS)).toBe(true)
  })

  it('does not count a partial average as the cohort mean', () => {
    const sim = new Simulation(original.config)
    sim.advanceTo(s(600))
    expect(completedBy(sim.history, s(600))).toBe(17)
    // Queue-wait mean only covers completed orders and is a different number than the full run.
    expect(meanQueueWaitSeconds(sim.history)[1]).not.toBeCloseTo(91, 0)
  })
})

describe('moving the extra worker', () => {
  it('moves an idle worker immediately', () => {
    const sim = new Simulation({ extra: 'off' })
    sim.setExtraWorker('drinks')
    const snap = sim.snapshot()
    expect(snap.stations[1].workers).toBe(2)
    expect(snap.extraWorker).toEqual({ at: 'drinks', pending: null, busy: false })
  })

  it('lets a busy worker finish the current order before moving, still counting at the old station', () => {
    const sim = new Simulation({ extra: 'order' })
    sim.advanceTo(s(61)) // order 3 arrived at 60 and the extra worker took it (done at 72)
    expect(sim.snapshot().extraWorker.busy).toBe(true)
    sim.setExtraWorker('drinks')
    sim.advanceTo(s(66))
    let snap = sim.snapshot()
    expect(snap.extraWorker).toEqual({ at: 'order', pending: 'drinks', busy: true })
    expect(snap.stations[0].workers).toBe(2)
    expect(snap.stations[1].workers).toBe(1)
    sim.advanceTo(s(72))
    snap = sim.snapshot()
    expect(snap.extraWorker.at).toBe('drinks')
    expect(snap.extraWorker.pending).toBeNull()
    expect(snap.stations[0].workers).toBe(1)
    expect(snap.stations[1].workers).toBe(2)
    // The order the worker was making still finished at its station, at 72 s.
    expect(sim.history[3].serviceEndMs[0]).toBe(s(72))
  })

  it('lets the latest choice win, and cancels when the current station is chosen again', () => {
    const sim = new Simulation({ extra: 'order' })
    sim.advanceTo(s(61))
    sim.setExtraWorker('drinks')
    sim.setExtraWorker('pickup')
    expect(sim.snapshot().extraWorker.pending).toBe('pickup')
    sim.setExtraWorker('order')
    expect(sim.snapshot().extraWorker.pending).toBeNull()
    sim.advanceTo(s(90))
    expect(sim.snapshot().extraWorker.at).toBe('order')
    expect(sim.workerEvents.map((e) => e.kind)).toEqual(['assigned', 'move-requested', 'move-requested', 'move-cancelled'])
  })

  it('goes off duty after finishing the current order, leaving one worker per station', () => {
    const sim = new Simulation({ extra: 'order' })
    sim.advanceTo(s(61))
    sim.setExtraWorker('off')
    sim.advanceTo(s(73))
    const snap = sim.snapshot()
    expect(snap.extraWorker.at).toBe('off')
    expect(snap.stations.map((st) => st.workers)).toEqual([1, 1, 1])
  })

  it('keeps queues at their stations when a worker moves', () => {
    const sim = new Simulation({ extra: 'off' })
    sim.advanceTo(s(300))
    const before = sim.snapshot().stations.map((st) => st.queue)
    sim.setExtraWorker('drinks')
    const after = sim.snapshot().stations.map((st) => st.queue)
    expect(after[0]).toBe(before[0])
    expect(after[2]).toBe(before[2])
  })

  it('applies a move only when time resumes (paused assignment waits)', () => {
    const sim = new Simulation({ extra: 'order' })
    sim.advanceTo(s(61))
    sim.setExtraWorker('pickup')
    // No time passes: the busy worker has not moved.
    expect(sim.snapshot().stations[2].workers).toBe(1)
    sim.advanceTo(s(72))
    expect(sim.snapshot().stations[2].workers).toBe(2)
  })
})
