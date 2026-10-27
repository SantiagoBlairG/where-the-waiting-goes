import { describe, expect, it } from 'vitest'
import { fullRunResult, PRESETS } from '@/simulation/presets'
import { ExperimentSession, MAX_TICK_MS, presetById } from './session'

/** Run a session to completion in 50 ms frames. */
function playToEnd(session: ExperimentSession) {
  session.play()
  for (let i = 0; i < 100_000 && session.mode === 'running'; i++) session.tick(50)
}

describe('presets and reset', () => {
  it('starts at t=0, paused, on the original team', () => {
    const s = new ExperimentSession()
    expect(s.timeMs).toBe(0)
    expect(s.mode).toBe('paused')
    expect(s.label).toBe('Original team')
    expect(s.snapshot().extraWorker.at).toBe('off')
  })

  it('selecting a preset resets to t=0 and pauses, even mid-run', () => {
    const s = new ExperimentSession()
    s.play()
    for (let i = 0; i < 40; i++) s.tick(50)
    expect(s.timeMs).toBeGreaterThan(0)
    s.selectPreset('barista')
    expect(s.timeMs).toBe(0)
    expect(s.mode).toBe('paused')
    expect(s.snapshot().stations[1].workers).toBe(2)
    expect(s.label).toBe('Extra barista')
  })

  it('restart keeps the allocation the visitor chose, clears history, and pauses', () => {
    const s = new ExperimentSession('original')
    s.assignExtra('drinks')
    s.play()
    for (let i = 0; i < 40; i++) s.tick(50)
    s.restart()
    expect(s.timeMs).toBe(0)
    expect(s.mode).toBe('paused')
    expect(s.orders.length).toBeLessThanOrEqual(1)
    expect(s.snapshot().stations[1].workers).toBe(2)
    expect(s.custom).toBe(true)
  })

  it('turns a pending move into the starting allocation on restart', () => {
    const s = new ExperimentSession('cashier')
    s.play()
    for (let i = 0; i < 22; i++) s.tick(100) // 22 s simulated: the extra cashier took order 1 at 20 s and is busy until 44 s
    s.assignExtra('pickup')
    expect(s.snapshot().extraWorker.pending).toBe('pickup')
    s.restart()
    expect(s.snapshot().extraWorker.at).toBe('pickup')
    expect(s.snapshot().extraWorker.pending).toBeNull()
  })
})

describe('playback', () => {
  it('does not advance while paused', () => {
    const s = new ExperimentSession()
    expect(s.tick(50)).toBe(false)
    expect(s.timeMs).toBe(0)
  })

  it('runs at 10x by default and at 1x on request, without changing the result', () => {
    const a = new ExperimentSession('cashier')
    a.play()
    for (let i = 0; i < 20; i++) a.tick(50) // 1 s real
    expect(a.timeMs).toBe(10_000)

    const b = new ExperimentSession('cashier')
    b.setSpeed(1)
    b.play()
    for (let i = 0; i < 20; i++) b.tick(50)
    expect(b.timeMs).toBe(1_000)
  })

  it('gives the same finished run at either speed and any frame size', () => {
    const fast = new ExperimentSession('barista')
    playToEnd(fast)
    const slow = new ExperimentSession('barista')
    slow.setSpeed(1)
    slow.play()
    for (let i = 0; i < 100_000 && slow.mode === 'running'; i++) slow.tick(97)
    expect(JSON.stringify(slow.orders)).toBe(JSON.stringify(fast.orders))
  })

  it('never jumps ahead after a stalled frame (no catch-up)', () => {
    const s = new ExperimentSession()
    s.play()
    s.tick(60_000) // a minute of real time passed since the last frame
    expect(s.timeMs).toBe(MAX_TICK_MS * 10)
  })

  it('is complete only when all 30 orders have left, and then stays complete', () => {
    const s = new ExperimentSession('original')
    playToEnd(s)
    expect(s.mode).toBe('complete')
    expect(s.snapshot().completed).toBe(30)
    expect(s.snapshot().inShop).toBe(0)
    s.play()
    expect(s.mode).toBe('complete')
    const t = s.timeMs
    s.tick(50)
    expect(s.timeMs).toBe(t)
  })

  it('a finished preset run matches the independent full-run results', () => {
    for (const p of PRESETS) {
      const s = new ExperimentSession(p.id)
      playToEnd(s)
      const full = fullRunResult(p)
      const last = Math.max(...s.orders.map((o) => o.departureMs)) / 1000
      expect(last).toBe(full.lastPickupSeconds)
    }
  })
})

describe('holds (dialogs) and pausing', () => {
  it('a dialog holds a running run and resumes it on close', () => {
    const s = new ExperimentSession()
    s.play()
    s.tick(50)
    s.hold('dialog')
    expect(s.mode).toBe('paused')
    const t = s.timeMs
    s.tick(50)
    expect(s.timeMs).toBe(t)
    s.release('dialog')
    expect(s.mode).toBe('running')
  })

  it('a dialog opened while paused does not start the run when it closes', () => {
    const s = new ExperimentSession()
    s.hold('dialog')
    s.release('dialog')
    expect(s.mode).toBe('paused')
  })

  it('an explicit pause is not undone by closing a dialog', () => {
    const s = new ExperimentSession()
    s.play()
    s.hold('dialog')
    s.pause()
    s.release('dialog')
    expect(s.mode).toBe('paused')
  })
})

describe('moving the extra worker', () => {
  it('labels the run Custom, based on the preset, and records the action with its time', () => {
    const s = new ExperimentSession('cashier')
    expect(s.label).toBe('Extra cashier')
    s.assignExtra('drinks')
    expect(s.label).toBe('Custom · based on Extra cashier')
    expect(s.actions).toEqual([{ timeMs: 0, to: 'drinks' }])
  })

  it('works while paused: an idle worker moves at once, a busy one waits until play resumes', () => {
    const s = new ExperimentSession('cashier')
    s.play()
    for (let i = 0; i < 6; i++) s.tick(50) // 3 s simulated: the extra cashier has not started yet (order 1 arrives at 20 s)
    s.pause()
    s.assignExtra('drinks')
    expect(s.snapshot().stations[1].workers).toBe(2) // idle: moved immediately

    const t = new ExperimentSession('cashier')
    t.play()
    for (let i = 0; i < 44; i++) t.tick(50) // 22 s: the extra cashier is serving order 1
    t.pause()
    t.assignExtra('drinks')
    expect(t.snapshot().extraWorker).toMatchObject({ at: 'order', pending: 'drinks', busy: true })
    const before = t.timeMs
    t.tick(50)
    expect(t.timeMs).toBe(before) // paused: the pending move waits
    t.play()
    for (let i = 0; i < 60; i++) t.tick(50) // 30 s more: past 44 s, when the order finishes
    expect(t.snapshot().extraWorker.at).toBe('drinks')
  })

  it('does not change the immutable preset definitions', () => {
    const before = JSON.stringify(PRESETS)
    const s = new ExperimentSession('barista')
    s.assignExtra('pickup')
    playToEnd(s)
    expect(JSON.stringify(PRESETS)).toBe(before)
    expect(presetById('barista').config.extra).toBe('drinks')
  })

  it('a custom run does not inherit the preset result', () => {
    const custom = new ExperimentSession('barista')
    custom.assignExtra('pickup')
    playToEnd(custom)
    const preset = fullRunResult(presetById('barista'))
    const last = Math.max(...custom.orders.map((o) => o.departureMs)) / 1000
    expect(last).not.toBe(preset.lastPickupSeconds)
  })
})
